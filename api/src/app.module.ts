// ===========================================================================>> Core Library
import {
    MiddlewareConsumer,
    Module,
    NestModule,
    RequestMethod,
} from '@nestjs/common';
import { APP_FILTER, RouterModule } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// ===========================================================================>> Third Party Library
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';

// ===========================================================================>> Custom Library
// > Local
import { appConfig } from './app.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appRoutes } from './app/app.routes';
import { TelegramExceptionFilter } from './app/common/filters/telegram-exception.filter';
import { JwtMiddleware } from './app/common/middlewares/jwt.middleware';
import { AuthModule } from './app/resources/1-account/1-auth/auth.module';
import { AccountModule } from './app/resources/1-account/2-profile/account.module';
import { SharedModule } from './app/shared/shared.module';
import { typeOrmConfig } from './config/database.config';

// ======================================= >> Code Starts Here << ========================== //
@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot(typeOrmConfig),
        CacheModule.register({
            isGlobal: true,
        }),
        ScheduleModule.forRoot(),
        SharedModule,
        AuthModule,
        AccountModule,
        RouterModule.register(appRoutes),
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_FILTER,
            useClass: TelegramExceptionFilter,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        const version = appConfig.APP.VERSION;

        consumer
            .apply(JwtMiddleware)
            .exclude(
                { path: '', method: RequestMethod.GET },
                { path: `${version}/*path`, method: RequestMethod.ALL },
                { path: 'auth/*path', method: RequestMethod.POST },
                { path: 'account/auth/*path', method: RequestMethod.POST },
                {
                    path: 'account/profile/qr-login/status',
                    method: RequestMethod.GET,
                },
                {
                    path: 'account/profile/qr-login/scan',
                    method: RequestMethod.POST,
                },
                {
                    path: 'auth/telegram-bot/webhook',
                    method: RequestMethod.POST,
                },
            )
            .forRoutes({ path: '*', method: RequestMethod.ALL });
    }
}
