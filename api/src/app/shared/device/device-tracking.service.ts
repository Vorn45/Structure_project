// ===========================================================================>> Core Library
import { Injectable }       from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash }       from 'crypto';

// ===========================================================================>> Third Party Library
import * as geoip             from 'geoip-lite';
import { UAParser }           from 'ua-parser-js';
import { IsNull, Repository } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { DeviceType }      from 'src/app/enum/device-type.enum';
import { UserDevice }      from 'src/app/model/user/user_devices.entity';
import { UserSessionLogs } from 'src/app/model/user/user_session_logs.entity';
import { UserSessions }    from 'src/app/model/user/user_sessions.entity';

// ======================================= >> Code Starts Here << ========================== //
export interface ParsedDeviceInfo {
    browser: string;
    browser_name: string;
    os: string;
    os_name: string;
    platform: string;
    device_name: string;
    device_type: string;
    user_agent: string;
}

export interface IpLocation {
    country_code: string | null;
    region: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    timezone: string | null;
}

export interface TrackDeviceOptions {
    device_id?: string | null;
    login_method?: number;
    create_history?: boolean;
}

export interface ClientRequest {
    headers?: Record<string, string | string[] | undefined>;
    ip?: string;
    socket?: {
        remoteAddress?: string;
    };
    body?: unknown;
}

@Injectable()
export class DeviceTrackingService {
    constructor(
        @InjectRepository(UserDevice)
        private readonly deviceRepo: Repository<UserDevice>,
        @InjectRepository(UserSessions)
        private readonly sessionRepo: Repository<UserSessions>,
        @InjectRepository(UserSessionLogs)
        private readonly sessionLogRepo: Repository<UserSessionLogs>,
    ) {}

    /**
     * Proxies append addresses to x-forwarded-for, so the first value is the
     * original client. Production must configure trusted proxies so these
     * headers cannot be spoofed by direct clients.
     */
    getClientIp(req: ClientRequest): string | null {
        const cfConnectingIp = this.getHeader(req, 'cf-connecting-ip');
        const trueClientIp = this.getHeader(req, 'true-client-ip');
        const xClientIp = this.getHeader(req, 'x-client-ip');
        const forwardedFor = this.getHeader(req, 'x-forwarded-for');
        const realIp = this.getHeader(req, 'x-real-ip');
        const rawIp =
            cfConnectingIp?.trim() ||
            trueClientIp?.trim() ||
            xClientIp?.trim() ||
            forwardedFor?.split(',')[0]?.trim() ||
            realIp?.trim() ||
            req?.ip ||
            req?.socket?.remoteAddress ||
            null;

        return this.normalizeIp(rawIp);
    }

    /**
     * Postman and server-to-server clients often send a generic User-Agent, so
     * vendor/model fields can legitimately remain Unknown even when parsing works.
     */
    parseUserAgent(userAgent = ''): ParsedDeviceInfo {
        const result = new UAParser(userAgent).getResult();
        const browserName = result.browser.name || 'Unknown';
        const browser = this.withVersion(browserName, result.browser.version);
        const osName = result.os.name || 'Unknown';
        const os = this.withVersion(osName, result.os.version);
        const vendor = result.device.vendor || null;
        const model = result.device.model || null;
        const deviceType = result.device.type || DeviceType.DESKTOP;
        const platform = vendor || (osName !== 'Unknown' ? osName : 'Unknown');

        return {
            browser,
            browser_name: browserName,
            os,
            os_name: osName,
            platform,
            device_name: this.buildDeviceName(
                {
                    browser,
                    browser_name: browserName,
                    os,
                    os_name: osName,
                    platform,
                    device_name: '',
                    device_type: deviceType,
                    user_agent: userAgent,
                },
                vendor,
                model,
            ),
            device_type: deviceType,
            user_agent: userAgent,
        };
    }

    /**
     * Localhost and private network addresses are not globally routable, so no
     * country/city can be derived for them. Lookup failures intentionally return nulls.
     */
    getIpLocation(ip: string | null, req?: ClientRequest): IpLocation {
        const emptyLocation: IpLocation = {
            country_code: null,
            region: null,
            city: null,
            latitude: null,
            longitude: null,
            timezone: null,
        };

        const cfCountry = req ? this.getHeader(req, 'cf-ipcountry') : null;
        const cfCity = req ? this.getHeader(req, 'cf-ipcity') : null;
        const cfRegion = req ? this.getHeader(req, 'cf-region') : null;

        if (!ip || this.isPrivateIp(ip)) {
            if (cfCountry && cfCountry !== 'XX') {
                return {
                    ...emptyLocation,
                    country_code: cfCountry,
                    city: cfCity || null,
                    region: cfRegion || null,
                };
            }
            return emptyLocation;
        }

        try {
            const location = geoip.lookup(ip);
            return {
                country_code: cfCountry && cfCountry !== 'XX' ? cfCountry : (location?.country || null),
                region: cfRegion || location?.region || null,
                city: cfCity || location?.city || null,
                latitude: location?.ll?.[0] ?? null,
                longitude: location?.ll?.[1] ?? null,
                timezone: location?.timezone || null,
            };
        } catch {
            return {
                ...emptyLocation,
                country_code: cfCountry && cfCountry !== 'XX' ? cfCountry : null,
                city: cfCity || null,
                region: cfRegion || null,
            };
        }
    }

    buildDeviceName(
        parsed: ParsedDeviceInfo,
        vendor?: string | null,
        model?: string | null,
    ): string {
        if (parsed.browser_name !== 'Unknown' || parsed.os_name !== 'Unknown') {
            return `${parsed.browser_name} on ${parsed.os_name}`;
        }
        const hardware = [vendor, model].filter(Boolean).join(' ').trim();
        if (hardware) return hardware;
        return 'Unknown Device';
    }

    getCountryName(countryCode?: string | null): string | null {
        if (!countryCode) return null;
        try {
            return (
                new Intl.DisplayNames(['en'], { type: 'region' }).of(
                    countryCode,
                ) ?? countryCode
            );
        } catch {
            return countryCode;
        }
    }

    buildDeviceId(
        userId: number,
        req: ClientRequest,
        parsed: ParsedDeviceInfo,
    ): string {
        const body =
            req.body && typeof req.body === 'object'
                ? (req.body as Record<string, unknown>)
                : {};
        const suppliedDeviceId =
            this.getHeader(req, 'x-device-id') ||
            body.device_id ||
            body.deviceId;

        if (typeof suppliedDeviceId === 'string' && suppliedDeviceId.trim()) {
            return suppliedDeviceId.trim().slice(0, 255);
        }

        const fingerprint = [
            userId,
            this.getClientIp(req) || '',
            parsed.user_agent,
            parsed.platform,
            parsed.os,
            parsed.browser,
        ].join('|');

        return createHash('sha256').update(fingerprint).digest('hex');
    }

    getRequestDeviceId(userId: number, req: ClientRequest): string {
        const parsed = this.parseUserAgent(
            this.getHeader(req, 'user-agent') || '',
        );
        return this.buildDeviceId(userId, req, parsed);
    }

    async trackLogin(
        userId: number,
        req: ClientRequest,
        options: TrackDeviceOptions = {},
    ) {
        const parsed = this.parseUserAgent(
            this.getHeader(req, 'user-agent') || '',
        );
        const ip = this.getClientIp(req);
        const location = this.getIpLocation(ip, req);
        const deviceId =
            options.device_id?.trim().slice(0, 255) ||
            this.buildDeviceId(userId, req, parsed);
        const now = new Date();

        const device = await this.upsertDevice(
            userId,
            deviceId,
            parsed,
            ip,
            location,
            now,
        );
        const session = await this.upsertSession(
            userId,
            device.id,
            ip,
            location,
            options.login_method ?? 1,
            now,
        );

        if (options.create_history !== false) {
            await this.createLoginHistory(
                userId,
                device.id,
                deviceId,
                parsed,
                ip,
                location,
            );
        }

        return { device, session, parsed, ip, location };
    }

    async touchActivity(
        userId: number,
        req: ClientRequest,
        options: TrackDeviceOptions = {},
    ) {
        return await this.trackLogin(userId, req, {
            ...options,
            create_history: false,
        });
    }

    async logout(userId: number, req: ClientRequest, deviceId?: string | null) {
        const parsed = this.parseUserAgent(
            this.getHeader(req, 'user-agent') || '',
        );
        const resolvedDeviceId =
            deviceId?.trim().slice(0, 255) ||
            this.buildDeviceId(userId, req, parsed);
        const device = await this.deviceRepo.findOne({
            where: { user_id: userId, device_id: resolvedDeviceId },
        });

        if (!device) return null;

        const now = new Date();
        await Promise.all([
            this.deviceRepo.update(device.id, { last_activity_at: now }),
            this.sessionRepo.update(
                { user_id: userId, user_device_id: device.id, is_active: true },
                { is_active: false, logged_out_at: now, last_activity_at: now },
            ),
        ]);

        return device;
    }

    async getActiveDevicesByUser(
        userId: number,
        currentDeviceId?: string | null,
    ) {
        const sessions = await this.sessionRepo.find({
            where: {
                user_id: userId,
                is_active: true,
                logged_out_at: IsNull(),
                deleted_at: IsNull(),
            },
            relations: ['device'],
            order: {
                last_activity_at: 'DESC',
                id: 'DESC',
            },
        });

        const latestByDevice = new Map<number, UserSessions>();

        for (const session of sessions) {
            if (!session.device || latestByDevice.has(session.user_device_id))
                continue;
            latestByDevice.set(session.user_device_id, session);
        }

        return Array.from(latestByDevice.values()).map((session) => {
            const device = session.device;
            const countryCode = session.country_code ?? device.country_code;

            return {
                id: device.id,
                device: device.device_name ?? 'Unknown Device',
                device_id: device.device_id ?? null,
                device_type: device.device_type ?? null,
                platform: device.platform ?? null,
                os: device.os ?? null,
                browser: device.browser ?? null,
                this_devices: Boolean(
                    currentDeviceId && device.device_id === currentDeviceId,
                ),
                country: this.getCountryName(countryCode),
                country_code: countryCode ?? null,
                city: session.city ?? device.city ?? null,
                last_time_access:
                    session.last_activity_at ??
                    device.last_activity_at ??
                    session.updated_at,
            };
        });
    }

    private async upsertDevice(
        userId: number,
        deviceId: string,
        parsed: ParsedDeviceInfo,
        ip: string | null,
        location: IpLocation,
        now: Date,
    ) {
        const data = {
            user_id: userId,
            device_id: deviceId,
            device_name: parsed.device_name,
            platform: parsed.platform,
            os: parsed.os,
            browser: parsed.browser,
            user_agent: parsed.user_agent,
            device_type: parsed.device_type,
            ip,
            ...location,
            last_activity_at: now,
            deleted_at: null,
        };

        let device = await this.deviceRepo.findOne({
            where: { user_id: userId, device_id: deviceId },
        });
        if (!device) {
            device = await this.deviceRepo.findOne({
                where: { user_id: userId, device_id: deviceId },
                withDeleted: true,
                order: { updated_at: 'DESC' },
            });
        }

        if (device) {
            await this.deviceRepo.update(device.id, data);
            return this.deviceRepo.create({ ...device, ...data });
        }

        try {
            return await this.deviceRepo.save(this.deviceRepo.create(data));
        } catch (error: unknown) {
            if ((error as { code?: string })?.code !== '23505') throw error;
            device = await this.deviceRepo.findOne({
                where: { user_id: userId, device_id: deviceId },
            });
            if (!device) throw error;
            await this.deviceRepo.update(device.id, data);
            return this.deviceRepo.create({ ...device, ...data });
        }
    }

    private async upsertSession(
        userId: number,
        userDeviceId: number,
        ip: string | null,
        location: IpLocation,
        loginMethod: number,
        now: Date,
    ) {
        const data = {
            ip,
            ...location,
            login_method: loginMethod,
            is_active: true,
            logged_out_at: null,
            last_activity_at: now,
            deleted_at: null,
        };

        const session = await this.sessionRepo.findOne({
            where: { user_id: userId, user_device_id: userDeviceId },
            order: { id: 'DESC' },
            withDeleted: true,
        });

        if (session) {
            await this.sessionRepo.update(session.id, data);
            return this.sessionRepo.create({ ...session, ...data });
        }

        return await this.sessionRepo.save(
            this.sessionRepo.create({
                user_id: userId,
                user_device_id: userDeviceId,
                ...data,
            }),
        );
    }

    private async createLoginHistory(
        userId: number,
        userDeviceId: number,
        deviceId: string,
        parsed: ParsedDeviceInfo,
        ip: string | null,
        location: IpLocation,
    ) {
        return await this.sessionLogRepo.save(
            this.sessionLogRepo.create({
                user_id: userId,
                user_device_id: userDeviceId,
                device_id: deviceId,
                ip,
                ...location,
                device_name: parsed.device_name,
                platform: parsed.platform,
                os: parsed.os,
                browser: parsed.browser,
                device_type: parsed.device_type,
                user_agent: parsed.user_agent,
            }),
        );
    }

    private getHeader(req: ClientRequest, name: string): string | null {
        const value = req?.headers?.[name];
        if (Array.isArray(value)) return value[0] || null;
        return typeof value === 'string' ? value : null;
    }

    private normalizeIp(ip: string | null): string | null {
        if (!ip) return null;
        let normalized = ip.trim();
        if (normalized === '::1' || normalized === '::ffff:127.0.0.1')
            return '127.0.0.1';
        if (normalized.startsWith('::ffff:')) normalized = normalized.slice(7);
        if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(normalized)) {
            normalized = normalized.replace(/:\d+$/, '');
        }
        return normalized;
    }

    private isPrivateIp(ip: string): boolean {
        if (ip === '127.0.0.1' || ip === '0.0.0.0' || ip === '::') return true;
        if (
            /^10\./.test(ip) ||
            /^192\.168\./.test(ip) ||
            /^169\.254\./.test(ip)
        )
            return true;
        const match = ip.match(/^172\.(\d+)\./);
        if (match && Number(match[1]) >= 16 && Number(match[1]) <= 31)
            return true;
        if (/^(fc|fd|fe8|fe9|fea|feb)/i.test(ip)) return true;
        return false;
    }

    private withVersion(name: string, version?: string): string {
        if (!version) return name;
        const versionParts = version.split('.');
        const normalizedVersion =
            name === 'macOS' ? versionParts.join('.') : versionParts[0];
        return `${name} ${normalizedVersion}`;
    }
}
