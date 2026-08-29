import { Component, OnInit, signal } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@ngneat/transloco';
import { catchError, forkJoin, of } from 'rxjs';

import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import {
    profileCompactRelativeTime,
    profileDateValue,
} from '../../profile-display.util';
import { ProfileService } from '../../profile.service';
import {
    ProfileDevice,
    ProfileLoginHistory,
    ProfileSession,
    ProfileSessionLog,
} from '../../profile.type';

export interface LoginHistoryItem {
    id: number | string;
    ip: string;
    platform: string;
    location: string;
    icon: string;
    timeAgo: string;
    dateTime: string;
    isCurrent: boolean;
}

@Component({
    standalone: true,
    imports: [
        MatIconModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        SideDialogCloseButtonComponent,
        TranslocoModule,
    ],
    selector: 'login-history-profile-dialog',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
})
export class LoginHistoryProfileDialogComponent implements OnInit {
    readonly historyItems = signal<LoginHistoryItem[]>([]);
    readonly isLoading = signal(true);
    readonly hasLoadError = signal(false);

    constructor(private readonly _profileService: ProfileService) {}

    ngOnInit(): void {
        this.loadHistory();
    }

    loadHistory(): void {
        this.isLoading.set(true);
        this.hasLoadError.set(false);

        forkJoin({
            history: this._profileService.getLoginHistory(),
            devices: this._profileService.getDevices().pipe(
                catchError(() => of([] as ProfileDevice[])),
            ),
        }).subscribe({
            next: ({ history, devices }) => {
                this.historyItems.set(this.mapHistory(history, devices));
                this.isLoading.set(false);
            },
            error: () => {
                this.historyItems.set([]);
                this.isLoading.set(false);
                this.hasLoadError.set(true);
            },
        });
    }

    private mapHistory(
        history: ProfileLoginHistory,
        devices: ProfileDevice[],
    ): LoginHistoryItem[] {
        const explicitlyCurrentDevices = devices.filter((device) =>
            this.isCurrentDevice(device),
        );
        const newestDevice = this.findNewestDevice(devices);
        const currentDevices = explicitlyCurrentDevices.length > 0
            ? explicitlyCurrentDevices
            : newestDevice
                ? [newestDevice]
                : [];
        const currentDeviceIds = new Set(
            currentDevices
                .map((device) => device.device_id)
                .filter((deviceId): deviceId is string => !!deviceId),
        );
        // Session rows represent the latest state of a device and can be
        // updated on a later login. Session logs are immutable login events,
        // so use them for the history whenever the API provides them.
        const sessions = history.sessionLogs.length > 0
            ? history.sessionLogs.map((log) => this.sessionLogAsSession(log))
            : history.sessions.length > 0
                ? history.sessions
                : devices.map((device) => this.deviceAsSession(device));
        const devicesById = new Map(
            devices
                .filter((device) => !!device.device_id)
                .map((device) => [device.device_id as string, device]),
        );

        return [...sessions]
            .sort(
                (first, second) =>
                    profileDateValue(
                        this.sessionActivityValue(
                            second,
                            devicesById.get(second.device_id ?? ''),
                        ),
                    ) - profileDateValue(
                        this.sessionActivityValue(
                            first,
                            devicesById.get(first.device_id ?? ''),
                        ),
                    ),
            )
            .map((session, index) =>
                this.mapHistoryItem(
                    session,
                    devicesById.get(session.device_id ?? ''),
                    currentDeviceIds,
                    index,
                ),
            );
    }

    private mapHistoryItem(
        session: ProfileSession,
        device: ProfileDevice | undefined,
        currentDeviceIds: Set<string>,
        index: number,
    ): LoginHistoryItem {
        const isCurrent = this.isCurrentSession(session, currentDeviceIds);
        const activityValue = this.sessionActivityValue(session, device);

        return {
            id: session.id ?? `session-${index}`,
            ip: session.ip || device?.ip || 'មិនស្គាល់ IP',
            platform: this.platformLabel(session, device),
            location: this.locationLabel(session, device),
            icon: this.deviceIcon(session, device),
            timeAgo: profileCompactRelativeTime(activityValue),
            dateTime: this.formatDateTime(activityValue),
            isCurrent,
        };
    }

    private formatDateTime(value: string | number | null): string {
        const timestamp = profileDateValue(value);
        if (!timestamp) {
            return '';
        }

        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(timestamp);
    }

    private deviceAsSession(device: ProfileDevice): ProfileSession {
        return {
            id: device.id,
            device_id: device.device_id,
            device_name: device.device ?? device.name,
            platform: device.platform,
            os: device.os,
            browser: device.browser,
            device_type: device.device_type,
            ip: device.ip,
            country_code: device.country_code,
            city: device.city,
            last_activity_at: this.deviceActivityValue(device),
            created_at: device.created_at,
        };
    }

    private sessionLogAsSession(log: ProfileSessionLog): ProfileSession {
        return {
            id: log.id,
            device_id: log.device_id,
            device_name: log.device_name,
            platform: log.platform,
            os: log.os,
            browser: log.browser,
            device_type: log.device_type,
            user_agent: log.user_agent,
            ip: log.ip,
            created_at: log.created_at,
        };
    }

    private platformLabel(
        session: ProfileSession,
        device: ProfileDevice | undefined,
    ): string {
        return (
            session.os ||
            session.platform ||
            session.device_name ||
            device?.os ||
            device?.platform ||
            device?.device ||
            device?.name ||
            this.platformFromUserAgent(session.user_agent) ||
            'មិនស្គាល់ឧបករណ៍'
        );
    }

    private locationLabel(
        session: ProfileSession,
        device: ProfileDevice | undefined,
    ): string {
        const city = session.city || device?.city || session.region || device?.region;
        const country =
            this.countryLabel(session.country_code || device?.country_code) ||
            device?.country;
        return [city, country].filter(Boolean).join(', ') || 'មិនស្គាល់ទីតាំង';
    }

    private isCurrentDevice(device: ProfileDevice): boolean {
        const value =
            device.this_devices ?? device.is_current ?? device.current;
        return value === true || value === 1;
    }

    private isCurrentSession(
        session: ProfileSession,
        currentDeviceIds: Set<string>,
    ): boolean {
        return !!session.device_id && currentDeviceIds.has(session.device_id);
    }

    private findNewestDevice(devices: ProfileDevice[]): ProfileDevice | null {
        return [...devices].sort(
            (first, second) =>
                profileDateValue(this.deviceActivityValue(second)) -
                profileDateValue(this.deviceActivityValue(first)),
        )[0] ?? null;
    }

    private deviceActivityValue(
        device: ProfileDevice,
    ): string | number | null {
        return (
            device.last_time_access ??
            device.last_activity_at ??
            device.last_activity ??
            device.last_active_at ??
            device.last_active ??
            device.last_used_at ??
            device.logged_in_at ??
            device.date_log_in ??
            device.updated_at ??
            null
        );
    }

    private sessionActivityValue(
        session: ProfileSession,
        device: ProfileDevice | undefined,
    ): string | number | null {
        return session.last_activity_at ??
            session.created_at ??
            (device ? this.deviceActivityValue(device) : null) ??
            null;
    }

    private countryLabel(countryCode: string | null | undefined): string {
        if (!countryCode) {
            return '';
        }

        return countryCode.toUpperCase() === 'KH'
            ? 'Cambodia'
            : countryCode.toUpperCase();
    }

    private platformFromUserAgent(userAgent: string | null | undefined): string {
        const value = userAgent?.toLowerCase() ?? '';
        if (/iphone/.test(value)) return 'iPhone';
        if (/ipad/.test(value)) return 'iPad';
        if (/android/.test(value)) return 'Android';
        if (/windows/.test(value)) return 'Windows';
        if (/macintosh|mac os/.test(value)) return 'macOS';
        if (/linux/.test(value)) return 'Linux';
        return '';
    }

    private deviceIcon(
        session: ProfileSession,
        device: ProfileDevice | undefined,
    ): string {
        const value = [
            session.device_type,
            session.platform,
            session.os,
            session.user_agent,
            device?.device_type,
            device?.platform,
            device?.os,
        ].filter(Boolean).join(' ').toLowerCase();
        if (/mobile|phone|iphone|android/.test(value)) {
            return 'mdi:cellphone';
        }
        if (/tablet|ipad/.test(value)) {
            return 'mdi:tablet';
        }
        return 'mdi:monitor';
    }
}
