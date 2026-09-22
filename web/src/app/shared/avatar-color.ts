/**
 * Deterministic avatar colours.
 *
 * Call sites used to fall back to a single hardcoded colour (usually
 * `bg-blue-600`), so a stack of avatars rendered as identical circles and you
 * could not tell one person from another. Hashing a stable key instead gives
 * each person their own colour, the same colour everywhere, every session.
 */

const AVATAR_COLORS = [
    'bg-blue-600 text-white',
    'bg-emerald-600 text-white',
    'bg-violet-600 text-white',
    'bg-amber-500 text-slate-900',
    'bg-rose-600 text-white',
    'bg-cyan-600 text-white',
    'bg-indigo-600 text-white',
    'bg-teal-600 text-white',
    'bg-orange-600 text-white',
    'bg-fuchsia-600 text-white',
];

function hashKey(key: string): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = (hash << 5) - hash + key.charCodeAt(i);
        hash |= 0; // keep it a 32-bit int
    }
    return Math.abs(hash);
}

/** A stable Tailwind background+text class pair for this person. */
export function avatarColorClass(
    member: { id?: number | string | null; name?: string | null; bgClass?: string | null } | null | undefined,
): string {
    if (!member) return AVATAR_COLORS[0];
    if (member.bgClass) return member.bgClass;
    const key = String(member.id ?? '') || String(member.name ?? '');
    if (!key) return AVATAR_COLORS[0];
    return AVATAR_COLORS[hashKey(key) % AVATAR_COLORS.length];
}

/** First character for the avatar, preferring an explicit initial. */
export function avatarInitial(
    member: { initial?: string | null; name?: string | null } | null | undefined,
): string {
    if (!member) return '?';
    const initial = (member.initial || '').trim();
    if (initial) return initial.charAt(0);
    return (member.name || '?').trim().charAt(0) || '?';
}
