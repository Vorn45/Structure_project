import { CommonModule }                                  from '@angular/common';
import { Component, inject, OnInit }                     from '@angular/core';
import { MatButtonModule }                               from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule }   from '@angular/material/dialog';
import { MatIconModule }                                 from '@angular/material/icon';
import { MatTooltipModule }                              from '@angular/material/tooltip';
import { TranslocoModule }                               from '@ngneat/transloco';
import { DateTime }                                      from 'luxon';
import { DialogConfigService }                           from 'app/shared/dialog-config.service';
import { SideDialogCloseButtonComponent }                from 'app/shared/side-dialog-close-button/component';
import {
    NotificationSettingData,
    NotificationSettingPayload,
}                                                        from 'app/layout/common/notifications/interface';
import {
    NotificationSettingScope,
    NotificationsService,
}                                                        from 'app/layout/common/notifications/service';
import {
    MuteResult,
    NotificationMuteComponent,
}                                                        from 'app/layout/common/notifications/settings/mute/component';

/** The boolean column each row writes to. */
type SettingField = keyof Pick<
    NotificationSettingData,
    'enabled' | 'sound' | 'web' | 'mobile' | 'email' | 'telegram'
>;

/** The snooze column a row writes to, for the rows that can be snoozed. */
type MuteField = keyof Pick<NotificationSettingData, 'muted_until' | 'web_muted_until'>;

/** Dialog payload — omit it (or the scope) for the general notification settings. */
export interface NotificationSettingsData {
    scope?: NotificationSettingScope;
}

/** One switch row: master, sound, or a delivery channel. */
export interface NotificationSettingRow {
    field: SettingField;
    labelKey: string;
    icon: string;
    enabled: boolean;
    /** Channel not available yet — row is shown but cannot be switched. */
    disabled?: boolean;
    /** Set when the row offers the snooze dialog. */
    muteField?: MuteField;
    mutedUntil?: string | null;
    /** Translated trailing text, for rows that show a link instead of a snooze. */
    hintKey?: string;
}

/**
 * Notification settings, opened from the notifications panel menu.
 * Each switch patches `/shared/notification/setting` on change and rolls back
 * if the request fails.
 */
@Component({
    selector    : 'notification-settings',
    standalone  : true,
    templateUrl : './template.html',
    imports: [
        CommonModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatTooltipModule,
        TranslocoModule,
        SideDialogCloseButtonComponent,
    ],
})
export class NotificationSettingsComponent implements OnInit {
    master: NotificationSettingRow = {
        field: 'enabled', labelKey: 'NotificationSettings.Notification',
        icon: 'mdi:bell-outline', enabled: true, muteField: 'muted_until',
    };

    sound: NotificationSettingRow = {
        field: 'sound', labelKey: 'NotificationSettings.Sound',
        icon: 'mdi:music-note', enabled: true,
    };

    channels: NotificationSettingRow[] = [
        { field: 'web',      labelKey: 'NotificationSettings.Web',      icon: 'mdi:monitor',       enabled: true,  muteField: 'web_muted_until' },
        { field: 'mobile',   labelKey: 'NotificationSettings.Mobile',   icon: 'mdi:cellphone',     enabled: true,  disabled: true },
        { field: 'email',    labelKey: 'NotificationSettings.Email',    icon: 'mdi:email-outline', enabled: false, disabled: true },
        { field: 'telegram', labelKey: 'NotificationSettings.Telegram', icon: 'mdi:telegram',      enabled: true,  hintKey: 'NotificationSettings.How' },
    ];

    private _dialog = inject(MatDialog);
    private _dialogConfig = inject(DialogConfigService);
    private _notificationsService = inject(NotificationsService);

    /**
     * Which stream these switches govern — project group chats keep their own
     * row on the API, so muting them here leaves task notifications untouched.
     * Passed in by whoever opens the dialog; the bell omits it.
     */
    private readonly _scope: NotificationSettingScope =
        inject<NotificationSettingsData | null>(MAT_DIALOG_DATA, { optional: true })?.scope ?? 'general';

    /** Dialog heading — names the stream when it isn't the general one. */
    get titleKey(): string {
        if (this._scope === 'project_chat') return 'NotificationSettings.GroupChatTitle';
        if (this._scope === 'organization_chat') return 'NotificationSettings.OrganizationChatTitle';
        return 'NotificationSettings.Title';
    }

    private get _rows(): NotificationSettingRow[] {
        return [this.master, this.sound, ...this.channels];
    }

    ngOnInit(): void {
        this._notificationsService.getSetting(this._scope).subscribe((setting) => {
            if (setting) this._apply(setting);
        });
    }

    /** A snoozed row reads as off until its timer runs out. */
    isOn(row: NotificationSettingRow): boolean {
        return row.enabled && !this._mutedUntil(row);
    }

    /** Remaining snooze, as the short label shown beside the switch. */
    muteHint(row: NotificationSettingRow): string {
        const until = this._mutedUntil(row);
        if (!until) return '';

        const diff = until.diff(DateTime.now());
        const hours = Math.ceil(diff.as('hours'));
        if (hours <= 24) return `${hours}h`;

        const days = Math.ceil(diff.as('days'));
        return days <= 30 ? `${days}d` : until.toFormat('dd/MM');
    }

    toggle(row: NotificationSettingRow): void {
        if (row.disabled) return;

        const previous = { enabled: row.enabled, mutedUntil: row.mutedUntil };
        const next = !this.isOn(row);
        const payload: NotificationSettingPayload = { [row.field]: next };

        row.enabled = next;
        // Switching a snoozed row back on clears the timer, otherwise it would
        // read as off again the moment the server state came back.
        if (next && row.muteField) {
            payload[row.muteField] = null;
            row.mutedUntil = null;
        }

        this._save(payload, () => Object.assign(row, previous));
    }

    /** Pick how long the row stays muted; the remaining time shows as its hint. */
    openMute(row: NotificationSettingRow): void {
        if (row.disabled || !row.muteField) return;
        const muteField = row.muteField;

        this._dialog
            .open(
                NotificationMuteComponent,
                // The master switch mutes everything, so its title names no channel.
                this._dialogConfig.getCenterDialogConfig({
                    channelKey: row === this.master ? undefined : row.labelKey,
                }),
            )
            .afterClosed()
            .subscribe((result: MuteResult | false) => {
                if (!result) return;

                const previous = { enabled: row.enabled, mutedUntil: row.mutedUntil };
                const payload: NotificationSettingPayload = {};

                if (result.duration === 'forever') {
                    // No timer — the switch itself goes off.
                    payload[row.field] = false;
                    payload[muteField] = null;
                    row.enabled = false;
                    row.mutedUntil = null;
                } else {
                    const until = this._mutedUntilFor(result);
                    if (!until) return;
                    payload[muteField] = until.toISO();
                    row.mutedUntil = until.toISO();
                }

                this._save(payload, () => Object.assign(row, previous));
            });
    }

    private _mutedUntilFor(result: MuteResult): DateTime | null {
        switch (result.duration) {
            case 'hour': return DateTime.now().plus({ hours: 1 });
            case 'day':  return DateTime.now().plus({ days: 1 });
            // Muting "until" a date covers that whole day.
            default:     return result.date ? result.date.endOf('day') : null;
        }
    }

    private _mutedUntil(row: NotificationSettingRow): DateTime | null {
        if (!row.mutedUntil) return null;
        const until = DateTime.fromISO(row.mutedUntil);
        return until.isValid && until > DateTime.now() ? until : null;
    }

    private _apply(setting: NotificationSettingData): void {
        for (const row of this._rows) {
            row.enabled = setting[row.field];
            if (row.muteField) row.mutedUntil = setting[row.muteField];
        }
    }

    /** Persist a change, restoring the switch when the request fails. */
    private _save(payload: NotificationSettingPayload, revert: () => void): void {
        this._notificationsService.updateSetting(payload, this._scope).subscribe((setting) => {
            setting ? this._apply(setting) : revert();
        });
    }
}
