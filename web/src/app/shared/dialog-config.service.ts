import { Injectable } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';

@Injectable({
    providedIn: 'root',
})

export class DialogConfigService {
    /**
     * Returns a pre-configured MatDialogConfig object.
     * @param data Optional data to pass to the dialog.
     */
    getDialogConfig(data: any = null): MatDialogConfig {
        const defaultConfig: MatDialogConfig = {
            autoFocus: false,
            position: { right: '0', top: '0' },
            width: '600px',
            height: '100vh',
            panelClass: 'side-dialog',
            data: data || null,
        };

        return defaultConfig;
    }

    /**
     * Returns a pre-configured MatDialogConfig object.
     * @param {any} data Optional data to pass to the dialog.
     */
    getCenterDialogConfig(data: any = null, width?: string): MatDialogConfig {

        if (!width) width = '520px';

        const defaultConfig: MatDialogConfig = {
            autoFocus: false,
            disableClose: true,
            width: width,
            panelClass: 'center-dialog',
            data: data || null,
        };

        return defaultConfig;
    }

    /** Full-screen config for application views that need the whole canvas. */
    getFullScreenDialogConfig(data: any = null): MatDialogConfig {
        return {
            autoFocus: false,
            position: { top: '0px', left: '0px' },
            width: '100vw',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            panelClass: 'full-screen-modal',
            data: data || null,
        };
    }

    /**
     * Full-screen config for the shared file viewers (image / pdf).
     * @param data `{ url, title }` passed to the viewer component.
     */
    getFileViewerConfig(data: any = null): MatDialogConfig {
        return {
            autoFocus: false,
            position: { top: '0px', left: '0px' },
            width: '100vw',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            panelClass: 'full-screen-modal',
            enterAnimationDuration: '0s',
            data: data || null,
        };
    }
}
