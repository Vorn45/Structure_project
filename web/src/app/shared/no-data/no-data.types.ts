export type NoDataType =
    | 'user' | 'file' | 'chat' | 'search' | 'study' | 'users' | 'invoice' | 'task'
    | 'task-priority' | 'activity' | 'milestone' | 'project' | 'team' | 'org' | 'mail'
    | 'meeting' | 'progress' | 'tech' | 'error' | 'under-construction' | 'in-progress-loading'
    | 'meeting-purpose' | 'meeting-result' | 'meeting-next-task' | 'phone-login';

/** Types with a real illustration in `images/apps/no-{type}.svg`; everything else falls back to `images/avatars/{type}.png`. */
export const APPS_ICON_TYPES = new Set([
    'task', 'task-priority', 'activity', 'milestone', 'project', 'team', 'org', 'chat', 'mail',
    'meeting', 'progress', 'invoice', 'file', 'tech', 'error', 'search',
    'meeting-purpose', 'meeting-result', 'meeting-next-task', 'phone-login',
]);

/** Full-color illustrations rendered as an <img> (not a primary-tinted mat-icon), keyed to their own file path. */
export const IMAGE_ILLUSTRATIONS: Record<string, string> = {
    'under-construction': 'images/apps/under-construction.svg',
};

/** Illustrations fetched as inline SVG text so their `#FF725E` accent fills can be recolored to the
 *  org's theme color at runtime (same technique as under-construction/dialog.ts), keyed to file path. */
export const RECOLORED_ILLUSTRATIONS: Record<string, string> = {
    'in-progress-loading': 'images/apps/in_progress_loading.svg',
};

/** Per-type overrides for the illustration's top margin, for icons whose built-in whitespace
 *  doesn't match the shared `calc(var(--nd-icon) * -0.24)` default. */
export const ICON_MARGIN_OVERRIDES: Record<string, string> = {
    'task-priority': '1rem',
};

