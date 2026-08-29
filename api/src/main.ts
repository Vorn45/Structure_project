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

async function bootstrap() {
    const logger = new Logger(bootstrap.name);
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Behind Nginx/load balancers, set TRUST_PROXY to the trusted hop count or
    // subnet (for example "1"). Without proxy trust, req.ip can be the proxy IP.
    if (appConfig.APP.TRUST_PROXY) {
        const trustProxy = /^\d+$/.test(appConfig.APP.TRUST_PROXY)
            ? Number(appConfig.APP.TRUST_PROXY)
            : appConfig.APP.TRUST_PROXY;
        app.set('trust proxy', trustProxy);
    }

    // Enable CORS for Next.js frontend
    app.enableCors({
        origin: [...appConfig.CORS.ORIGINS],
        methods: 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
        credentials: true,
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
