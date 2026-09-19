import { env } from 'envs/env';

/**
 * Resolves an API file reference (`{ uri, file_domain }`, a bare `uri` string,
 * or an already-absolute/data URL) to a displayable URL, mirroring the
 * domain-join logic duplicated across services (e.g. MemberService.fileUrl).
 */
export function resolveFileUrl(
    file: { uri?: string | null; url?: string | null; file_domain?: string | null } | string | null | undefined
): string | null {
    if (!file) return null;

    let uri = typeof file === 'string' ? file : (file.url ?? file.uri ?? undefined);
    if (!uri) return null;

    // Support blob: and data: preview URLs directly
    if (uri.startsWith('blob:') || uri.startsWith('data:image/')) {
        return uri;
    }

    // If an absolute URL points to localhost or 127.0.0.1 (any port, e.g. :3000, :4500, or none),
    // strip the localhost prefix so it can be handled dynamically across environments
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/(uploads|storage)\//i.test(uri)) {
        uri = uri.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i, '');
    }

    // Static local frontend assets should be served directly without domain prefix
    if (/^(\/)?(images|assets|icons|fonts)\//i.test(uri)) {
        return uri.startsWith('/') ? uri : `/${uri}`;
    }

    // If it's a real external absolute URL (e.g., S3, CDN, remote HTTPS), return it directly
    if (/^https?:\/\//i.test(uri)) {
        return uri;
    }

    const path = uri.replace(/^\/+/, '');
    const isLocalUpload = path.startsWith('uploads/') || path.startsWith('storage/');
    let rawDomain = (typeof file === 'string' ? '' : file.file_domain) || '';

    // If rawDomain points to localhost/127.0.0.1 and we are not on local dev server, clear it
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(rawDomain.trim())) {
        rawDomain = '';
    }

    // Handle local uploads (saved to the app server's local disk / Docker volume)
    if (isLocalUpload) {
        if (typeof window !== 'undefined') {
            const isDevServer =
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
                window.location.port === '4200';

            // When browsing on Angular dev server (:4200), point to NestJS backend on :3000
            if (isDevServer) {
                return `http://localhost:3000/${path}`;
            }

            // When browsing on remote server / NAS / Nginx gateway (:4500 or standard 80/443),
            // always route through current origin to avoid ERR_CONNECTION_REFUSED
            return `/${path}`;
        }
        return `http://localhost:3000/${path}`;
    }

    if (!rawDomain) {
        rawDomain = env.FILE_BASE_URL || '';
    }

    const domain = rawDomain.includes('${') ? '' : rawDomain.replace(/\/+$/, '');
    return domain ? `${domain}/${path}` : `/${path}`;
}
