import { DataSource } from 'typeorm';
import { UserSessionLogs } from 'src/app/model/user/user_session_logs.entity';
import { User } from 'src/app/model/user/users.entity';
import { UserDevice } from 'src/app/model/user/user_devices.entity';

export class UserSessionLogSeeder {
    public static async seed(dataSource: DataSource) {
        const userRepo = dataSource.getRepository(User);
        const deviceRepo = dataSource.getRepository(UserDevice);
        const logRepo = dataSource.getRepository(UserSessionLogs);

        const users = await userRepo.find({ order: { id: 'ASC' } });

        if (!users.length) {
            console.log(
                '\x1b[33mUser session log seed skipped because users are missing.\x1b[0m',
            );
            return;
        }

        const logProfiles = [
            {
                suffix: 'login',
                ip: '103.216.50.10',
                country_code: 'KH',
                region: 'Phnom Penh',
                city: 'Phnom Penh',
                latitude: 11.5564,
                longitude: 104.9282,
                timezone: 'Asia/Phnom_Penh',
            },
            {
                suffix: 'refresh',
                ip: '36.37.214.22',
                country_code: 'KH',
                region: 'Kandal',
                city: 'Ta Khmau',
                latitude: 11.4833,
                longitude: 104.95,
                timezone: 'Asia/Phnom_Penh',
            },
            {
                suffix: 'return',
                ip: '175.100.48.35',
                country_code: 'KH',
                region: 'Siem Reap',
                city: 'Siem Reap',
                latitude: 13.3671,
                longitude: 103.8448,
                timezone: 'Asia/Phnom_Penh',
            },
            {
                suffix: 'logout',
                ip: '103.216.50.11',
                country_code: 'KH',
                region: 'Phnom Penh',
                city: 'Phnom Penh',
                latitude: 11.5564,
                longitude: 104.9282,
                timezone: 'Asia/Phnom_Penh',
            },
        ];

        for (const [userIndex, user] of users.entries()) {
            const devices = await deviceRepo.find({
                where: { user_id: user.id },
                order: { id: 'ASC' },
            });

            for (const [deviceIndex, device] of devices.entries()) {
                for (const [logIndex, logProfile] of logProfiles.entries()) {
                    const seedLogDeviceId = `${device.device_id}-log-${logProfile.suffix}`;
                    const createdAt = new Date(
                        Date.UTC(
                            2026,
                            6,
                            2 + logIndex,
                            deviceIndex + 1,
                            (userIndex * 5 + logIndex * 9) % 60,
                        ),
                    );
                    const payload = {
                        user_id: user.id,
                        user_device_id: device.id,
                        device_id: seedLogDeviceId,
                        ip: logProfile.ip,
                        country_code: logProfile.country_code,
                        region: logProfile.region,
                        city: logProfile.city,
                        latitude: logProfile.latitude,
                        longitude: logProfile.longitude,
                        timezone: logProfile.timezone,
                        device_name: device.device_name,
                        platform: device.platform,
                        os: device.os,
                        browser: device.browser,
                        device_type: device.device_type,
                        user_agent: device.user_agent,
                        created_at: createdAt,
                    };
                    const exists = await logRepo.findOne({
                        where: {
                            user_id: user.id,
                            user_device_id: device.id,
                            device_id: seedLogDeviceId,
                        },
                    });

                    if (exists) {
                        await logRepo.save(Object.assign(exists, payload));
                    } else {
                        await logRepo.save(logRepo.create(payload));
                    }
                }
            }
        }

        console.log('\x1b[32mUser session log seeded successfully\x1b[0m');
    }
}
