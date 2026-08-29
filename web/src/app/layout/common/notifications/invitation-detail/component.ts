import { CommonModule }                       from '@angular/common';
import { Component, Inject, OnInit }          from '@angular/core';
import { MatButtonModule }                    from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule }                      from '@angular/material/icon';
import { MatProgressSpinnerModule }           from '@angular/material/progress-spinner';
import { InvitationDetail }                   from 'app/layout/common/notifications/interface';
import { NotificationsService, notificationAvatarUrl } from 'app/layout/common/notifications/service';

export interface InvitationDetailDialogData {
    invitationId: string;
    /** Opened from the inviter's "accepted/declined" notification: read-only, no accept/decline actions. */
    viewAsInviter?: boolean;
}

@Component({
    selector    : 'invitation-detail-dialog',
    standalone  : true,
    templateUrl : './template.html',
    imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
})
export class InvitationDetailDialogComponent implements OnInit {
    invitation: InvitationDetail | null = null;
    loading = true;
    loadError = false;
    accepting = false;
    declining = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: InvitationDetailDialogData,
        private _dialogRef: MatDialogRef<InvitationDetailDialogComponent>,
        private _notificationsService: NotificationsService,
    ) {}

    ngOnInit(): void {
        const detail$ = this.data.viewAsInviter
            ? this._notificationsService.getSentInvitation(this.data.invitationId)
            : this._notificationsService.getInvitation(this.data.invitationId);
        detail$.subscribe((detail) => {
            this.loading = false;
            if (!detail) {
                this.loadError = true;
                return;
            }
            this.invitation = detail;
        });
    }

    get organizationName(): string {
        return this.invitation?.organization.name_kh || this.invitation?.organization.name_en || '';
    }

    organizationLogoUrl(): string {
        return notificationAvatarUrl(this.invitation?.organization.logo);
    }

    get subtitle(): string {
        const position = this.invitation?.position;
        const office = this.invitation?.office;
        const organization = this.invitation?.organization;
        const officeLabel = office
            ? (office.name_kh || office.name_en)
            : (organization?.name_kh || organization?.name_en);
        const parts = [
            position ? (position.name_kh || position.name_en) : null,
            officeLabel,
        ].filter(Boolean);
        return parts.join(' • ');
    }

    projectAvatarUrl(project: InvitationDetail['projects'][number]): string {
        return notificationAvatarUrl(project.avatar);
    }

    roleLabel(project: InvitationDetail['projects'][number]): string {
        return project.role?.name_kh || project.role?.name_en || '';
    }

    get isPending(): boolean {
        return !this.data.viewAsInviter && this.invitation?.status === 'pending';
    }

    /** The invitee's name when viewed as inviter — rendered bold, un-colored, separately from statusMessage. */
    get statusInviteeName(): string {
        if (!this.data.viewAsInviter) return '';
        if (this.invitation?.status !== 'accepted' && this.invitation?.status !== 'declined') return '';
        const invitee = this.invitation?.invitee;
        return invitee ? (invitee.name_kh || invitee.name_en || '') : (this.invitation?.email || '');
    }

    get statusMessage(): string {
        if (this.data.viewAsInviter) {
            switch (this.invitation?.status) {
                case 'accepted': return 'បានទទួលការអញ្ជើញ';
                case 'declined': return 'បានបដិសេធការអញ្ជើញនេះ';
                case 'expired':  return 'ការអញ្ជើញនេះបានផុតកំណត់';
                default:          return 'កំពុងរង់ចាំការឆ្លើយតប';
            }
        }
        switch (this.invitation?.status) {
            case 'accepted': return 'អ្នកបានយល់ព្រមការអញ្ជើញនេះរួចហើយ';
            case 'declined': return 'អ្នកបានបដិសេធការអញ្ជើញនេះ';
            case 'expired':  return 'ការអញ្ជើញនេះបានផុតកំណត់';
            default:          return '';
        }
    }

    get statusColorClass(): string {
        switch (this.invitation?.status) {
            case 'accepted': return 'text-teal-500 dark:text-teal-400';
            case 'declined': return 'text-red-500 dark:text-red-400';
            default:          return 'text-slate-500 dark:text-slate-400';
        }
    }

    onAvatarError(event: Event): void {
        (event.target as HTMLImageElement).src = 'images/logo/default_logo.png';
    }

    accept(): void {
        if (this.accepting || this.declining || !this.invitation) return;
        this.accepting = true;
        this._notificationsService.acceptInvitation(this.invitation.id).subscribe((ok) => {
            this.accepting = false;
            if (ok) {
                this._notificationsService.refresh();
                this._dialogRef.close('accepted');
            }
        });
    }

    decline(): void {
        if (this.accepting || this.declining || !this.invitation) return;
        this.declining = true;
        this._notificationsService.declineInvitation(this.invitation.id).subscribe((ok) => {
            this.declining = false;
            if (ok) {
                this._notificationsService.refresh();
                this._dialogRef.close('declined');
            }
        });
    }
}
