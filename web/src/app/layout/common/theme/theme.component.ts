import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HelperConfig, HelperConfigService, Theme } from 'helper/services/config';
import { Subject, takeUntil } from 'rxjs';
import { readPreferredRoleId } from 'app/core/auth/resolvers/role.util';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';

@Component({
    selector: 'theme',
    templateUrl: './theme.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
})
export class ThemeComponent implements OnInit, OnDestroy {
    theme: Theme = 'theme-default';
    customColor: string | null = null;

    readonly options: { value: Theme; color: string; label_en: string; label_km: string }[] = [
        { value: 'theme-default', color: '#192675', label_en: 'Default', label_km: 'លំនាំដើម' },
        { value: 'theme-brand', color: '#2196f3', label_en: 'Brand', label_km: 'ខៀវ' },
        { value: 'theme-teal', color: '#14b8a6', label_en: 'Teal', label_km: 'បៃតងខៀវ' },
        { value: 'theme-rose', color: '#f43f5e', label_en: 'Rose', label_km: 'ផ្កាកុលាប' },
        { value: 'theme-purple', color: '#a855f7', label_en: 'Purple', label_km: 'ស្វាយ' },
        { value: 'theme-amber', color: '#f59e0b', label_en: 'Amber', label_km: 'លឿង' },
    ];

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    private _orgPrimaryColor: string | null = null;

    constructor(
        private _helperConfigService: HelperConfigService,
        private _userService: UserService,
    ) {}

    ngOnInit(): void {
        this._helperConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: HelperConfig) => {
                this.theme = config.theme;
                this.customColor = config.customColor;
            });

        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user: User) => {
                const preferredRoleId = readPreferredRoleId();
                const role =
                    user?.roles?.find((r) => r.id === preferredRoleId) ??
                    user?.roles?.find((r) => r.id === user?.is_active) ??
                    user?.roles?.find((r) => r.is_default);

                this._orgPrimaryColor = role?.organization?.primary_color ?? null;
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    swatchColor(option: { value: Theme; color: string }): string {
        return option.value === 'theme-default' && this._orgPrimaryColor
            ? this._orgPrimaryColor
            : option.color;
    }

    setTheme(theme: Theme): void {
        localStorage.setItem('theme', theme);
        this._helperConfigService.config = { theme };
    }

    openCustomColorPicker(): void {}
}
