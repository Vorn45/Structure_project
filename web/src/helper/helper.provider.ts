import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ENVIRONMENT_INITIALIZER, EnvironmentProviders, Provider, importProvidersFrom, inject, } from '@angular/core';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { HelperConfig } from 'helper/services/config';
import { HELPER_CONFIG } from 'helper/services/config/config.constants';
import { HelperConfirmationService } from 'helper/services/confirmation';
import { HelperLoadingService, helperLoadingInterceptor } from 'helper/services/loading';
import { HelperMediaWatcherService } from 'helper/services/media-watcher';
import { HelperPlatformService } from 'helper/services/platform';
import { HelperSplashScreenService } from 'helper/services/splash-screen';
import { HelperUtilsService } from 'helper/services/utils';

export type ProviderConfig = {
    helper?: HelperConfig;
};

/**
 * Helper provider
 */
export const provideHelper = (
    config: ProviderConfig
): Array<Provider | EnvironmentProviders> => {
    // Base providers
    const providers: Array<Provider | EnvironmentProviders> = [
        {
            // Disable 'theme' sanity check
            provide: MATERIAL_SANITY_CHECKS,
            useValue: {
                doctype: true,
                theme: false,
                version: true,
            },
        },
        {
            // Use the 'outline' appearance on Angular Material form fields by default
            provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
            useValue: {
                appearance: 'outline',
            },
        },
        {
            provide: HELPER_CONFIG,
            useValue: config?.helper ?? {},
        },

        importProvidersFrom(MatDialogModule),
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => inject(HelperConfirmationService),
            multi: true,
        },

        provideHttpClient(withInterceptors([helperLoadingInterceptor])),
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => inject(HelperLoadingService),
            multi: true,
        },

        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => inject(HelperMediaWatcherService),
            multi: true,
        },
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => inject(HelperPlatformService),
            multi: true,
        },
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => inject(HelperSplashScreenService),
            multi: true,
        },
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => inject(HelperUtilsService),
            multi: true,
        },
    ];

    // Return the providers
    return providers;
};
