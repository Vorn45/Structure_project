import { NgClass } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule } from '@ngneat/transloco';

import { AuthService } from 'app/core/auth/auth.service';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { HelperConfirmationService } from 'helper/services/confirmation/confirmation.service';
import {
    formatProfileDate,
    profileCompactRelativeTime,
    profileDateValue,
    profileRelativeTime,
} from '../../profile-display.util';
import { ProfileService } from '../../profile.service';
import { ProfileDevice } from '../../profile.type';

interface DeviceActivity {
    location: string;
    time: string;
}

interface DeviceSession {
    id: number | string;
    name: string;
    image: string;
    lastActive: string;
    firstLogin: string;
    location: string;
    isActive: boolean;
    isCurrent: boolean;
    activities: DeviceActivity[];
}

@Component({
    standalone: true,
    imports: [
        NgClass,
        MatIconModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        SideDialogCloseButtonComponent,
        TranslocoModule,
    ],
    selector: 'device-profile-dialog',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
})
export class DeviceProfileDialogComponent implements OnInit {
    readonly selectedDevice = signal<DeviceSession | null>(null);
    readonly devices = signal<DeviceSession[]>([]);
    readonly isLoading = signal(true);
    readonly hasLoadError = signal(false);

    constructor(
        private readonly _authService: AuthService,
        private readonly _confirmationService: HelperConfirmationService,
        private readonly _matDialog: MatDialog,
        private readonly _dialogRef: MatDialogRef<DeviceProfileDialogComponent>,
        private readonly _profileService: ProfileService,
        private readonly _router: Router,
    ) {}

    ngOnInit(): void {
        this.loadDevices();
    }

    loadDevices(): void {
        this.isLoading.set(true);
        this.hasLoadError.set(false);

        this._profileService.getDevices().subscribe({
            next: (devices) => {
                const newest = this.findNewestDevice(devices);
                const hasExplicitCurrent = devices.some((device) =>
                    this.optionalBoolean(
                        device.this_devices ?? device.is_current ?? device.current,
                    ) === true,
                );
                const sortedDevices = [...devices].sort(
                    (first, second) =>
                        profileDateValue(this.activityValue(second)) -
                        profileDateValue(this.activityValue(first)),
                );
                const mappedDevices = sortedDevices.map((device, index) =>
                    this.mapDevice(
                        device,
                        index,
                        hasExplicitCurrent ? null : newest,
                    ),
                );
                this.devices.set(
                    mappedDevices.sort((first, second) =>
                        Number(second.isCurrent) - Number(first.isCurrent),
                    ),
                );
                this.isLoading.set(false);
            },
            error: () => {
                this.devices.set([]);
                this.isLoading.set(false);
                this.hasLoadError.set(true);
            },
        });
    }

    selectDevice(device: DeviceSession): void {
        this.selectedDevice.set(device);
    }

    onBack(): void {
        if (this.selectedDevice()) {
            this.selectedDevice.set(null);
            return;
        }

        this._dialogRef.close();
    }

    signOutCurrentDevice(): void {
        const device = this.selectedDevice();
        if (!device?.isCurrent) {
            return;
        }

        const confirmation = this._confirmationService.open({
            title: 'ឈប់ប្រើឧបករណ៍',
            message: 'សកម្មភាពនេះនឹងដកសិទ្ធិចូលប្រើគណនី PMS របស់អ្នកចេញពីឧបករណ៍នេះ',
            icon: {
                show: true,
                name: 'mdi:exclamation-thick',
                color: 'warning',
            },
            actions: {
                confirm: { show: true, label: 'ចាកចេញ', color: 'warn' },
                cancel: { show: true, label: 'ទេ' },
            },
            dismissible: true,
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result !== 'confirmed') {
                return;
            }

            this._authService.signOut().subscribe(() => {
                this._matDialog.closeAll();
                void this._router.navigateByUrl('/auth/sign-in', {
                    replaceUrl: true,
                });
            });
        });
    }

    private findNewestDevice(devices: ProfileDevice[]): ProfileDevice | null {
        return [...devices].sort(
            (first, second) =>
                profileDateValue(this.activityValue(second)) -
                profileDateValue(this.activityValue(first)),
        )[0] ?? null;
    }

    private mapDevice(
        device: ProfileDevice,
        index: number,
        fallbackCurrent: ProfileDevice | null,
    ): DeviceSession {
        const explicitCurrent = this.optionalBoolean(
            device.this_devices ?? device.is_current ?? device.current,
        );
        const isCurrent = explicitCurrent === true || device === fallbackCurrent;
        const explicitActive = this.optionalBoolean(
            device.is_active ?? device.active,
        );
        const statusActive =
            typeof device.status === 'string'
                ? device.status.toLowerCase() === 'active'
                : this.optionalBoolean(device.status);
        const location =
            [device.city, device.country].filter(Boolean).join(', ') ||
            device.region ||
            '-';
        const activityValue = this.activityValue(device);
        const lastActive = isCurrent
            ? 'ឥឡូវនេះ'
            : profileRelativeTime(activityValue);
        const firstLoginValue =
            device.created_at ??
            device.first_login_at ??
            device.logged_in_at ??
            device.date_log_in ??
            this.activityValue(device);
        const firstLogin = formatProfileDate(firstLoginValue);

        return {
            id: device.id ?? `device-${index}`,
            name:
                device.name ||
                device.os ||
                device.platform ||
                device.device ||
                'Unknown',
            image: this.deviceImage(
                device.device_type,
                device.platform,
                device.os,
            ),
            lastActive,
            firstLogin,
            location,
            isActive: explicitActive ?? statusActive ?? isCurrent,
            isCurrent,
            activities: [
                {
                    location,
                    time: profileCompactRelativeTime(activityValue),
                },
            ],
        };
    }

    private deviceImage(
        type: string | null,
        platform: string | null,
        os: string | null,
    ): string {
        const value = `${type ?? ''} ${platform ?? ''} ${os ?? ''}`.toLowerCase();
        if (/tablet|ipad/.test(value)) {
            return '/images/device/Tablet.png';
        }
        if (/mobile|phone|android|ios|iphone/.test(value)) {
            return '/images/device/Phone.png';
        }
        return '/images/device/Laptop.png';
    }

    private activityValue(device: ProfileDevice): string | number | null {
        return (
            device.last_time_access ??
            device.last_activity_at ??
            device.last_activity ??
            device.last_active_at ??
            device.last_active ??
            device.last_used_at ??
            device.logged_in_at ??
            device.date_log_in ??
            device.updated_at ??
            null
        );
    }

    private optionalBoolean(
        value: boolean | number | string | null | undefined,
    ): boolean | null {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value === 1;
        return ['true', '1', 'active'].includes(value.toLowerCase());
    }
}
