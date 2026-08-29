import { Platform } from '@angular/cdk/platform';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HelperPlatformService {
    private _platform = inject(Platform);

    osName = 'os-unknown';

    constructor() {
        if (!this._platform.isBrowser) {
            return;
        }

        if (navigator.userAgent.includes('Win')) {
            this.osName = 'os-windows';
        }

        if (navigator.userAgent.includes('Mac')) {
            this.osName = 'os-mac';
        }

        if (navigator.userAgent.includes('X11')) {
            this.osName = 'os-unix';
        }

        if (navigator.userAgent.includes('Linux')) {
            this.osName = 'os-linux';
        }

        if (this._platform.IOS) {
            this.osName = 'os-ios';
        }

        if (this._platform.ANDROID) {
            this.osName = 'os-android';
        }
    }

    get isMac(): boolean {
        return this.osName === 'os-mac';
    }

    get isWindows(): boolean {
        return this.osName === 'os-windows';
    }
}
