// ===========================================================================>> Core Library
import { CallHandler, ExecutionContext, Injectable, NestInterceptor, } from '@nestjs/common';
import { Observable, map }                                             from 'rxjs';

// ======================================= >> Code Starts Here << ========================== //
type JsonValue =
    | null
    | string
    | number
    | boolean
    | Date
    | JsonValue[]
    | { [key: string]: JsonValue };

@Injectable()
export class SnakeCaseResponseInterceptor implements NestInterceptor {
    intercept(
        _context: ExecutionContext,
        next: CallHandler,
    ): Observable<unknown> {
        return next.handle().pipe(map((data) => this.toSnakeCaseValue(data)));
    }

    private toSnakeCaseValue(value: unknown): unknown {
        if (Array.isArray(value))
            return value.map((item) => this.toSnakeCaseValue(item));
        if (!this.isPlainObject(value)) return value;

        return Object.entries(value as Record<string, JsonValue>).reduce(
            (result, [key, item]) => {
                result[this.toSnakeCaseKey(key)] = this.toSnakeCaseValue(item);
                return result;
            },
            {} as Record<string, unknown>,
        );
    }

    private isPlainObject(value: unknown): value is Record<string, JsonValue> {
        if (!value || typeof value !== 'object') return false;
        if (value instanceof Date) return false;
        if (Buffer.isBuffer(value)) return false;
        return Object.getPrototypeOf(value) === Object.prototype;
    }

    private toSnakeCaseKey(key: string) {
        const specialCases: Record<string, string> = {
            Function: 'function',
            typeproject: 'type_project',
            dateupdate: 'date_update',
            datecreate: 'date_create',
        };

        if (specialCases[key]) return specialCases[key];

        return key
            .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
            .replace(/[-\s]+/g, '_')
            .toLowerCase();
    }
}
