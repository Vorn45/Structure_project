import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class AppService {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    async getHello(): Promise<any> {
        const key = 'hello-key';

        // Check if value exists in Redis
        const cached = await this.cacheManager.get(key);
        if (cached) return { source: 'redis', data: cached };

        // Store value in Redis
        const data = 'Hello World';
        await this.cacheManager.set(key, data);
        return { source: 'api', data };
    }
}
