export interface HelperConfirmationConfig {
    variant?: 'default' | 'compact';
    title?: string;
    message?: string;
    icon?: {
        show?: boolean;
        name?: string;
        color?:
            | 'primary'
            | 'accent'
            | 'warn'
            | 'basic'
            | 'info'
            | 'success'
            | 'warning'
            | 'error';
        /** Path to an illustration SVG (e.g. "images/apps/seo_pana.svg") to show instead of the
         *  colored-circle mat-icon. Fetched as text and its `#FF725E` accent recolored to the
         *  org's theme color at runtime, same technique as under-construction/dialog.ts. */
        image?: string;
    };
    actions?: {
        confirm?: {
            show?: boolean;
            label?: string;
            color?: 'primary' | 'accent' | 'warn' | 'success' | 'info';
        };
        cancel?: {
            show?: boolean;
            label?: string;
        };
    };
    dismissible?: boolean;
}
