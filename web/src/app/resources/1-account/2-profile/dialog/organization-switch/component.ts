import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { TranslocoModule } from '@ngneat/transloco';
import { TimeAgoPipe } from 'app/shared/time-ago.pipe';
import { SwitchRoleRow } from '../../view/component';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';

export interface RoleGroup {
    key: string;
    header?: string;
    items: SwitchRoleRow[];
}

@Component({
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatDialogModule,
        MatDividerModule,
        MatMenuModule,
        TranslocoModule,
        TimeAgoPipe,
    ],
    selector: 'organization-switch-dialog',
    templateUrl: './template.html',
})
export class OrganizationSwitchDialogComponent {
    searchQuery: string = '';
    roles: SwitchRoleRow[] = [];

    private readonly _snackbarService = inject(SnackbarService);
    private readonly _matDialog = inject(MatDialog);
    private readonly _dialogConfigService = inject(DialogConfigService);
    private readonly _dialogRef = inject(MatDialogRef<OrganizationSwitchDialogComponent>);

    constructor(
        @Inject(MAT_DIALOG_DATA)
        public data: { roles: SwitchRoleRow[]; shownRoles?: SwitchRoleRow[] },
    ) {
        this.roles = data?.shownRoles || data?.roles || [];
    }

    get filteredRoles(): SwitchRoleRow[] {
        if (!this.searchQuery) return this.roles;
        const q = this.searchQuery.toLowerCase();
        return this.roles.filter(
            (r) =>
                r.title.toLowerCase().includes(q) ||
                (r.subtitle && r.subtitle.toLowerCase().includes(q)),
        );
    }

    get roleGroups(): RoleGroup[] {
        const groups: RoleGroup[] = [];
        const groupMap = new Map<string, SwitchRoleRow[]>();

        this.filteredRoles.forEach((role) => {
            const g = role.group || 'other';
            if (!groupMap.has(g)) groupMap.set(g, []);
            groupMap.get(g)!.push(role);
        });

        groupMap.forEach((items, key) => {
            groups.push({ key, items });
        });

        return groups;
    }

    selectRole(role: SwitchRoleRow): void {
        this._dialogRef.close(role);
    }

    openOrgProfile(_item: SwitchRoleRow): void {}

    leaveOrg(_item: SwitchRoleRow): void {}

    close(): void {
        this._dialogRef.close();
    }

    trackRole = (_index: number, item: SwitchRoleRow): number | string =>
        item.id ?? item.title;
}
