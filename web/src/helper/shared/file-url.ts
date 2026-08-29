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

    const rawDomain = (typeof file === 'string' ? '' : file.file_domain) || env.FILE_BASE_URL || '';
    const domain = rawDomain.includes('${') ? '' : rawDomain.replace(/\/+$/, '');
    const path = uri.replace(/^\/+/, '');

    return domain ? `${domain}/${path}` : `/${path}`;
}
