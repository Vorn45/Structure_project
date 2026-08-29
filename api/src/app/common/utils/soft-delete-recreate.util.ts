// ===========================================================================>> Core Library
import { HttpException } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import { EntityManager, EntityTarget, DeepPartial, FindOptionsWhere, ObjectLiteral, } from 'typeorm';

// ======================================= >> Code Starts Here << ========================== //
export interface RecreateSoftDeletedOptions<T extends ObjectLiteral> {
    target: EntityTarget<T>;
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[];
    lockKey: string;
    create: () => DeepPartial<T>;
    restore: (existing: T) => DeepPartial<T>;
    activeConflict: () => HttpException;
}

export interface RecreateSoftDeletedResult<T> {
    entity: T;
    restored: boolean;
}

export function isUniqueViolation(error: unknown): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === '23505'
    );
}

export async function lockUniqueScope(
    manager: EntityManager,
    lockKey: string,
): Promise<void> {
    await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        lockKey,
    ]);
}

export async function recreateSoftDeleted<T extends ObjectLiteral>(
    manager: EntityManager,
    options: RecreateSoftDeletedOptions<T>,
): Promise<RecreateSoftDeletedResult<T>> {
    await lockUniqueScope(manager, options.lockKey);

    const repository = manager.getRepository(options.target);
    const existing = await repository.findOne({
        where: options.where,
        withDeleted: true,
    });

    if (existing && !existing.deleted_at) {
        throw options.activeConflict();
    }

    try {
        if (existing) {
            const entity = repository.merge(existing, {
                ...options.restore(existing),
                deleted_at: null,
            } as DeepPartial<T>);

            return {
                entity: await repository.save(entity),
                restored: true,
            };
        }

        return {
            entity: await repository.save(repository.create(options.create())),
            restored: false,
        };
    } catch (error) {
        if (isUniqueViolation(error)) throw options.activeConflict();
        throw error;
    }
}
