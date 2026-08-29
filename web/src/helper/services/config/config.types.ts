// Types
export type Scheme = 'auto' | 'dark' | 'light';
export type Screens = { [key: string]: string };
export type Theme = 'theme-default' | string;
export type Themes = { id: string; name: string }[];
export type FontSize = 'small' | 'medium' | 'large' | 'super-big';

/**
 * AppConfig interface. Update this interface to strictly type your config
 * object.
 */
export interface HelperConfig {
    layout: string;
    scheme: Scheme;
    screens: Screens;
    theme: Theme;
    themes: Themes;
    fontSize: FontSize;
    projectShortcut: boolean;
    bottomNavLabels: boolean;
    customColor: string | null;
}
