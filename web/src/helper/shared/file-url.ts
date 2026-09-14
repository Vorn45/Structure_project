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

    const path = uri.replace(/^\/+/, '');
    const isLocalUpload = path.startsWith('uploads/') || path.startsWith('storage/');
    let rawDomain = (typeof file === 'string' ? '' : file.file_domain) || '';

    // Handle local uploads (saved to the app server's local disk)
    if (isLocalUpload) {
        if (typeof window !== 'undefined') {
            const isDevServer =
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
                window.location.port === '4200';

            // If accessed via server URL, domain, or Nginx gateway (not Angular dev server :4200),
            // use relative path so it routes through the gateway / current origin and avoids Mixed Content
            if (!isDevServer || !rawDomain) {
                if (rawDomain.includes('localhost:3000') || rawDomain.includes('127.0.0.1:3000') || !rawDomain) {
                    return `/${path}`;
                }
            }
        }
        if (!rawDomain) {
            return `http://localhost:3000/${path}`;
        }
    }

    if (!rawDomain) {
        rawDomain = env.FILE_BASE_URL || '';
    }

    const domain = rawDomain.includes('${') ? '' : rawDomain.replace(/\/+$/, '');
    return domain ? `${domain}/${path}` : `/${path}`;
}
