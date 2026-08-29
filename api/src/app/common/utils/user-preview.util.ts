export interface UserPreviewResult<T> {
    users: T[];
    num_user: number;
}

export function getUserPreview<T>(
    users: T[] | null | undefined,
    limit = 4,
): UserPreviewResult<T> {
    const projectUsers = Array.isArray(users) ? users : [];

    return {
        users: projectUsers.slice(0, limit),
        num_user: Math.max(projectUsers.length - limit, 0),
    };
}
