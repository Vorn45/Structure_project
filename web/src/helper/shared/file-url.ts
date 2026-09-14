import { env } from 'envs/env';

/**
 * Resolves an API file reference (`{ uri, file_domain }`, a bare `uri` string,
 * or an already-absolute/data URL) to a displayable URL, mirroring the
 * domain-join logic duplicated across services (e.g. MemberService.fileUrl).
 */
export function resolveFileUrl(file: { uri?: string; url?: string; file_domain?: string } | string | null | undefined): string | null {
    if (!file) return null;

    const uri = typeof file === 'string' ? file : (file.url ?? file.uri);
    if (!uri) return null;

    if (/^(https?:|data:)/i.test(uri)) return uri;

    // Static local frontend assets should be served directly without domain prefix
    if (/^(\/)?(images|assets|icons|fonts)\//i.test(uri)) {
        return uri.startsWith('/') ? uri : `/${uri}`;
    }

    const fileDomain = typeof file === 'string' ? '' : (file.file_domain ?? '');

    // Local uploads (profile avatars, cover images) are saved to the API's
    // uploads/ directory and served by NestJS static assets middleware.
    // Use the API_BASE_URL origin so this works in both local dev (no nginx,
    // API on :3000) and production (nginx proxies /uploads/ to the API).
    if (/^(\/)?uploads\//i.test(uri) && !fileDomain) {
        try {
            const apiOrigin = new URL(env.API_BASE_URL).origin;
            const cleanPath = uri.replace(/^\/+/, '');
            return `${apiOrigin}/${cleanPath}`;
        } catch {
            // Fallback to relative path if URL parsing fails
            return uri.startsWith('/') ? uri : `/${uri}`;
        }
    }

    const rawDomain = fileDomain || env.FILE_BASE_URL || '';
    const domain = rawDomain.includes('${') ? '' : rawDomain.replace(/\/+$/, '');
    const path = uri.replace(/^\/+/, '');

    return domain ? `${domain}/${path}` : `/${path}`;
}
