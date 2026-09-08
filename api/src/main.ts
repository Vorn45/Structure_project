    import { NestFactory } from '@nestjs/core';
    import { AppModule } from './app.module';
    import { NestExpressApplication } from '@nestjs/platform-express';
    import { Logger, ValidationPipe } from '@nestjs/common';
    import { appConfig } from './app.config';
    import { SnakeCaseResponseInterceptor } from './app/common/interceptors/snake-case-response.interceptor';
    import { LoggingInterceptor } from './app/common/interceptors/logging.interceptor';
    import { RefreshTokenCookieInterceptor } from './app/common/interceptors/refresh-token-cookie.interceptor';
    import { snakeCaseRequestAliasMiddleware } from './app/common/middlewares/snake-case-request-alias.middleware';
    // import { join } from 'path';

    import session from 'express-session';
    import { DataSource } from 'typeorm';
    import { User } from './app/model/user/users.entity';
    import { Role } from './app/model/user/role.entity';
    import { UserRole } from './app/model/user/user_role.entity';
    import * as bcrypt from 'bcrypt';
    import { AuthProvider } from './app/enum/pms.enum';

    async function autoSeedUsers(dataSource: DataSource) {
        try {
            const userRepo = dataSource.getRepository(User);
            const roleRepo = dataSource.getRepository(Role);
            const userRoleRepo = dataSource.getRepository(UserRole);

            const targetUsers = [
                {
                    phone: '010843612',
                    name_en: 'PISETH PANHAVORN',
                    name_kh: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត',
                    email: 'pisethpanhavorn544@gmail.com',
                    roles: ['superadmin', 'user'],
                    telegram_id: '8836877586',
                },
                {
                    phone: '087280875',
                    name_en: 'PUM BRUSMUNY',
                    name_kh: 'ពុំ ប្រុសមុន្នី',
                    email: 'pumprusmuny@example.com',
                    roles: ['user'],
                    telegram_id: null,
                },
                {
                    phone: '067776682',
                    name_en: 'THA WINNER',
                    name_kh: 'ថា វីនណឺរ',
                    email: 'thawinner@example.com',
                    roles: ['user'],
                    telegram_id: '1174417436',
                },
            ];

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('wms@1234', salt);
            const availableRoles = await roleRepo.find();

            for (const target of targetUsers) {
                let u = await userRepo.findOne({ where: { phone: target.phone } });
                if (!u) {
                    u = userRepo.create({
                        phone: target.phone,
                        name_en: target.name_en,
                        name_kh: target.name_kh,
                        email: target.email,
                        telegram_id: target.telegram_id as any,
                        password: passwordHash,
                        is_active: 1,
                        sex_id: 1,
                        auth_provider: AuthProvider.LOCAL,
                    });
                    u = await userRepo.save(u);
                } else {
                    u.name_en = target.name_en;
                    u.name_kh = target.name_kh;
                    u.email = target.email;
                    if (target.telegram_id) {
                        u.telegram_id = target.telegram_id;
                    }
                    u.password = passwordHash;
                    u.is_active = 1;
                    u = await userRepo.save(u);
                }

                for (const rSlug of target.roles) {
                    const r = availableRoles.find((role) => role.slug === rSlug);
                    if (r) {
                        const existingUr = await userRoleRepo.findOne({
                            where: { user_id: u.id, role_id: r.id },
                        });
                        if (!existingUr) {
                            await userRoleRepo.save(
                                userRoleRepo.create({
                                    user_id: u.id,
                                    role_id: r.id,
                                    organization_id: null as any,
                                }),
                            );
                        }
                    }
                }
            }
            console.log('\x1b[32m[AutoSeed] Verified clean users in DB on startup.\x1b[0m');
        } catch (err: any) {
            console.warn('[AutoSeed] Startup user verification warning:', err?.message || err);
        }
    }

    async function bootstrap() {
        const logger = new Logger(bootstrap.name);
        const app = await NestFactory.create<NestExpressApplication>(AppModule);

        try {
            const ds = app.get(DataSource);
            await autoSeedUsers(ds);
        } catch (e) {}

        // Behind Nginx/load balancers, set TRUST_PROXY to the trusted hop count or
        // subnet (for example "1"). Without proxy trust, req.ip can be the proxy IP.
        if (appConfig.APP.TRUST_PROXY) {
            const trustProxy = /^\d+$/.test(appConfig.APP.TRUST_PROXY)
                ? Number(appConfig.APP.TRUST_PROXY)
                : appConfig.APP.TRUST_PROXY;
            app.set('trust proxy', trustProxy);
        }

        // Enable CORS for frontend
        app.enableCors({
            origin: [
                'https://structure-project-ten.vercel.app',
                'http://localhost:4200',
                'http://localhost:4002',
                ...appConfig.CORS.ORIGINS,
            ],
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
            credentials: true,
            allowedHeaders: 'Content-Type, Accept, Authorization',
        });

        app.useBodyParser('json', { limit: '1024mb' });
        app.useBodyParser('urlencoded', { limit: '1024mb', extended: true });
        app.useBodyParser('text', { limit: '1024mb' });
        app.use(snakeCaseRequestAliasMiddleware);

        app.setGlobalPrefix(appConfig.APP.GLOBAL_PREFIX);
        app.useGlobalInterceptors(
            new RefreshTokenCookieInterceptor(),
            new LoggingInterceptor(),
            new SnakeCaseResponseInterceptor(),
        );

        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                errorHttpStatusCode: 422,
            }),
        );

        if (!appConfig.APP.SESSION_SECRET) {
            throw new Error(
                'SESSION_SECRET_KEY or SESSION_SECRET is required for sessions',
            );
        }

        app.use(
            session({
                secret: appConfig.APP.SESSION_SECRET, // change this in production
                resave: false,
                saveUninitialized: false,
                cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 30 }, // 30 minutes
            }),
        );

        // Run NestJS on a different port to avoid conflict with Next.js
        await app.listen(appConfig.APP.PORT);
        logger.log(
            `\x1b[32mNest application running on host: \x1b[34mhttp://localhost:${appConfig.APP.PORT}\x1b[37m`,
        );
    }
    bootstrap();
