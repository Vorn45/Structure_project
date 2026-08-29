// ===========================================================================>> Third Party Library
import { NextFunction, Request, Response } from 'express';

// ======================================= >> Code Starts Here << ========================== //
const requestAliases: Record<string, string> = {
    type_project: 'typeproject',
    date_update: 'dateupdate',
    date_create: 'datecreate',
    function: 'Function',
};

function applyAliases(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => applyAliases(item));
    if (
        !value ||
        typeof value !== 'object' ||
        Object.getPrototypeOf(value) !== Object.prototype
    )
        return value;

    const record = value as Record<string, unknown>;

    for (const [snakeKey, legacyKey] of Object.entries(requestAliases)) {
        if (record[snakeKey] !== undefined && record[legacyKey] === undefined) {
            record[legacyKey] = record[snakeKey];
        }
    }

    for (const item of Object.values(record)) {
        applyAliases(item);
    }

    return record;
}

export function snakeCaseRequestAliasMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
) {
    applyAliases(req.body);
    applyAliases(req.query);
    next();
}
