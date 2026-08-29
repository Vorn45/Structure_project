import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { appConfig } from 'src/app.config';

const ENTITY_SCHEMAS = [
    'activity',
    'application',
    'audit',
    'chat',
    'custom_field',
    'file',
    'meeting',
    'milestone',
    'notification',
    'organization',
    'project',
    'report',
    'sprint',
    'task',
    'user',
];

export const typeOrmConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: appConfig.DATABASE.HOST,
    port: appConfig.DATABASE.PORT,
    username: appConfig.DATABASE.USERNAME,
    password: appConfig.DATABASE.PASSWORD,
    database: appConfig.DATABASE.NAME,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: appConfig.DATABASE.SYNCHRONIZE, // Disable in production
    // synchronize: false
    extra: {
        // JIT compilation only pays off on long-running analytical queries.
        // This app's queries are OLTP-style (many small, join-heavy lookups)
        // whose planner cost estimates are prone to overshooting the JIT
        // threshold — e.g. team.service.ts's countByMember() was measured at
        // ~1.3s of JIT compile time for a query that executes in ~5ms.
        options: `-c search_path=${[...ENTITY_SCHEMAS, 'public'].join(',')} -c jit=off`,
    },
};
