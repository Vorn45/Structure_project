import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { ConfigService } from '@nestjs/config';
import { appConfig } from 'src/app.config';

export const RedisOptions: CacheModuleAsyncOptions = {
    isGlobal: true,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
            socket: {
                host: configService.get('REDIS_HOST') || appConfig.REDIS.HOST,
                port: configService.get('REDIS_PORT') || appConfig.REDIS.PORT,
            },
        }),
        ttl: 0, // no expiration
    }),
};
