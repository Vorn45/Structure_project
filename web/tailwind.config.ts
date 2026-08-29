const path = require('path');
const colors = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');
const generatePalette = require(
    path.resolve(__dirname, 'src/helper/tailwind/utils/generate-palette')
);

/**
 * Custom palettes
 *
 * Uses the generatePalette helper method to generate
 * Tailwind-like color palettes automatically
 */
const customPalettes = {
    brand: generatePalette('#2196F3'),
    primary: generatePalette('#1E2974'),
    systemBlue: generatePalette('#192675'),
    teal: generatePalette('#14B8A6'),
    rose: generatePalette('#F43F5E'),
    purple: generatePalette('#A855F7'),
    amber: generatePalette('#F59E0B'),
};

/**
 * Themes
 */
const themes = {
    // Default theme is required for theming system to work correctly!
    default: {
        primary: {
            ...customPalettes.systemBlue,
            DEFAULT: customPalettes.systemBlue[500],
        },
        accent: {
            ...colors.slate,
            DEFAULT: colors.slate[800],
        },
        warn: {
            ...colors.red,
            DEFAULT: colors.red[600],
        },
        'on-warn': {
            500: colors.red['50'],
        },
    },

    // Rest of the themes will use the 'default' as the base
    // theme and will extend it with their given configuration.
    brand: {
        primary: customPalettes.brand,
    },
    teal: {
        primary: {
            ...customPalettes.teal,
            DEFAULT: customPalettes.teal[500],
        },
    },
    rose: {
        primary: {
            ...customPalettes.rose,
            DEFAULT: customPalettes.rose[500],
        },
    },
    purple: {
        primary: {
            ...customPalettes.purple,
            DEFAULT: customPalettes.purple[500],
        },
    },
    amber: {
        primary: {
            ...customPalettes.amber,
            DEFAULT: customPalettes.amber[600],
        },
    },
};

/**
 * Tailwind configuration
 */
const config = {
    darkMode: 'class',
    content: ['./src/**/*.{html,scss,ts}'],
    important: true,
    theme: {
        fontSize: {
            xs: '0.625rem',
            sm: '0.75rem',
            md: '0.875rem',
            base: '0.875rem',
            lg: '1rem',
            xl: '1.125rem',
            '2xl': '1.25rem',
            '3xl': '1.5rem',
            '4xl': '2rem',
            '5xl': '2.25rem',
            '6xl': '2.5rem',
            '7xl': '3rem',
            '8xl': '4rem',
            '9xl': '6rem',
            '10xl': '8rem',
        },
        screens: {
            max_980: {'min': '601px', 'max': '980px'},
            sm: '600px',
            md: '960px',
            lg: '1280px',
            xl: '1440px',
        },
        extend: {
            animation: {
                'spin-slow': 'spin 3s linear infinite',
            },
            colors: {
                gray: colors.slate,
            },
            flex: {
                0: '0 0 auto',
            },
            fontFamily: {
                sans: `"Kantumruy Pro", "Inter var", ${defaultTheme.fontFamily.sans.join(',')}`,
                mono: `"IBM Plex Mono", ${defaultTheme.fontFamily.mono.join(',')}`,
                kantumruy: `\"Kantumruy Pro\", sans-serif`,
            },
            opacity: {
                12: '0.12',
                38: '0.38',
                87: '0.87',
            },
            rotate: {
                '-270': '270deg',
                15: '15deg',
                30: '30deg',
                60: '60deg',
                270: '270deg',
            },
            scale: {
                '-1': '-1',
            },
            zIndex: {
                '-1': -1,
                49: 49,
                60: 60,
                70: 70,
                80: 80,
                90: 90,
                99: 99,
                999: 999,
                9999: 9999,
                99999: 99999,
            },
            spacing: {
                13: '3.25rem',
                15: '3.75rem',
                18: '4.5rem',
                19: '4.75rem',
                22: '5.5rem',
                25: '6.25rem',
                26: '6.5rem',
                30: '7.5rem',
                50: '12.5rem',
                90: '22.5rem',

                // Bigger values
                100: '25rem',
                120: '30rem',
                128: '32rem',
                140: '35rem',
                160: '40rem',
                180: '45rem',
                192: '48rem',
                200: '50rem',
                240: '60rem',
                256: '64rem',
                280: '70rem',
                320: '80rem',
                360: '90rem',
                400: '100rem',
                480: '120rem',

                // Fractional values
                '1/2': '50%',
                '1/3': '33.333333%',
                '2/3': '66.666667%',
                '1/4': '25%',
                '2/4': '50%',
                '3/4': '75%',
            },
            minHeight: ({ theme }) => ({
                ...theme('spacing'),
            }),
            maxHeight: {
                none: 'none',
            },
            minWidth: ({ theme }) => ({
                ...theme('spacing'),
                screen: '100vw',
            }),
            maxWidth: ({ theme }) => ({
                ...theme('spacing'),
                screen: '100vw',
            }),
            transitionDuration: {
                400: '400ms',
            },
            transitionTimingFunction: {
                drawer: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
            },

            // @tailwindcss/typography
            typography: ({ theme }) => ({
                DEFAULT: {
                    css: {
                        color: 'var(--helper-text-default)',
                        '[class~="lead"]': {
                            color: 'var(--helper-text-secondary)',
                        },
                        a: {
                            color: 'var(--helper-primary-500)',
                        },
                        strong: {
                            color: 'var(--helper-text-default)',
                        },
                        'ol > li::before': {
                            color: 'var(--helper-text-secondary)',
                        },
                        'ul > li::before': {
                            backgroundColor: 'var(--helper-text-hint)',
                        },
                        hr: {
                            borderColor: 'var(--helper-border)',
                        },
                        blockquote: {
                            color: 'var(--helper-text-default)',
                            backgroundColor: 'var(--helper-bg-card)',
                            borderLeftColor: 'var(--helper-border)',
                        },
                        h1: {
                            color: 'var(--helper-text-default)',
                        },
                        h2: {
                            color: 'var(--helper-text-default)',
                        },
                        h3: {
                            color: 'var(--helper-text-default)',
                        },
                        h4: {
                            color: 'var(--helper-text-default)',
                        },
                        'figure figcaption': {
                            color: 'var(--helper-text-secondary)',
                        },
                        code: {
                            color: 'var(--helper-text-default)',
                            fontWeight: '500',
                        },
                        'a code': {
                            color: 'var(--helper-primary)',
                        },
                        pre: {
                            color: theme('colors.white'),
                            backgroundColor: theme('colors.gray.800'),
                        },
                        thead: {
                            color: 'var(--helper-text-default)',
                            borderBottomColor: 'var(--helper-border)',
                        },
                        'tbody tr': {
                            borderBottomColor: 'var(--helper-border)',
                        },
                        'ol[type="A" s]': false,
                        'ol[type="a" s]': false,
                        'ol[type="I" s]': false,
                        'ol[type="i" s]': false,
                    },
                },
                sm: {
                    css: {
                        code: {
                            fontSize: '1em',
                        },
                        pre: {
                            fontSize: '1em',
                        },
                        table: {
                            fontSize: '1em',
                        },
                    },
                },
            }),
        },
    },
    corePlugins: {
        appearance: false,
        container: false,
        float: false,
        clear: false,
        placeholderColor: false,
        placeholderOpacity: false,
        verticalAlign: false,
    },
    plugins: [
        // Helper - Tailwind plugins
        require(
            path.resolve(__dirname, 'src/helper/tailwind/plugins/utilities')
        ),
        require(
            path.resolve(__dirname, 'src/helper/tailwind/plugins/icon-size')
        ),
        require(path.resolve(__dirname, 'src/helper/tailwind/plugins/theming'))({
            themes,
        }),

        // Other third party and/or custom plugins
        require('@tailwindcss/typography')({ modifiers: ['sm', 'lg'] }),
    ],
};

module.exports = config;
