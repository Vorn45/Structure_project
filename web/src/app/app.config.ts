// ================================================================================>> Main Library
import { provideHttpClient } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { LuxonDateAdapter } from '@angular/material-luxon-adapter';
import {
    APP_INITIALIZER,
    ApplicationConfig,
    inject,
    isDevMode,
} from '@angular/core';
import {
    PreloadAllModules,
    provideRouter,
    withHashLocation,
    withInMemoryScrolling,
    withPreloading,
} from '@angular/router';

// ================================================================================>> Third Party Library
// Material
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';

// Browser
import { provideAnimations } from '@angular/platform-browser/animations';

// RxJS
import { firstValueFrom } from 'rxjs';

// Transloco
import { TranslocoService, provideTransloco } from '@ngneat/transloco';

// ================================================================================>> Custom Library
// App
import { appRoutes } from 'app/app.routes';

// Core
import { provideAuth } from 'app/core/auth/auth.provider';
import { provideIcons } from 'app/core/icons/icons.provider';
import { telegramAuthInitializer } from 'app/core/telegram/telegram-auth.initializer';
import { TranslocoHttpLoader } from 'app/core/transloco/transloco.http-loader';

// Helper
import { provideHelper } from 'helper';
import { Scheme } from 'helper/services/config';
import { env } from 'envs/env';

export const appConfig: ApplicationConfig = {
    providers: [
        provideAnimations(),
        provideHttpClient(),
        provideRouter(
            appRoutes,
            // Fetch every lazy section (and lazy component) in the background
            // right after the first navigation settles, so clicking a nav item
            // never has to wait on a chunk download.
            withPreloading(PreloadAllModules),
            withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
            withHashLocation(),
        ),

        // provideServiceWorker('ngsw-worker.js', {
        //     enabled: !env.production,
        //     registrationStrategy: 'registerWhenStable:30000',
        // }),
        //
        // Material Date Adapter
        {
            provide: DateAdapter,
            useClass: LuxonDateAdapter,
        },
        {
            provide: MAT_DATE_FORMATS,
            useValue: {
                parse: {
                    dateInput: 'D',
                },
                display: {
                    dateInput: 'DDD',
                    monthYearLabel: 'LLL yyyy',
                    dateA11yLabel: 'DD',
                    monthYearA11yLabel: 'LLLL yyyy',
                },
            },
        },

        // Transloco Config
        provideTransloco({
            config: {
                availableLangs: [
                    {
                        id: 'kh',
                        label: 'ខ្មែរ',
                    },
                    {
                        id: 'en',
                        label: 'English',
                    },
                ],
                defaultLang: 'kh',
                fallbackLang: 'kh',
                reRenderOnLangChange: true,
                prodMode: true,
            },
            loader: TranslocoHttpLoader,
        }),
        {
            // Preload the default language before the app starts to prevent empty/jumping content
            provide: APP_INITIALIZER,
            useFactory: () => {
                const translocoService = inject(TranslocoService);
                const availableLangs = translocoService.getAvailableLangs().map(
                    (lang) => (typeof lang === 'string' ? lang : lang.id),
                );
                const savedLang = localStorage.getItem('lang');
                const defaultLang = savedLang && availableLangs.includes(savedLang)
                    ? savedLang
                    : translocoService.getDefaultLang();
                translocoService.setActiveLang(defaultLang);

                return () => firstValueFrom(translocoService.load(defaultLang));
            },
            multi: true,
        },
        {
            // Inside Telegram, trade the launch parameters for a session before
            // the router runs so the user skips the login screen. No-op elsewhere.
            provide: APP_INITIALIZER,
            useFactory: telegramAuthInitializer,
            multi: true,
        },

        // Helper
        provideAuth(),
        provideIcons(),
        provideHelper({
            helper: {
                layout: (localStorage.getItem('layout') as string) || 'compact',
                scheme: localStorage.getItem('scheme')
                    ? (localStorage.getItem('scheme') as Scheme)
                    : 'light',
                screens: {
                    sm: '600px',
                    md: '960px',
                    lg: '1280px',
                    xl: '1440px',
                },
                theme: (localStorage.getItem('theme') as string) || 'theme-default',
                fontSize: (localStorage.getItem('font-size') as any) || 'medium',
                projectShortcut: localStorage.getItem('project-shortcut') === 'true',
                bottomNavLabels: localStorage.getItem('bottom-nav-labels') === 'true',
                customColor: localStorage.getItem('custom-color') || null,
                themes: [
                    {
                        id: 'theme-default',
                        name: 'Default',
                    },
                    {
                        id: 'theme-brand',
                        name: 'Brand',
                    },
                    {
                        id: 'theme-teal',
                        name: 'Teal',
                    },
                    {
                        id: 'theme-rose',
                        name: 'Rose',
                    },
                    {
                        id: 'theme-purple',
                        name: 'Purple',
                    },
                    {
                        id: 'theme-amber',
                        name: 'Amber',
                    },
                    {
                        id: 'theme-custom',
                        name: 'Custom',
                    },
                ],
            },
        }),
    ],
};
