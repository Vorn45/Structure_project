import { Pipe, PipeTransform } from '@angular/core';

/** Icon + display name for whatever service a pasted link points at. */
export interface LinkProviderMeta {
    /** `svgIcon` name — a registered mdi icon, or a standalone one like `canva`. */
    icon: string;
    /** Human label, used where the link is rendered as a chip ("Figma", "Canva", …). */
    label: string;
}

/** Matched against the URL's hostname, first hit wins. */
const PROVIDERS: { match: RegExp; meta: LinkProviderMeta }[] = [
    { match: /(^|\.)figma\.com$/, meta: { icon: 'mdi:figma', label: 'Figma' } },
    { match: /(^|\.)canva\.com$/, meta: { icon: 'canva', label: 'Canva' } },
    { match: /(^|\.)github\.com$/, meta: { icon: 'mdi:github', label: 'GitHub' } },
    { match: /(^|\.)(google\.com|googleusercontent\.com)$/, meta: { icon: 'mdi:google-drive', label: 'Google' } },
    { match: /(^|\.)(youtube\.com|youtu\.be)$/, meta: { icon: 'mdi:youtube', label: 'YouTube' } },
    { match: /(^|\.)atlassian\.net$/, meta: { icon: 'mdi:jira', label: 'Jira' } },
    { match: /(^|\.)trello\.com$/, meta: { icon: 'mdi:trello', label: 'Trello' } },
    { match: /(^|\.)slack\.com$/, meta: { icon: 'mdi:slack', label: 'Slack' } },
    { match: /(^|\.)dropbox\.com$/, meta: { icon: 'mdi:dropbox', label: 'Dropbox' } },
];

const FALLBACK: LinkProviderMeta = { icon: 'mdi:link-variant', label: 'Link' };

/**
 * Which service a link belongs to, by hostname. Links are typed by hand, so the
 * scheme is often missing and the value is half-typed while the user is still
 * going — anything unrecognised falls back to the generic link icon.
 */
export function resolveLinkProvider(url: string | null | undefined): LinkProviderMeta {
    const value = (url ?? '').trim();
    if (!value) return FALLBACK;

    let host: string;
    try {
        host = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).hostname.toLowerCase();
    } catch {
        return FALLBACK;
    }

    return PROVIDERS.find((provider) => provider.match.test(host))?.meta ?? FALLBACK;
}

/** `link | linkProvider` — the icon/label of the service a link points at. */
@Pipe({ name: 'linkProvider', standalone: true })
export class LinkProviderPipe implements PipeTransform {
    transform(url: string | null | undefined): LinkProviderMeta {
        return resolveLinkProvider(url);
    }
}
