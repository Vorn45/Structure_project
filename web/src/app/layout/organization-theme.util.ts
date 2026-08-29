import chroma from 'chroma-js';

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
type Step = (typeof STEPS)[number];
type PrimaryPalette = Record<Step, string>;

/**
 * Mirrors web/src/helper/tailwind/utils/generate-palette.js so a single org
 * primary_color hex produces the same-shaped 50-900 ramp as the build-time themes.
 */
function generatePrimaryPalette(baseHex: string): PrimaryPalette {
    const lightBoundary = chroma.scale(['white', baseHex]).domain([0, 1]).mode('lrgb').colors(50)[1];
    const darkBoundary = chroma.scale(['black', baseHex]).domain([0, 1]).mode('lrgb').colors(10)[1];
    const scale = chroma.scale([lightBoundary, baseHex, darkBoundary]).domain([0, 0.5, 1]).mode('lrgb');

    const palette = {} as PrimaryPalette;
    STEPS.forEach((step) => (palette[step] = scale(step / 1000).hex()));
    return palette;
}

function contrastColor(hex: string): string {
    return chroma.contrast(hex, '#FFFFFF') >= chroma.contrast(hex, '#0F172A') ? '#FFFFFF' : '#0F172A';
}

/**
 * Builds the --helper-primary* / --helper-on-primary* CSS custom properties
 * (see web/src/helper/tailwind/plugins/theming.js) for a single org hex color,
 * to be applied inline and override the compiled .theme-* class for the session.
 */
export function buildPrimaryThemeVars(baseHex: string): Record<string, string> | null {
    if (!chroma.valid(baseHex)) return null;

    const palette = generatePrimaryPalette(baseHex);
    const rgbOf = (hex: string) => chroma(hex).rgb().join(',');
    const vars: Record<string, string> = {};

    STEPS.forEach((step) => {
        const hex = palette[step];
        const on = contrastColor(hex);
        vars[`--helper-primary-${step}`] = hex;
        vars[`--helper-primary-${step}-rgb`] = rgbOf(hex);
        vars[`--helper-on-primary-${step}`] = on;
        vars[`--helper-on-primary-${step}-rgb`] = rgbOf(on);
    });

    const base = palette[500];
    const onBase = contrastColor(base);
    vars['--helper-primary'] = base;
    vars['--helper-primary-rgb'] = rgbOf(base);
    vars['--helper-on-primary'] = onBase;
    vars['--helper-on-primary-rgb'] = rgbOf(onBase);

    return vars;
}
