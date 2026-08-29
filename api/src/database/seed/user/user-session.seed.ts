import { DataSource } from 'typeorm';
import { UserSessions } from 'src/app/model/user/user_sessions.entity';
import { User } from 'src/app/model/user/users.entity';
import { UserDevice } from 'src/app/model/user/user_devices.entity';

export class UserSessionSeeder {
    public static async seed(dataSource: DataSource) {
        const userRepo = dataSource.getRepository(User);
        const deviceRepo = dataSource.getRepository(UserDevice);
        const sessionRepo = dataSource.getRepository(UserSessions);

        const users = await userRepo.find({ order: { id: 'ASC' } });

        if (!users.length) {
            console.log(
                '\x1b[33mUser session seed skipped because users are missing.\x1b[0m',
            );
            return;
        }

        const deviceProfiles = [
            {
                key: 'desktop',
                device_name: 'Seed MacBook Pro',
                platform: 'web',
                os: 'macOS',
                browser: 'Chrome',
                user_agent:
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 Chrome/126.0 Safari/537.36',
                device_type: 'desktop',
                ip: '103.216.50.10',
                country_code: 'KH',
                region: 'Phnom Penh',
                city: 'Phnom Penh',
                latitude: 11.5564,
                longitude: 104.9282,
                timezone: 'Asia/Phnom_Penh',
            },
            {
                key: 'mobile',
                device_name: 'Seed iPhone',
                platform: 'mobile',
                os: 'iOS',
                browser: 'Safari',
                user_agent:
                    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1',
                device_type: 'mobile',
                ip: '36.37.214.22',
                country_code: 'KH',
                region: 'Kandal',
                city: 'Ta Khmau',
                latitude: 11.4833,
                longitude: 104.95,
                timezone: 'Asia/Phnom_Penh',
            },
            {
                key: 'tablet',
                device_name: 'Seed iPad',
                platform: 'tablet',
                os: 'iPadOS',
                browser: 'Safari',
                user_agent:
                    'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1',
                device_type: 'tablet',
                ip: '175.100.48.35',
                country_code: 'KH',
                region: 'Siem Reap',
                city: 'Siem Reap',
                latitude: 13.3671,
                longitude: 103.8448,
                timezone: 'Asia/Phnom_Penh',
            },
        ];

        for (const [userIndex, user] of users.entries()) {
            for (const [deviceIndex, profile] of deviceProfiles.entries()) {
                const lastActivityAt = new Date(
                    Date.UTC(
                        2026,
                        6,
                        3,
                        2 + deviceIndex,
                        (userIndex * 7 + deviceIndex * 11) % 60,
                    ),
                );
                let device = await deviceRepo.findOne({
                    where: {
                        user_id: user.id,
                        device_id: `seed-${user.id}-${profile.key}`,
                    },
                });

                const devicePayload = {
                    user_id: user.id,
                    device_id: `seed-${user.id}-${profile.key}`,
                    device_name: profile.device_name,
                    platform: profile.platform,
                    os: profile.os,
                    browser: profile.browser,
                    user_agent: profile.user_agent,
                    device_type: profile.device_type,
                    ip: profile.ip,
                    country_code: profile.country_code,
                    region: profile.region,
                    city: profile.city,
                    latitude: profile.latitude,
                    longitude: profile.longitude,
                    timezone: profile.timezone,
                    last_activity_at: lastActivityAt,
                };

                if (device) {
                    device = await deviceRepo.save(
                        Object.assign(device, devicePayload),
                    );
                } else {
                    device = await deviceRepo.save(
                        deviceRepo.create(devicePayload),
                    );
                }

                const sessionPayload = {
                    user_id: user.id,
                    user_device_id: device.id,
                    ip: profile.ip,
                    country_code: profile.country_code,
                    region: profile.region,
                    city: profile.city,
                    latitude: profile.latitude,
                    longitude: profile.longitude,
                    timezone: profile.timezone,
                    login_method: (deviceIndex % 2) + 1,
                    is_active: deviceIndex !== 2,
                    restricted_attempt: false,
                    last_activity_at: lastActivityAt,
                    logged_out_at:
                        deviceIndex === 2
                            ? new Date(
                                  Date.UTC(2026, 6, 3, 4, (userIndex * 7) % 60),
                              )
                            : null,
                };
                const exists = await sessionRepo.findOne({
                    where: { user_id: user.id, user_device_id: device.id },
                });

                if (exists) {
                    await sessionRepo.save(
                        Object.assign(exists, sessionPayload),
                    );
                } else {
                    await sessionRepo.save(sessionRepo.create(sessionPayload));
                }
            }
        }

        console.log('\x1b[32mUser session seeded successfully\x1b[0m');
    }
}
