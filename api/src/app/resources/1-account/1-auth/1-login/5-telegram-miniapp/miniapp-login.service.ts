// ===========================================================================>> Core Library
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual }                            from 'crypto';

// ===========================================================================>> Third Party Library
import type { Request } from 'express';

// ===========================================================================>> Custom Library
// > Local
import { appConfig }            from 'src/app.config';
import { TelegramLoginDto }     from '../2-telegram/telegram-login.dto';
import { TelegramLoginService } from '../2-telegram/telegram-login.service';
import { MiniAppLoginDto }      from './miniapp-login.dto';

// ======================================= >> Code Starts Here << ========================== //
/** Shape of the `user` field inside initData (JSON-encoded by Telegram). */
interface InitDataUser {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
}

/** initData is re-issued by Telegram on every launch, so it should be fresh.
 *  Anything older is treated as a replay. */
const MAX_INIT_DATA_AGE_SECONDS = 60 * 60;

@Injectable()
export class MiniAppLoginService {
    constructor(private readonly _telegramLoginService: TelegramLoginService) {}

    /** Verifies initData per Telegram's Mini App spec. Note this uses a
     *  different secret derivation than the Login Widget: the bot token is the
     *  *message* and the literal 'WebAppData' is the *key*. */
    private verifyInitData(init_data: string): InitDataUser {
        if (!appConfig.AUTH.TELEGRAM_LOGIN_ENABLED)
            throw new BadRequestException(
                'Telegram Mini App login is disabled',
            );

        if (!appConfig.AUTH.TELEGRAM_BOT_TOKEN)
            throw new BadRequestException(
                'Telegram bot token is not configured',
            );

        const params = new URLSearchParams(init_data);
        const hash = params.get('hash');
        if (!hash)
            throw new UnauthorizedException('Invalid Telegram init data');

        // URLSearchParams decodes each value individually, so values containing
        // '&' or '=' survive intact. Decoding the whole string before splitting
        // would corrupt them.
        // Bot-token HMAC validation includes Telegram's newer `signature`
        // field. Only `hash` itself is removed from the data-check-string;
        // `signature` is excluded only by the separate Ed25519 third-party
        // validation flow.
        const checkString = [...params.entries()]
            .filter(([key]) => key !== 'hash')
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        const secretKey = createHmac('sha256', 'WebAppData')
            .update(appConfig.AUTH.TELEGRAM_BOT_TOKEN)
            .digest();
        const calculatedHash = createHmac('sha256', secretKey)
            .update(checkString)
            .digest('hex');

        const calculated = Buffer.from(calculatedHash, 'hex');
        const received = Buffer.from(hash, 'hex');

        if (
            calculated.length !== received.length ||
            !timingSafeEqual(calculated, received)
        ) {
            throw new UnauthorizedException('Invalid Telegram init data');
        }

        const authDate = Number(params.get('auth_date'));
        if (!authDate || Number.isNaN(authDate))
            throw new UnauthorizedException('Invalid Telegram init data');
        if (Date.now() / 1000 - authDate > MAX_INIT_DATA_AGE_SECONDS)
            throw new UnauthorizedException('Telegram init data expired');

        const rawUser = params.get('user');
        if (!rawUser)
            throw new UnauthorizedException('Invalid Telegram init data');

        try {
            const user = JSON.parse(rawUser) as InitDataUser;
            if (!user?.id) throw new Error('missing id');
            return user;
        } catch {
            throw new UnauthorizedException('Invalid Telegram init data');
        }
    }

    async login(dto: MiniAppLoginDto, req: Request) {
        const telegramUser = this.verifyInitData(dto.init_data);

        // Reuse the Login Widget provisioning path: same user lookup by
        // telegram_id, same role resolution, same token issuance.
        const loginDto: TelegramLoginDto = {
            telegram_id: telegramUser.id.toString(),
            telegram_username: telegramUser.username,
            telegram_photo_url: telegramUser.photo_url,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            device_id: dto.device_id,
            auth_date: Number(new URLSearchParams(dto.init_data).get('auth_date')),
            hash: '',
        };

        return await this._telegramLoginService.loginVerified(loginDto, req);
    }
}
