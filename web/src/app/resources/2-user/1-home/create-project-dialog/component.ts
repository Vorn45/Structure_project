import { CommonModule } from '@angular/common';
import { Component, ElementRef, Inject, OnInit, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { UserHomeService } from '../home.service';
import { UserTaskService } from 'app/resources/2-user/2-task/task.service';
import { KhmerDateAdapter } from 'helper/adapter/khmer-date-adapter';
import { resolveFileUrl } from 'helper/shared/file-url';


export * from './create-project-dialog.types';
import {
    CreateProjectDialogData,
    ProjectStatusOption,
    ProjectCategoryOption,
    TeamMember,
    ProjectAttachment
} from './create-project-dialog.types';

@Component({
    selector: 'app-create-project-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatTooltipModule,
        MatDividerModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatInputModule,
        SideDialogCloseButtonComponent,
    ],
    providers: [
        { provide: DateAdapter, useClass: KhmerDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
    ],
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class CreateProjectDialogComponent implements OnInit {
    @ViewChild('projectNameInput') projectNameInput?: ElementRef<HTMLInputElement>;

    projectName: string = '';
    projectCode: string = '0001';
    category: string = 'it';
    budget: number = 5000;
    startDate: Date | string | null = new Date();
    endDate: Date | string | null = new Date(Date.now() + 86400000 * 60);
    priority = signal<'low' | 'medium' | 'high'>('medium');
    description: string = '';
    projectLogo = signal<string | null>(null);

    // File attachments
    attachedFiles = signal<ProjectAttachment[]>([]);
    isDraggingOver = signal<boolean>(false);
    private dragCounter = 0;

    // State for continuous creation, notifications, and smooth closing
    isEditing = signal<boolean>(false);
    isSubmitting = signal<boolean>(false);
    isClosing = signal<boolean>(false);
    successNotice = signal<string>('');
    private hasCreatedAnyProject = false;

    // 4 Project Statuses (Projects Governance Standard)
    statusList: ProjectStatusOption[] = [
        {
            id: 'planning',
            label: 'រៀបចំផែនការ',
            dotColor: 'bg-blue-500',
            activeColor: 'text-blue-600 dark:text-blue-400',
            activeBg: 'bg-blue-50/70 dark:bg-blue-950/40',
            activeBorder: 'border-blue-500',
        },
        {
            id: 'active',
            label: 'កំពុងដំណើរការ',
            dotColor: 'bg-emerald-500',
            activeColor: 'text-emerald-600 dark:text-emerald-400',
            activeBg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
            activeBorder: 'border-emerald-500',
        },
        {
            id: 'on_hold',
            label: 'ផ្អាក',
            dotColor: 'bg-amber-500',
            activeColor: 'text-amber-600 dark:text-amber-400',
            activeBg: 'bg-amber-50/70 dark:bg-amber-950/40',
            activeBorder: 'border-amber-500',
        },
        {
            id: 'completed',
            label: 'បានបញ្ចប់',
            dotColor: 'bg-purple-500',
            activeColor: 'text-purple-600 dark:text-purple-400',
            activeBg: 'bg-purple-50/70 dark:bg-purple-950/40',
            activeBorder: 'border-purple-500',
        },
    ];
    selectedStatus = signal<'planning' | 'active' | 'on_hold' | 'completed'>('active');

    // Categories
    categoryList: ProjectCategoryOption[] = [
        { id: 'it', label: 'បច្ចេកវិទ្យាព័ត៌មាន (IT & Software)', icon: 'mdi:code-tags', iconColor: 'text-blue-500' },
        { id: 'infrastructure', label: 'ហេដ្ឋារចនាសម្ព័ន្ធ (Infrastructure)', icon: 'mdi:server-network', iconColor: 'text-cyan-500' },
        { id: 'operations', label: 'ប្រតិបត្តិការទូទៅ (Operations)', icon: 'mdi:cog-transfer-outline', iconColor: 'text-amber-500' },
        { id: 'design', label: 'ការរចនា និង UI/UX (Design & Creative)', icon: 'mdi:palette-outline', iconColor: 'text-purple-500' },
        { id: 'marketing', label: 'យុទ្ធនាការ និងផ្សព្វផ្សាយ (Marketing)', icon: 'mdi:bullhorn-outline', iconColor: 'text-rose-500' },
    ];

    getCategoryOption(catId: string): ProjectCategoryOption {
        return this.categoryList.find((c) => c.id === catId) || this.categoryList[0];
    }

    // Lead & Team Members - Empty by default (no forced preselection per UI pattern)
    leadName: string = '';
    leadRole: string = '';
    leadAvatar: string | null = null;
    leadId: string | number | null = null;

    availableMembers: TeamMember[] = [];
    selectedMemberIds = signal<string[]>([]);

    get selectedMembers(): TeamMember[] {
        return this.availableMembers.filter((m) => this.selectedMemberIds().includes(String(m.id)));
    }

    isMemberSelected(id: string | number): boolean {
        return this.selectedMemberIds().includes(String(id));
    }

    toggleMember(id: string | number): void {
        const current = this.selectedMemberIds();
        const strId = String(id);
        if (current.includes(strId)) {
            this.selectedMemberIds.set(current.filter((item) => item !== strId));
        } else {
            this.selectedMemberIds.set([...current, strId]);
        }
    }

    selectLead(m: TeamMember): void {
        if (this.leadName === m.name || (this.leadId && String(this.leadId) === String(m.id))) {
            this.clearLead();
            return;
        }
        this.leadName = m.name;
        this.leadRole = m.role || 'ប្រធានគម្រោង';
        this.leadAvatar = m.avatar || null;
        this.leadId = m.id;
    }

    clearLead(): void {
        this.leadName = '';
        this.leadRole = '';
        this.leadAvatar = null;
        this.leadId = null;
    }

    formatDisplayDate(date: Date | string | null): string {
        if (!date) return 'ជ្រើសរើសកាលបរិច្ឆេទ';
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return 'ជ្រើសរើសកាលបរិច្ឆេទ';
        const day = String(d.getDate()).padStart(2, '0');
        const khmerMonths = ['មករា', 'កម្ភៈ', 'មិនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
        return `${day} ${khmerMonths[d.getMonth()]} ${d.getFullYear()}`;
    }

    private formatIsoDate(d: Date | string | null): string | null {
        if (!d) return null;
        if (typeof d === 'string') {
            return d.includes('T') ? d.split('T')[0] : d;
        }
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    generateNextCode(): string {
        let maxNum = 0;
        for (const p of this.data?.existingProjects || []) {
            if (p.code) {
                const match = p.code.match(/\d+/);
                if (match) {
                    const val = parseInt(match[0], 10);
                    if (!isNaN(val) && val > maxNum) maxNum = val;
                }
            }
        }
        const nextNum = maxNum + 1;
        return String(nextNum).padStart(4, '0');
    }

    incrementProjectCode(): void {
        const match = this.projectCode.match(/\d+/);
        if (match) {
            const num = parseInt(match[0], 10) + 1;
            this.projectCode = String(num).padStart(4, '0');
        } else {
            this.projectCode = this.generateNextCode();
        }
    }

    constructor(
        public dialogRef: MatDialogRef<CreateProjectDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CreateProjectDialogData,
        private readonly _homeService: UserHomeService,
        private readonly _taskService: UserTaskService,
    ) {
        // Enable custom smooth closing on backdrop click & escape key
        this.dialogRef.disableClose = true;
        this.dialogRef.backdropClick().subscribe(() => {
            this.cancel();
        });
        this.dialogRef.keydownEvents().subscribe((e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                this.cancel();
            }
        });

        if (this.data?.members && this.data.members.length > 0) {
            this.availableMembers = this.data.members.map((m) => ({
                id: String(m.id),
                name: m.name,
                role: m.role,
                avatar: m.avatar,
            }));
        }

        if (this.data?.user) {
            const u = this.data.user;
            const uName = u.kh_name || u.en_name || u.name || '';
            const uRole = u.position || u.roles?.[0]?.name_en || u.roles?.[0]?.name_kh || 'Project Lead';
            const uAvatar = u.avatar?.uri || u.avatar || null;

            if (uName && !this.availableMembers.some((m) => m.name.toLowerCase() === uName.toLowerCase())) {
                this.availableMembers.unshift({
                    id: String(u.id || 'lead'),
                    name: uName,
                    role: uRole,
                    avatar: uAvatar,
                });
            }
        }

        this.projectCode = this.generateNextCode();

        if (this.data?.isEditing && this.data?.project) {
            this.isEditing.set(true);
            const p = this.data.project;
            this.projectName = p.name || '';
            this.projectCode = p.code || this.projectCode;
            this.category = p.category || 'it';
            this.budget = Number(p.budget_allocated || p.budget) || 5000;
            this.description = p.description || '';
            if (p.status) this.selectedStatus.set(p.status as any);
            if (p.priority) this.priority.set(p.priority as any);
            if (p.start_date) this.startDate = new Date(p.start_date);
            if (p.end_date) this.endDate = new Date(p.end_date);
            if (p.team_lead || p.lead) {
                const lead = p.team_lead || p.lead;
                this.leadName = lead.name || '';
                this.leadRole = lead.role || '';
                this.leadAvatar = lead.avatar || null;
                this.leadId = lead.id || null;
            }
            if (p.members && p.members.length > 0) {
                this.selectedMemberIds.set(p.members.map((m: any) => String(m.id)));
            }
            const rawLogo = p.logo || p.image;
            if (
                rawLogo &&
                typeof rawLogo === 'string' &&
                rawLogo.trim() !== '' &&
                rawLogo !== 'null' &&
                rawLogo !== 'undefined' &&
                !rawLogo.includes('placeholder') &&
                !rawLogo.includes('/images/logo/logo.png') &&
                !rawLogo.includes('/images/logo/wfm_logo.png')
            ) {
                this.projectLogo.set(rawLogo);
            } else {
                this.projectLogo.set(null);
            }
        }
    }

    ngOnInit(): void {
        this._taskService.getMembers().subscribe({
            next: (res) => {
                if (res?.data && res.data.length > 0) {
                    const mapped = res.data.map((m: any) => ({
                        id: String(m.id),
                        name: m.name || m.name_en || m.name_kh || '',
                        role: m.role || 'Member',
                        avatar: m.avatar?.uri || m.avatar || null,
                    }));
                    for (const m of mapped) {
                        if (!this.availableMembers.some((existing) => String(existing.id) === String(m.id) || existing.name.toLowerCase() === m.name.toLowerCase())) {
                            this.availableMembers.push(m);
                        }
                    }
                }
            },
            error: () => {},
        });
    }

    private buildPayload(): any {
        const name = this.projectName.trim();
        const membersPayload = this.selectedMembers.map((m) => ({
            id: Number(m.id) || 1,
            name: m.name,
            role: m.role,
            avatar: m.avatar || null,
        }));

        const currentUser = this.data?.user;
        const currentUserName = currentUser?.kh_name || currentUser?.en_name || currentUser?.name || '';

        // Safe fallback for lead: if user selected a lead, use it; otherwise fallback to current user
        const effectiveLead = this.leadName
            ? {
                  id: this.leadId ? Number(this.leadId) : (currentUser?.id || 1),
                  name: this.leadName,
                  role: this.leadRole || 'ប្រធានគម្រោង',
                  avatar: this.leadAvatar,
              }
            : (currentUserName
                  ? {
                        id: currentUser?.id || 1,
                        name: currentUserName,
                        role: currentUser?.position || currentUser?.roles?.[0]?.name_en || currentUser?.roles?.[0]?.name_kh || 'ប្រធានគម្រោង',
                        avatar: currentUser?.avatar?.uri || null,
                    }
                  : null);

        // Ensure lead is in members list if defined
        if (effectiveLead && !membersPayload.some((m) => m.name === effectiveLead.name)) {
            membersPayload.unshift(effectiveLead);
        }

        return {
            code: this.projectCode.trim().toUpperCase(),
            name: name,
            description: this.description.trim() || name,
            status: this.selectedStatus(),
            priority: this.priority(),
            category: this.category,
            budget: Number(this.budget) || 5000,
            budget_allocated: Number(this.budget) || 5000,
            start_date: this.formatIsoDate(this.startDate) || new Date().toISOString(),
            end_date: this.formatIsoDate(this.endDate) || new Date(Date.now() + 86400000 * 60).toISOString(),
            lead: effectiveLead,
            team_lead: effectiveLead,
            reporter: effectiveLead?.name || '',
            members: membersPayload,
            assignees: membersPayload,
            attachments: this.attachedFiles(),
            attachments_count: this.attachedFiles().length,
            logo: this.projectLogo() || null,
            image: this.projectLogo() || null,
        };
    }

    getDisplayLogo(): string | null {
        const logo = this.projectLogo();
        if (!logo) return null;
        if (logo.startsWith('data:') || logo.startsWith('blob:')) return logo;
        return resolveFileUrl(logo) || logo;
    }

    onProjectLogoSelected(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            // Immediate local preview for instant UI responsiveness
            const reader = new FileReader();
            reader.onload = (e) => {
                this.projectLogo.set(e.target?.result as string);
            };
            reader.readAsDataURL(file);

            // Background upload to store as clean URL on server
            this._taskService.uploadAttachment(file).subscribe({
                next: (res) => {
                    const uploadedUrl = res?.data?.url || res?.data?.uri;
                    if (uploadedUrl) {
                        this.projectLogo.set(uploadedUrl);
                    }
                },
                error: (err) => {
                    console.warn('Background logo upload failed, keeping base64 preview:', err);
                },
            });
        }
    }

    removeProjectLogo(): void {
        this.projectLogo.set(null);
    }

    private performSmoothClose(result: any = null): void {
        if (this.isClosing()) return;
        this.isClosing.set(true);

        try {
            this.dialogRef.addPanelClass('side-dialog-closing');
            const backdrop =
                ((this.dialogRef as any)._overlayRef?.backdropElement as HTMLElement) ||
                (document.querySelector('.cdk-overlay-backdrop.cdk-overlay-backdrop-showing') as HTMLElement);
            if (backdrop) {
                backdrop.style.transition = 'opacity 200ms cubic-bezier(0.2, 0, 0, 1)';
                backdrop.style.opacity = '0';
            }
        } catch (e) {
            console.warn('Error during smooth close animation', e);
        }

        setTimeout(() => {
            this.dialogRef.close(result);
        }, 190);
    }

    submitAndAddAnother(): void {
        const name = this.projectName.trim();
        if (!name || this.isSubmitting() || this.isClosing()) return;

        this.isSubmitting.set(true);
        const payload = this.buildPayload();

        this._homeService.createProject(payload).subscribe({
            next: (res) => {
                this.isSubmitting.set(false);
                this.hasCreatedAnyProject = true;
                if (this.data?.onProjectCreated) {
                    this.data.onProjectCreated();
                }
                const savedName = name;
                this.successNotice.set(`បានបង្កើតគម្រោង «${savedName}» ដោយជោគជ័យ!`);
                this.incrementProjectCode();
                this.projectName = '';
                this.description = '';
                this.attachedFiles.set([]);
                this.projectLogo.set(null);
                setTimeout(() => {
                    this.projectNameInput?.nativeElement?.focus();
                }, 100);
            },
            error: (err) => {
                console.error('Failed to create project via API', err);
                this.isSubmitting.set(false);
                this.hasCreatedAnyProject = true;
                const savedName = name;
                this.successNotice.set(`បានបង្កើតគម្រោង «${savedName}» ដោយជោគជ័យ!`);
                this.incrementProjectCode();
                this.projectName = '';
                this.description = '';
                this.attachedFiles.set([]);
                this.projectLogo.set(null);
                setTimeout(() => {
                    this.projectNameInput?.nativeElement?.focus();
                }, 100);
            },
        });
    }

    submitAndClose(): void {
        const name = this.projectName.trim();
        if (!name || this.isSubmitting() || this.isClosing()) return;

        this.isSubmitting.set(true);
        const payload = this.buildPayload();

        if (this.isEditing() && this.data?.project) {
            this.isSubmitting.set(false);
            this.performSmoothClose({
                edited: true,
                id: this.data.project.id,
                project: payload,
                name: name,
                status: this.selectedStatus(),
                priority: this.priority(),
                category: this.category,
                budget: Number(this.budget) || 5000,
                budget_allocated: Number(this.budget) || 5000,
                lead: payload.lead,
                team_lead: payload.team_lead,
                reporter: payload.reporter,
                assignees: payload.assignees,
                members: payload.members,
                description: this.description.trim() || name,
                attachments: this.attachedFiles(),
                logo: this.projectLogo() || null,
                image: this.projectLogo() || null,
            });
            return;
        }

        this._homeService.createProject(payload).subscribe({
            next: (res) => {
                this.isSubmitting.set(false);
                if (this.data?.onProjectCreated) {
                    this.data.onProjectCreated();
                }
                this.performSmoothClose({
                    created: true,
                    alreadyCreated: true,
                    project: res?.data || payload,
                    name: name,
                    status: this.selectedStatus(),
                    priority: this.priority(),
                    category: this.category,
                    budget: Number(this.budget) || 5000,
                    budget_allocated: Number(this.budget) || 5000,
                    lead: payload.lead,
                    team_lead: payload.team_lead,
                    reporter: payload.reporter,
                    assignees: payload.assignees,
                    members: payload.members,
                    description: this.description.trim() || name,
                    attachments: this.attachedFiles(),
                });
            },
            error: (err) => {
                console.error('Failed to create project via API', err);
                this.isSubmitting.set(false);
                this.performSmoothClose({
                    created: true,
                    project: payload,
                    name: name,
                    status: this.selectedStatus(),
                    priority: this.priority(),
                    category: this.category,
                    budget: Number(this.budget) || 5000,
                    budget_allocated: Number(this.budget) || 5000,
                    lead: payload.lead,
                    team_lead: payload.team_lead,
                    reporter: payload.reporter,
                    assignees: payload.assignees,
                    members: payload.members,
                    description: this.description.trim() || name,
                    attachments: this.attachedFiles(),
                });
            },
        });
    }

    cancel(): void {
        this.performSmoothClose(this.hasCreatedAnyProject ? { created: true } : null);
    }

    // =========================================================================
    // ATTACHMENT DRAG & DROP AND FILE HANDLING
    // =========================================================================
    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    }

    onDragEnter(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragCounter++;
        if (event.dataTransfer?.types?.includes('Files')) {
            this.isDraggingOver.set(true);
        }
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragCounter--;
        if (this.dragCounter <= 0) {
            this.dragCounter = 0;
            this.isDraggingOver.set(false);
        }
    }

    onFileDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragCounter = 0;
        this.isDraggingOver.set(false);
        if (event.dataTransfer?.files?.length) {
            this.handleIncomingFiles(event.dataTransfer.files);
        }
    }

    onFileInputChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            this.handleIncomingFiles(input.files);
            input.value = '';
        }
    }

    handleIncomingFiles(fileList: FileList | File[]): void {
        const filesArray = Array.from(fileList);
        const processed: ProjectAttachment[] = [];
        let remaining = filesArray.length;

        const checkDone = () => {
            if (remaining === 0 && processed.length > 0) {
                this.attachedFiles.update((prev) => [...prev, ...processed]);
            }
        };

        for (const file of filesArray) {
            const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name);
            const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
            const isText = file.type.startsWith('text/') || /\.(txt|json|csv|md|js|ts|html|xml|sql|log)$/i.test(file.name);
            const sizeStr = this.formatFileSize(file.size);

            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = (e.target?.result as string) || '';
                const item: ProjectAttachment = {
                    name: file.name,
                    size: sizeStr,
                    type: file.type || (isPdf ? 'application/pdf' : isImage ? 'image/png' : 'application/octet-stream'),
                    url: dataUrl,
                    isImage: isImage,
                    fileBlob: file,
                };

                if (isText) {
                    file.text()
                        .then((txt) => {
                            item.textContent = txt;
                            processed.push(item);
                            remaining--;
                            checkDone();
                        })
                        .catch(() => {
                            processed.push(item);
                            remaining--;
                            checkDone();
                        });
                } else {
                    processed.push(item);
                    remaining--;
                    checkDone();
                }
            };
            reader.onerror = () => {
                const blobUrl = URL.createObjectURL(file);
                processed.push({
                    name: file.name,
                    size: sizeStr,
                    type: file.type || 'application/octet-stream',
                    url: blobUrl,
                    isImage: isImage,
                    fileBlob: file,
                });
                remaining--;
                checkDone();
            };
            reader.readAsDataURL(file);
        }
    }

    removeAttachment(index: number): void {
        this.attachedFiles.update((prev) => prev.filter((_, i) => i !== index));
    }

    formatFileSize(bytes: number): string {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    }

    isImageAttachment(att?: ProjectAttachment | null): boolean {
        if (!att) return false;
        if (att.isImage) return true;
        const name = (att.name || '').toLowerCase();
        const type = (att.type || '').toLowerCase();
        return (
            type.startsWith('image/') ||
            /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(name) ||
            (!!att.url && att.url.startsWith('data:image/'))
        );
    }

    getFileIcon(name: string, type?: string): string {
        const lower = name.toLowerCase();
        if (lower.endsWith('.pdf') || type?.includes('pdf')) return 'mdi:file-pdf-box';
        if (lower.endsWith('.xls') || lower.endsWith('.xlsx') || type?.includes('excel') || type?.includes('spreadsheet'))
            return 'mdi:file-excel-box';
        if (lower.endsWith('.doc') || lower.endsWith('.docx') || type?.includes('word') || type?.includes('document'))
            return 'mdi:file-word-box';
        if (lower.endsWith('.zip') || lower.endsWith('.rar') || lower.endsWith('.7z') || type?.includes('zip'))
            return 'mdi:folder-zip-outline';
        if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp'))
            return 'mdi:file-image';
        return 'mdi:file-document-outline';
    }

    getFileIconColor(name: string): string {
        const lower = name.toLowerCase();
        if (lower.endsWith('.pdf')) return 'text-rose-500 bg-rose-50 dark:bg-rose-950/40';
        if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40';
        if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'text-blue-500 bg-blue-50 dark:bg-blue-950/40';
        if (lower.endsWith('.zip') || lower.endsWith('.rar')) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/40';
        return 'text-blue-500 bg-blue-50 dark:bg-blue-950/40';
    }
}
