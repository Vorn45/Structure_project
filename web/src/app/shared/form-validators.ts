export const LATIN_NAME_PATTERN = /^[a-zA-Z\s0-9.,()\/\-]+$/;
export const LATIN_NAME_DISALLOWED_PATTERN = /[^a-zA-Z\s0-9.,()\/\-]/g;

export function filterLatinName(value: string): string {
    return value.replace(LATIN_NAME_DISALLOWED_PATTERN, '');
}
