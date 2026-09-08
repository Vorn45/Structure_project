import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, inject, signal, computed } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import * as echarts from 'echarts';
import { UserService } from 'app/core/user/user.service';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { CreateProjectDialogComponent } from 'app/resources/2-user/1-home/create-project-dialog/create-project-dialog.component';
import { CreateMeetingDialogComponent } from 'app/resources/2-user/1-home/create-meeting-dialog/create-meeting-dialog.component';
import { AddPlanDialogComponent } from 'app/resources/2-user/3-activity/add-plan-dialog.component';
import { CreateTaskDialogComponent } from './dialogs/create-task-dialog.component';
import { CreatePhaseDialogComponent } from './dialogs/create-phase-dialog.component';
import { CreateMemberDialogComponent } from './dialogs/create-member-dialog.component';
import { CreateLinkDialogComponent } from './dialogs/create-link-dialog.component';
import { AdminService, AdminProject, AdminUser } from '../admin.service';

export interface AgilePlanSegment {
    iteration: 1 | 2 | 3;
    startWeek: number; // 14 to 40
    durationWeeks: number;
    label?: string;
}

export interface AgilePlanTask {
    id: string;
    name: string;
    segments: AgilePlanSegment[];
}

export interface TaskMember {
    id: number;
    name: string;
    role: string;
    avatar?: string | null;
    initial?: string;
    bgClass?: string;
    email?: string;
    online?: boolean;
}

export interface TaskLink {
    id: string;
    title: string;
    url: string;
    type: 'figma' | 'github' | 'doc' | 'external';
    taskCode?: string;
    taskTitle?: string;
    createdAt?: string;
}

export interface TaskDocument {
    id: string;
    name: string;
    size: string;
    type: 'pdf' | 'doc' | 'image' | 'sheet';
    upload_date: string;
    url?: string;
}

export interface ProjectSubtaskItem {
    id: string;
    title: string;
    completed: boolean;
}

export interface ProjectMeetingItem {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    platform: 'Google Meet' | 'Zoom' | 'Microsoft Teams' | 'Office';
    link: string;
    status: 'upcoming' | 'completed' | 'ongoing';
    attendees: TaskMember[];
}

export interface ProjectPhaseItem {
    id: string;
    title: string;
    quarter: string;
    status: 'completed' | 'in_progress' | 'planned';
    startDate: string;
    endDate: string;
    tasksCount: number;
    progress?: number;
}

export interface TaskChatMessageItem {
    id: string;
    sender_name: string;
    sender_avatar?: string | null;
    sender_initial?: string;
    sender_bg?: string;
    text: string;
    time: string;
    is_self: boolean;
    is_system?: boolean;
    attachments?: { name: string; size: string; type: string; url?: string; isImage?: boolean }[];
}

export interface AdminTaskItem {
    id: string;
    code: string;
    title: string;
    description?: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    due_date?: string;
    created_at?: string;
    comments_count: number;
    attachments_count: number;
    assignee: TaskMember;
    reporter?: TaskMember;
    members?: TaskMember[];
    status: 'review' | 'done' | 'confirmed' | 'reopened' | 'new' | 'in_progress' | 'unconfirmed' | string;
    time_ago: string;
    progress?: number;
    subtasks?: ProjectSubtaskItem[];
    links?: TaskLink[];
    documents?: TaskDocument[];
}

export const DEFAULT_AGILE_TASKS: AgilePlanTask[] = [
    {
        id: 'task-1',
        name: 'ការប្រមូលតម្រូវការ & Architecture',
        segments: [
            { iteration: 1, startWeek: 14, durationWeeks: 2 },
            { iteration: 2, startWeek: 16, durationWeeks: 1 },
            { iteration: 3, startWeek: 17, durationWeeks: 3, label: '3W' },
        ],
    },
    {
        id: 'task-2',
        name: 'ការរចនាទម្រង់ទូទៅ UI/UX Design System',
        segments: [
            { iteration: 1, startWeek: 15, durationWeeks: 3, label: 'Sprint 1' },
            { iteration: 2, startWeek: 18, durationWeeks: 2 },
            { iteration: 3, startWeek: 20, durationWeeks: 4, label: '4W' },
        ],
    },
    {
        id: 'task-3',
        name: 'ការរៀបចំ Database & Rest APIs',
        segments: [
            { iteration: 1, startWeek: 18, durationWeeks: 2 },
            { iteration: 2, startWeek: 20, durationWeeks: 4, label: 'Sprint 2' },
            { iteration: 3, startWeek: 24, durationWeeks: 5, label: '5W' },
        ],
    },
    {
        id: 'task-4',
        name: 'Frontend State & Angular Signals Integration',
        segments: [
            { iteration: 1, startWeek: 22, durationWeeks: 3 },
            { iteration: 2, startWeek: 25, durationWeeks: 3 },
            { iteration: 3, startWeek: 28, durationWeeks: 6, label: 'Sprint 3' },
        ],
    },
    {
        id: 'task-5',
        name: 'ការធ្វើតេស្តសមាហរណកម្ម & UAT QA Testing',
        segments: [
            { iteration: 1, startWeek: 27, durationWeeks: 2 },
            { iteration: 2, startWeek: 29, durationWeeks: 3 },
            { iteration: 3, startWeek: 32, durationWeeks: 5, label: '5W' },
        ],
    },
    {
        id: 'task-6',
        name: 'ការវាយតម្លៃសុវត្ថិភាព & ដាក់ឱ្យដំណើរការ Deployment',
        segments: [
            { iteration: 1, startWeek: 31, durationWeeks: 2 },
            { iteration: 2, startWeek: 33, durationWeeks: 3 },
            { iteration: 3, startWeek: 36, durationWeeks: 4, label: 'Release' },
        ],
    },
];

export const DEFAULT_PROJECT_TASKS: AdminTaskItem[] = [
    {
        id: 't1',
        code: '#PMS-675',
        title: 'Org Admin | Structure | Department',
        description: 'គ្រប់គ្រងរចនាសម្ព័ន្ធស្ថាប័ន និងការបែងចែកនាយកដ្ឋានក្នុងប្រព័ន្ធ PMS។',
        priority: 'high',
        due_date: '2026-09-10',
        created_at: '2026-08-25',
        comments_count: 1,
        attachments_count: 2,
        assignee: { id: 2, name: 'ពុំ ប្រុសមុន្នី', role: 'User', initial: 'PB', bgClass: 'bg-blue-600 text-white', email: 'pumprusmuny@example.com' },
        reporter: { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Admin', initial: 'PP', bgClass: 'bg-emerald-600 text-white' },
        status: 'review',
        time_ago: '6 ថ្ងៃមុន',
        progress: 80,
        subtasks: [
            { id: 'st-1', title: 'Setup Department Hierarchy DB table', completed: true },
            { id: 'st-2', title: 'Connect tree view in Angular Signals', completed: true },
            { id: 'st-3', title: 'User assignment and roles modal', completed: false },
        ],
        links: [
            { id: 'l-1', title: 'Figma: Department Hierarchy Spec', url: 'https://figma.com', type: 'figma', taskCode: '#PMS-675' },
        ],
        documents: [
            { id: 'd-1', name: 'Org_Structure_SRS.pdf', size: '1.4 MB', type: 'pdf', upload_date: '២៦ សីហា ២០២៦' },
            { id: 'd-2', name: 'Department_Tree_Sample.xlsx', size: '340 KB', type: 'sheet', upload_date: '២៧ សីហា ២០២៦' },
        ],
        members: [
            { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Admin', initial: 'PP', bgClass: 'bg-emerald-600 text-white' },
            { id: 2, name: 'ពុំ ប្រុសមុន្នី', role: 'User', initial: 'PB', bgClass: 'bg-blue-600 text-white' },
        ],
    },
    {
        id: 't2',
        code: '#PMS-671',
        title: 'Project | Folder | Drag & Drop',
        description: 'មុខងារអូសទម្លាក់ Folder គម្រោង និងឯកសារដើម្បីផ្លាស់ប្តូរលំដាប់ដោយរលូន។',
        priority: 'high',
        due_date: '2026-09-08',
        created_at: '2026-08-22',
        comments_count: 0,
        attachments_count: 2,
        assignee: { id: 3, name: 'ថា វីនណឺរ', role: 'User', initial: 'TW', bgClass: 'bg-blue-700 text-white', email: 'thawinner@example.com' },
        reporter: { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Admin', initial: 'PP', bgClass: 'bg-emerald-600 text-white' },
        status: 'done',
        time_ago: '1 សប្តាហ៍មុន',
        progress: 100,
        subtasks: [
            { id: 'st-4', title: 'Integrate CDK DragDropModule', completed: true },
            { id: 'st-5', title: 'Add drop placeholder animations', completed: true },
        ],
        links: [
            { id: 'l-2', title: 'GitHub PR #481: Drag and Drop feature', url: 'https://github.com', type: 'github', taskCode: '#PMS-671' },
        ],
        documents: [
            { id: 'd-3', name: 'Folder_Dnd_Workflow.png', size: '1.2 MB', type: 'image', upload_date: '២៥ សីហា ២០២៦' },
        ],
        members: [
            { id: 3, name: 'ថា វីនណឺរ', role: 'User', initial: 'TW', bgClass: 'bg-blue-700 text-white' },
        ],
    },
    {
        id: 't3',
        code: '#PMS-670',
        title: 'Project | Folder | Cannot Scroll PDF',
        description: 'កែសម្រួលបញ្ហាមិនអាច Scroll មើលឯកសារ PDF នៅក្នុង Folder Preview Viewer។',
        priority: 'urgent',
        due_date: '2026-09-01',
        created_at: '2026-08-20',
        comments_count: 5,
        attachments_count: 1,
        assignee: { id: 2, name: 'ពុំ ប្រុសមុន្នី', role: 'User', initial: 'PB', bgClass: 'bg-blue-600 text-white', email: 'pumprusmuny@example.com' },
        reporter: { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Admin', initial: 'PP', bgClass: 'bg-emerald-600 text-white' },
        status: 'confirmed',
        time_ago: '1 សប្តាហ៍មុន',
        progress: 60,
        subtasks: [
            { id: 'st-6', title: 'Fix overflow-y-auto on PDF container', completed: true },
            { id: 'st-7', title: 'Test on Mobile Touch events', completed: false },
        ],
        links: [
            { id: 'l-3', title: 'Bug Report Video Link', url: 'https://loom.com', type: 'external', taskCode: '#PMS-670' },
        ],
        documents: [
            { id: 'd-5', name: 'PDF_Viewer_Bug_Screenshot.png', size: '650 KB', type: 'image', upload_date: '២៤ សីហា ២០២៦' },
        ],
        members: [
            { id: 2, name: 'ពុំ ប្រុសមុន្នី', role: 'User', initial: 'PB', bgClass: 'bg-blue-600 text-white' },
        ],
    },
    {
        id: 't4',
        code: '#PMS-574',
        title: 'My Work | Profile | Missing Cover',
        description: 'រូបភាព Cover ក្នុងផ្ទាំង Profile ផ្ទាល់ខ្លួនមិនបង្ហាញនៅពេល User ចូលប្រើដំបូង។',
        priority: 'urgent',
        due_date: '2026-08-30',
        created_at: '2026-08-18',
        comments_count: 3,
        attachments_count: 1,
        assignee: { id: 3, name: 'ថា វីនណឺរ', role: 'User', initial: 'TW', bgClass: 'bg-blue-800 text-white', email: 'thawinner@example.com' },
        reporter: { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Admin', initial: 'PP', bgClass: 'bg-emerald-600 text-white' },
        status: 'reopened',
        time_ago: '1 សប្តាហ៍មុន',
        progress: 40,
        subtasks: [
            { id: 'st-8', title: 'Add default gradient fallback cover', completed: true },
            { id: 'st-9', title: 'Check S3 presigned URL expiration', completed: false },
        ],
        links: [],
        documents: [],
        members: [
            { id: 3, name: 'ថា វីនណឺរ', role: 'User', initial: 'TW', bgClass: 'bg-blue-800 text-white' },
        ],
    },
    {
        id: 't5',
        code: '#PMS-554',
        title: 'Security setting UI improvements',
        description: 'កែលម្អលើទំព័រ Security Settings ដូចជា 2FA, Session Management, និង Password Expiry។',
        priority: 'high',
        due_date: '2026-08-29',
        created_at: '2026-08-16',
        comments_count: 4,
        attachments_count: 1,
        assignee: { id: 2, name: 'ពុំ ប្រុសមុន្នី', role: 'User', initial: 'PB', bgClass: 'bg-blue-600 text-white', email: 'pumprusmuny@example.com' },
        reporter: { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Admin', initial: 'PP', bgClass: 'bg-emerald-600 text-white' },
        status: 'new',
        time_ago: '1 សប្តាហ៍មុន',
        progress: 0,
        subtasks: [
            { id: 'st-10', title: 'Design 2FA QR verification modal', completed: false },
            { id: 'st-11', title: 'Add Active Sessions IP listing', completed: false },
        ],
        links: [
            { id: 'l-4', title: 'Figma Security Settings v2', url: 'https://figma.com', type: 'figma', taskCode: '#PMS-554' },
        ],
        documents: [
            { id: 'd-7', name: 'Security_Audit_Report.pdf', size: '2.1 MB', type: 'pdf', upload_date: '២០ សីហា ២០២៦' },
        ],
        members: [
            { id: 2, name: 'ពុំ ប្រុសមុន្នី', role: 'User', initial: 'PB', bgClass: 'bg-blue-600 text-white' },
        ],
    },
    {
        id: 't6',
        code: '#PMS-532',
        title: 'User | Report | Progress Compare',
        description: 'ផ្ទាំងប្រៀបធៀបវឌ្ឍនភាពការងាររវាងខែមុន និងខែបច្ចុប្បន្នរបស់សមាជិកម្នាក់ៗ។',
        priority: 'medium',
        due_date: '2026-09-15',
        created_at: '2026-08-28',
        comments_count: 0,
        attachments_count: 1,
        assignee: { id: 3, name: 'ថា វីនណឺរ', role: 'User', initial: 'TW', bgClass: 'bg-blue-700 text-white', email: 'thawinner@example.com' },
        reporter: { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Admin', initial: 'PP', bgClass: 'bg-emerald-600 text-white' },
        status: 'in_progress',
        time_ago: '2 សប្តាហ៍មុន',
        progress: 65,
        subtasks: [
            { id: 'st-12', title: 'Build comparison chart with ChartJS', completed: true },
            { id: 'st-13', title: 'Connect month selector dropdown', completed: true },
        ],
        links: [
            { id: 'l-5', title: 'Report Formula Documentation', url: 'https://notion.so', type: 'doc', taskCode: '#PMS-532' },
        ],
        documents: [],
        members: [
            { id: 3, name: 'ថា វីនណឺរ', role: 'User', initial: 'TW', bgClass: 'bg-blue-700 text-white' },
        ],
    },
    {
        id: 't7',
        code: '#PMS-531',
        title: 'User | Report | Progress',
        description: 'ទំព័ររបាយការណ៍សរុបវឌ្ឍនភាពបុគ្គលិក ម៉ោងបំពេញការងារ និងភាគរយសម្រេច។',
        priority: 'medium',
        due_date: '2026-09-06',
        created_at: '2026-08-15',
        comments_count: 19,
        attachments_count: 1,
        assignee: { id: 2, name: 'ពុំ ប្រុសមុន្នី', role: 'User', initial: 'PB', bgClass: 'bg-blue-600 text-white', email: 'pumprusmuny@example.com' },
        reporter: { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Admin', initial: 'PP', bgClass: 'bg-emerald-600 text-white' },
        status: 'done',
        time_ago: '2 សប្តាហ៍មុន',
        progress: 100,
        subtasks: [
            { id: 'st-15', title: 'User Progress Overview metrics cards', completed: true },
            { id: 'st-16', title: 'Daily activity bar breakdown', completed: true },
        ],
        links: [
            { id: 'l-6', title: 'GitHub PR #412: User Progress Report', url: 'https://github.com', type: 'github', taskCode: '#PMS-531' },
        ],
        documents: [],
        members: [
            { id: 2, name: 'ពុំ ប្រុសមុន្នី', role: 'User', initial: 'PB', bgClass: 'bg-blue-600 text-white' },
        ],
    },
    {
        id: 't8',
        code: '#PMS-513',
        title: 'Profile | Switch Org | Exit Org',
        description: 'មុខងារប្តូរស្ថាប័នការងារ (Switch Organization) និងការចាកចេញពីស្ថាប័នដោយសុវត្ថិភាព។',
        priority: 'low',
        due_date: '2026-09-12',
        created_at: '2026-08-14',
        comments_count: 10,
        attachments_count: 0,
        assignee: { id: 3, name: 'ថា វីនណឺរ', role: 'User', initial: 'TW', bgClass: 'bg-blue-600 text-white', email: 'thawinner@example.com' },
        reporter: { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Admin', initial: 'PP', bgClass: 'bg-emerald-600 text-white' },
        status: 'unconfirmed',
        time_ago: '2 សប្តាហ៍មុន',
        progress: 20,
        subtasks: [
            { id: 'st-17', title: 'Clear active tokens and cookies', completed: true },
            { id: 'st-18', title: 'Redirect to SSO logout flow', completed: false },
        ],
        links: [],
        documents: [],
        members: [
            { id: 3, name: 'ថា វីនណឺរ', role: 'User', initial: 'TW', bgClass: 'bg-blue-600 text-white' },
        ],
    },
];

export const DEFAULT_PROJECT_PHASES: ProjectPhaseItem[] = [
    {
        id: 'ph-1',
        title: 'ដំណាក់កាលទី ១៖ តម្រូវការ & គម្រោងប្លង់ UI/UX (Phase 1)',
        quarter: 'ត្រីមាសទី ២ (Q2)',
        status: 'completed',
        startDate: '០១ មេសា ២០២៦',
        endDate: '៣០ មិថុនា ២០២៦',
        tasksCount: 6,
    },
    {
        id: 'ph-2',
        title: 'ដំណាក់កាលទី ២៖ ការអភិវឌ្ឍ Core Modules & State Signals (Phase 2)',
        quarter: 'ត្រីមាសទី ៣ (Q3)',
        status: 'in_progress',
        startDate: '០១ កក្កដា ២០២៦',
        endDate: '៣០ កញ្ញា ២០២៦',
        tasksCount: 12,
    },
    {
        id: 'ph-3',
        title: 'ដំណាក់កាលទី ៣៖ ការធ្វើតេស្ត QA, Security Audit & Deploy (Phase 3)',
        quarter: 'ត្រីមាសទី ៤ (Q4)',
        status: 'planned',
        startDate: '០១ តុលា ២០២៦',
        endDate: '៣១ ធ្នូ ២០២៦',
        tasksCount: 6,
    },
];

export const DEFAULT_PROJECT_TEAM_MEMBERS: TaskMember[] = [
    { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Admin & Lead Developer', initial: 'PP', bgClass: 'bg-emerald-600 text-white', email: 'pisethpanhavorn544@gmail.com' },
    { id: 2, name: 'ពុំ ប្រុសមុន្នី', role: 'Frontend Engineer', initial: 'PB', bgClass: 'bg-blue-600 text-white', email: 'pumprusmuny@example.com' },
    { id: 3, name: 'ថា វីនណឺរ', role: 'QA & DevOps Engineer', initial: 'TW', bgClass: 'bg-blue-700 text-white', email: 'thawinner@example.com' },
];

export const DEFAULT_PROJECT_MEETINGS: ProjectMeetingItem[] = [
    {
        id: 'm-1',
        title: 'Weekly Sprint Sync & Task Progress Review',
        description: 'ពិនិត្យមើលវឌ្ឍនភាពការងារប្រចាំសប្តាហ៍ បញ្ហាស្ទះ (Blockers) និងកាលវិភាគ Sprint បន្ទាប់។',
        date: 'ថ្ងៃនេះ (Today)',
        time: 'ម៉ោង ០២:០០ រសៀល - ០៣:០០ រសៀល',
        platform: 'Google Meet',
        link: 'https://meet.google.com/pms-sync-2026',
        status: 'upcoming',
        attendees: [
            { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Admin', initial: 'PP', bgClass: 'bg-emerald-600' },
            { id: 2, name: 'ពុំ ប្រុសមុន្នី', role: 'User', initial: 'PB', bgClass: 'bg-blue-600' },
            { id: 3, name: 'ថា វីនណឺរ', role: 'User', initial: 'TW', bgClass: 'bg-blue-700' },
        ],
    },
    {
        id: 'm-2',
        title: 'UI/UX Design Review & Department Flow Alignment',
        description: 'ពិភាក្សាលើ Design Specs នៃ Department Hierarchy ក្នុង Figma ជាមួយក្រុម UI/UX។',
        date: 'ថ្ងៃស្អែក (Tomorrow)',
        time: 'ម៉ោង ១០:០០ ព្រឹក - ១១:០០ ព្រឹក',
        platform: 'Zoom',
        link: 'https://zoom.us/j/987654321',
        status: 'upcoming',
        attendees: [
            { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Admin', initial: 'PP', bgClass: 'bg-emerald-600' },
            { id: 2, name: 'ពុំ ប្រុសមុន្នី', role: 'User', initial: 'PB', bgClass: 'bg-blue-600' },
        ],
    },
    {
        id: 'm-3',
        title: 'Monthly Architecture & Security Retrospective',
        description: 'កិច្ចប្រជុំបូកសរុបរចនាសម្ព័ន្ធប្រព័ន្ធ សុវត្ថិភាពទិន្នន័យ និងផែនការកែលម្អប្រចាំខែ។',
        date: '២៥ សីហា ២០២៦',
        time: 'ម៉ោង ០៣:៣០ រសៀល',
        platform: 'Office',
        link: 'បន្ទប់ប្រជុំ A2',
        status: 'completed',
        attendees: [
            { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Admin', initial: 'PP', bgClass: 'bg-emerald-600' },
            { id: 3, name: 'រ័ត្ន វិចិត្រ', role: 'DevOps / QA', initial: 'R', bgClass: 'bg-blue-800' },
        ],
    },
];

export const DEFAULT_PROJECT_LINKS: TaskLink[] = [
    {
        id: 'l-1',
        title: 'Git Repository — PMS Enterprise V2',
        url: 'https://github.com/vorn45/pms-v2',
        type: 'github',
        taskCode: '#PMS-CORE',
    },
    {
        id: 'l-2',
        title: 'Figma Design System & Token UI Kit',
        url: 'https://figma.com/file/pms-design-v2',
        type: 'figma',
        taskCode: '#PMS-UI',
    },
    {
        id: 'l-3',
        title: 'Swagger API Documentation & Specifications',
        url: 'http://localhost:3000/api/docs',
        type: 'doc',
        taskCode: '#PMS-API',
    },
    {
        id: 'l-4',
        title: 'Security Compliance & Audit Checklist',
        url: 'https://docs.google.com/spreadsheets/pms-security-audit',
        type: 'doc',
        taskCode: '#PMS-554',
    },
    {
        id: 'l-5',
        title: 'System Architecture & Database Schema Diagram',
        url: 'https://dbdiagram.io/d/pms-enterprise-schema',
        type: 'external',
        taskCode: '#PMS-675',
    },
    {
        id: 'l-6',
        title: 'Sprint 2 Planning Board & Milestones',
        url: 'https://jira.wfm.gov.kh/projects/PMS/boards/2',
        type: 'external',
        taskCode: '#PMS-SPRINT2',
    },
];

@Component({
    selector: 'app-project-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatIconModule,
        MatTooltipModule,
        MatMenuModule,
        MatDialogModule,
        MatButtonModule,
    ],
    templateUrl: './project-management.component.html',
    styles: [`
        :host {
            display: block;
            font-family: 'Kantumruy Pro', sans-serif !important;
            font-size: 16px;
        }
    `],
})
export class ProjectManagementComponent implements OnInit, AfterViewInit, OnDestroy {
    private readonly _adminService = inject(AdminService);
    private readonly _fb = inject(FormBuilder);
    private readonly _matDialog = inject(MatDialog);
    private readonly _dialogConfigService = inject(DialogConfigService);
    private readonly _userService = inject(UserService);

    projects = signal<AdminProject[]>([]);
    users = signal<AdminUser[]>([]);
    loading = signal<boolean>(true);

    searchQuery = signal<string>('');
    statusFilter = signal<string>('all');

    // Selected Project for Scenario B
    selectedProject = signal<AdminProject | null>(null);
    projectNavTab = signal<'general' | 'plan' | 'tasks' | 'phases' | 'team' | 'meetings' | 'links'>('tasks');
    taskViewMode = signal<'list' | 'board'>('list');
    taskSearchQuery = signal<string>('');
    subtaskFilter = signal<string>('all');

    // Collections
    tasks = signal<AdminTaskItem[]>(DEFAULT_PROJECT_TASKS);
    phases = signal<ProjectPhaseItem[]>(DEFAULT_PROJECT_PHASES);
    teamMembers = signal<TaskMember[]>(DEFAULT_PROJECT_TEAM_MEMBERS);
    meetings = signal<ProjectMeetingItem[]>(DEFAULT_PROJECT_MEETINGS);
    links = signal<TaskLink[]>(DEFAULT_PROJECT_LINKS);
    agileTasks = signal<AgilePlanTask[]>(DEFAULT_AGILE_TASKS);

    // Links search and clipboard
    linkSearchQuery = signal<string>('');
    linkTypeFilter = signal<string>('all');
    copiedLinkId = signal<string | null>(null);

    // Active Task Modal / Drawer
    activeTaskModal = signal<AdminTaskItem | null>(null);
    activeDetailTab = signal<'chat' | 'subtasks' | 'members' | 'links' | 'documents'>('chat');
    newChatMessageText = signal<string>('');
    pendingChatAttachments = signal<{ name: string; size: string; type: string; url?: string; isImage?: boolean }[]>([]);
    currentTaskChatMessages = signal<TaskChatMessageItem[]>([]);
    private _taskChatMap: Map<string, TaskChatMessageItem[]> = new Map();

    // In-modal task detail inputs
    newSubtaskTitle = signal<string>('');
    newLinkTitle = signal<string>('');
    newLinkUrl = signal<string>('');
    showAddLinkForm = signal<boolean>(false);

    // Gantt / Timeline Configuration (Weeks 14 to 40 = 27 weeks total)
    readonly startWeek = 14;
    readonly totalWeeks = 27;
    readonly weeks = Array.from({ length: 27 }, (_, i) => 14 + i);
    readonly currentYear = new Date().getFullYear();
    readonly currentWeek = this.calculateCurrentWeek();

    readonly quarters = [
        { name: `${new Date().getFullYear()} ត្រីមាសទី ២ (Q2)`, startWeek: 14, weeksCount: 13, bgClass: 'bg-[#2e1065] text-white' },
        { name: `${new Date().getFullYear()} ត្រីមាសទី ៣ (Q3)`, startWeek: 27, weeksCount: 14, bgClass: 'bg-[#ea580c] text-white' },
    ];

    readonly months = [
        { name: 'មេសា', startWeek: 14, weeksCount: 5, bgClass: 'bg-[#f43f5e] text-white' },
        { name: 'ឧសភា', startWeek: 19, weeksCount: 4, bgClass: 'bg-[#0d9488] text-white' },
        { name: 'មិថុនា', startWeek: 23, weeksCount: 4, bgClass: 'bg-[#7c3aed] text-white' },
        { name: 'កក្កដា', startWeek: 27, weeksCount: 5, bgClass: 'bg-[#eab308] text-slate-900' },
        { name: 'សីហា', startWeek: 32, weeksCount: 4, bgClass: 'bg-[#0284c7] text-white' },
        { name: 'កញ្ញា', startWeek: 36, weeksCount: 5, bgClass: 'bg-[#0369a1] text-white' },
    ];

    // ECharts references
    @ViewChild('progressChartRef') progressChartRef?: ElementRef<HTMLDivElement>;
    @ViewChild('taskDistributionChartRef') taskDistributionChartRef?: ElementRef<HTMLDivElement>;
    private _progressChart?: echarts.ECharts;
    private _distributionChart?: echarts.ECharts;
    private _resizeObserver?: ResizeObserver;

    // Drawer & Modal States
    isDrawerOpen = signal<boolean>(false);
    isEditing = signal<boolean>(false);
    projectForm: FormGroup;
    saving = signal<boolean>(false);

    // Budget modal
    showBudgetModal = signal<boolean>(false);
    budgetProject = signal<AdminProject | null>(null);
    budgetForm: FormGroup;

    // Lead assignment modal
    showLeadModal = signal<boolean>(false);
    leadProject = signal<AdminProject | null>(null);
    selectedLeadId = signal<number | null>(null);

    // Delete modal
    deleteTarget = signal<AdminProject | null>(null);
    showDeleteModal = signal<boolean>(false);

    projectCounts = computed(() => {
        const list = this.projects();
        return {
            all: list.length,
            active: list.filter((p) => p.status === 'active').length,
            completed: list.filter((p) => p.status === 'completed').length,
            planning: list.filter((p) => p.status === 'planning').length,
            on_hold: list.filter((p) => p.status === 'on_hold').length,
        };
    });

    filteredProjects = computed(() => {
        let list = this.projects();
        const search = this.searchQuery().toLowerCase().trim();
        const status = this.statusFilter();

        if (search) {
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(search) ||
                    p.code.toLowerCase().includes(search) ||
                    p.description.toLowerCase().includes(search),
            );
        }

        if (status !== 'all') {
            list = list.filter((p) => p.status === status);
        }

        return list;
    });

    filteredProjectTasks = computed(() => {
        const q = this.taskSearchQuery().toLowerCase().trim();
        let list = this.tasks();
        if (q) {
            list = list.filter((t) =>
                t.title?.toLowerCase().includes(q) ||
                t.code?.toLowerCase().includes(q) ||
                t.description?.toLowerCase().includes(q),
            );
        }
        const filter = this.subtaskFilter();
        if (filter !== 'all') {
            list = list.filter((t) => t.status === filter);
        }
        return list;
    });

    allProjectLinks = computed(() => {
        const q = this.linkSearchQuery().toLowerCase().trim();
        const filter = this.linkTypeFilter();
        const proj = this.selectedProject();

        const list: {
            id: string;
            title: string;
            url: string;
            type: 'figma' | 'github' | 'doc' | 'external';
            taskCode: string;
            taskTitle: string;
        }[] = [];

        const seenIds = new Set<string>();

        // Project-level links
        for (const l of this.links()) {
            if (!seenIds.has(l.id)) {
                seenIds.add(l.id);
                list.push({
                    id: l.id,
                    title: l.title,
                    url: l.url,
                    type: l.type,
                    taskCode: l.taskCode || `#${proj?.code || 'PMS'}-001`,
                    taskTitle: proj?.name || 'ឯកសារគម្រោង',
                });
            }
        }

        // Task-level links
        for (const t of this.tasks()) {
            if (t.links) {
                for (const l of t.links) {
                    if (!seenIds.has(l.id)) {
                        seenIds.add(l.id);
                        list.push({
                            id: l.id,
                            title: l.title,
                            url: l.url,
                            type: l.type,
                            taskCode: t.code || `#${proj?.code || 'PMS'}-001`,
                            taskTitle: t.title || proj?.name || 'ការងារគម្រោង',
                        });
                    }
                }
            }
        }

        return list.filter((item) => {
            const matchesQuery =
                !q ||
                item.title.toLowerCase().includes(q) ||
                item.url.toLowerCase().includes(q) ||
                item.taskCode.toLowerCase().includes(q);
            const matchesType = filter === 'all' || item.type === filter;
            return matchesQuery && matchesType;
        });
    });

    boardColumns = computed(() => {
        const tasks = this.filteredProjectTasks();
        return [
            {
                id: 'new',
                title: 'ថ្មី (To-Do)',
                count: tasks.filter((t) => t.status === 'new' || t.status === 'unconfirmed').length,
                badgeClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/50',
                dotClass: 'bg-sky-500',
                tasks: tasks.filter((t) => t.status === 'new' || t.status === 'unconfirmed'),
            },
            {
                id: 'in_progress',
                title: 'កំពុងធ្វើ (In Progress)',
                count: tasks.filter((t) => t.status === 'in_progress' || t.status === 'reopened').length,
                badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
                dotClass: 'bg-amber-500',
                tasks: tasks.filter((t) => t.status === 'in_progress' || t.status === 'reopened'),
            },
            {
                id: 'review',
                title: 'ស្នើសុំពិនិត្យ (Review)',
                count: tasks.filter((t) => t.status === 'review' || t.status === 'confirmed').length,
                badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
                dotClass: 'bg-purple-500',
                tasks: tasks.filter((t) => t.status === 'review' || t.status === 'confirmed'),
            },
            {
                id: 'done',
                title: 'បញ្ចប់ (Done)',
                count: tasks.filter((t) => t.status === 'done' || t.status === 'completed').length,
                badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
                dotClass: 'bg-emerald-500',
                tasks: tasks.filter((t) => t.status === 'done' || t.status === 'completed'),
            },
        ];
    });

    taskStatusDistribution = computed(() => {
        const tasks = this.tasks();
        const counts = {
            done: tasks.filter((t) => t.status === 'done' || t.status === 'completed').length,
            review: tasks.filter((t) => t.status === 'review').length,
            in_progress: tasks.filter((t) => t.status === 'in_progress').length,
            confirmed: tasks.filter((t) => t.status === 'confirmed').length,
            reopened: tasks.filter((t) => t.status === 'reopened').length,
            new: tasks.filter((t) => t.status === 'new').length,
            unconfirmed: tasks.filter((t) => t.status === 'unconfirmed').length,
        };
        return [
            { key: 'done', name: 'បញ្ចប់ (Done)', count: counts.done || 2, color: '#10b981' },
            { key: 'review', name: 'ស្នើសុំពិនិត្យ (Review)', count: counts.review || 1, color: '#0284c7' },
            { key: 'in_progress', name: 'កំពុងធ្វើ (In Progress)', count: counts.in_progress || 1, color: '#f59e0b' },
            { key: 'confirmed', name: 'បញ្ជាក់ (Confirmed)', count: counts.confirmed || 1, color: '#8b5cf6' },
            { key: 'reopened', name: 'បើកឡើងវិញ (Reopened)', count: counts.reopened || 1, color: '#f43f5e' },
            { key: 'new', name: 'ថ្មី (New)', count: counts.new || 1, color: '#64748b' },
            { key: 'unconfirmed', name: 'មិនបញ្ជាក់ (Unconfirmed)', count: counts.unconfirmed || 1, color: '#94a3b8' },
        ];
    });

    constructor() {
        this.projectForm = this._fb.group({
            name: ['', [Validators.required]],
            code: ['', [Validators.required]],
            description: [''],
            status: ['active', [Validators.required]],
            progress: [0, [Validators.min(0), Validators.max(100)]],
            start_date: [new Date().toISOString().slice(0, 10)],
            end_date: [new Date(Date.now() + 86400000 * 45).toISOString().slice(0, 10)],
            budget: [5000],
        });

        this.budgetForm = this._fb.group({
            budget: [0, [Validators.required, Validators.min(0)]],
            spent: [0, [Validators.min(0)]],
        });
    }

    ngOnInit(): void {
        this.loadData();
    }

    ngAfterViewInit(): void {
        this.setupResizeObserver();
    }

    ngOnDestroy(): void {
        this._resizeObserver?.disconnect();
        this.disposeCharts();
    }

    calculateCurrentWeek(): number {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
        return Math.min(40, Math.max(14, Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7)));
    }

    getSegmentLeftPercent(startWeek: number): number {
        return Math.max(0, Math.min(100, ((startWeek - this.startWeek) / this.totalWeeks) * 100));
    }

    getSegmentWidthPercent(durationWeeks: number): number {
        return Math.max(0, Math.min(100, (durationWeeks / this.totalWeeks) * 100));
    }

    getIterationColor(iteration: 1 | 2 | 3): string {
        switch (iteration) {
            case 1:
                return 'bg-[#f59e0b] hover:bg-[#d97706]';
            case 2:
                return 'bg-[#f43f5e] hover:bg-[#e11d48]';
            case 3:
                return 'bg-[#581c87] hover:bg-[#4c1d95]';
            default:
                return 'bg-[#581c87] hover:bg-[#4c1d95]';
        }
    }

    setNavTab(tab: 'general' | 'plan' | 'tasks' | 'phases' | 'team' | 'meetings' | 'links'): void {
        this.projectNavTab.set(tab);
        if (tab === 'general') {
            setTimeout(() => {
                this.initProjectCharts();
            }, 100);
        }
    }

    // Task details modal methods
    openTaskModal(task: AdminTaskItem): void {
        this.activeTaskModal.set(task);
        this.activeDetailTab.set('chat');
        this.showAddLinkForm.set(false);
        this.loadTaskChat(task);
    }

    closeTaskModal(): void {
        this.activeTaskModal.set(null);
        this.showAddLinkForm.set(false);
        this.pendingChatAttachments.set([]);
        this.newChatMessageText.set('');
    }

    loadTaskChat(task: AdminTaskItem): void {
        if (!this._taskChatMap.has(task.id)) {
            const initialChats: TaskChatMessageItem[] = [
                {
                    id: `msg-${Date.now()}-1`,
                    sender_name: 'ប្រព័ន្ធ (System)',
                    text: `កិច្ចការ ${task.code} ត្រូវបានបង្កើតឡើងកាលពី ${task.time_ago || 'ថ្មីៗ'}`,
                    time: task.time_ago || 'ថ្មីៗ',
                    is_self: false,
                    is_system: true,
                },
                {
                    id: `msg-${Date.now()}-2`,
                    sender_name: 'ពុំ ប្រុសមុន្នី',
                    sender_initial: 'PB',
                    sender_bg: 'bg-blue-600',
                    text: `សួស្តីក្រុមការងារ! សូមពិនិត្យមើលព័ត៌មានលម្អិត និងកិច្ចការរងសម្រាប់ ${task.title} នេះផង។`,
                    time: '១០ នាទីមុន',
                    is_self: false,
                    is_system: false,
                },
                {
                    id: `msg-${Date.now()}-3`,
                    sender_name: 'ថា វីនណឺរ',
                    sender_initial: 'TW',
                    sender_bg: 'bg-blue-700',
                    text: 'បានទទួលហើយបង! ខ្ញុំកំពុងត្រៀមអនុវត្ត និងធ្វើតេស្តតាមដំណាក់កាល។',
                    time: '៥ នាទីមុន',
                    is_self: false,
                    is_system: false,
                },
            ];
            this._taskChatMap.set(task.id, initialChats);
        }
        this.currentTaskChatMessages.set([...(this._taskChatMap.get(task.id) || [])]);
    }

    sendTaskChatMessage(task: AdminTaskItem): void {
        const text = this.newChatMessageText().trim();
        const pendingAtts = [...this.pendingChatAttachments()];

        if (!text && pendingAtts.length === 0) return;

        const newMsg: TaskChatMessageItem = {
            id: `msg-${Date.now()}`,
            sender_name: 'អ្នកគ្រប់គ្រង (Admin)',
            sender_initial: 'AD',
            sender_bg: 'bg-blue-600',
            text: text,
            time: 'ទើបតែផ្ញើ',
            is_self: true,
            is_system: false,
            attachments: pendingAtts.length > 0 ? pendingAtts : undefined,
        };

        const currentList = this._taskChatMap.get(task.id) || [];
        const updatedList = [...currentList, newMsg];
        this._taskChatMap.set(task.id, updatedList);
        this.currentTaskChatMessages.set(updatedList);

        task.comments_count = updatedList.filter((m) => !m.is_system).length;
        this.newChatMessageText.set('');
        this.pendingChatAttachments.set([]);
    }

    onChatFileSelected(event: Event, task: AdminTaskItem): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const files = Array.from(input.files);
        const newAtts = files.map((f) => {
            const isImage = f.type.startsWith('image/');
            return {
                name: f.name,
                size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
                type: isImage ? 'image' : f.name.endsWith('.pdf') ? 'pdf' : f.name.endsWith('.xlsx') ? 'sheet' : 'doc',
                url: isImage ? URL.createObjectURL(f) : undefined,
                isImage: isImage,
            };
        });

        this.pendingChatAttachments.set([...this.pendingChatAttachments(), ...newAtts]);
        input.value = '';
    }

    removePendingChatAttachment(index: number): void {
        const current = [...this.pendingChatAttachments()];
        current.splice(index, 1);
        this.pendingChatAttachments.set(current);
    }

    toggleSubtask(task: AdminTaskItem, subtask: ProjectSubtaskItem): void {
        subtask.completed = !subtask.completed;
        if (task.subtasks) {
            const total = task.subtasks.length;
            const done = task.subtasks.filter((s) => s.completed).length;
            task.progress = total > 0 ? Math.round((done / total) * 100) : 0;
            if (task.progress === 100) {
                task.status = 'done';
            } else if (task.progress > 0) {
                task.status = 'in_progress';
            }
        }
    }

    addSubtask(task: AdminTaskItem): void {
        const title = this.newSubtaskTitle().trim();
        if (!title) return;
        if (!task.subtasks) task.subtasks = [];
        task.subtasks.push({
            id: `st-${Date.now()}`,
            title,
            completed: false,
        });
        this.newSubtaskTitle.set('');
        const total = task.subtasks.length;
        const done = task.subtasks.filter((s) => s.completed).length;
        task.progress = Math.round((done / total) * 100);
    }

    addLink(task: AdminTaskItem): void {
        const title = this.newLinkTitle().trim();
        let url = this.newLinkUrl().trim();
        if (!title || !url) return;

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`;
        }

        let type: 'figma' | 'github' | 'doc' | 'external' = 'external';
        if (url.includes('figma.com')) type = 'figma';
        else if (url.includes('github.com')) type = 'github';
        else if (url.includes('notion.so') || url.includes('docs.google.com')) type = 'doc';

        if (!task.links) task.links = [];
        task.links.push({
            id: `link-${Date.now()}`,
            title,
            url,
            type,
            taskCode: task.code,
        });

        this.newLinkTitle.set('');
        this.newLinkUrl.set('');
        this.showAddLinkForm.set(false);
    }

    removeLink(task: AdminTaskItem, linkId: string): void {
        if (task.links) {
            task.links = task.links.filter((l) => l.id !== linkId);
        }
    }

    triggerUploadDocument(task: AdminTaskItem): void {
        if (!task.documents) task.documents = [];
        const sampleDocs: TaskDocument[] = [
            { id: `doc-${Date.now()}`, name: 'System_Functional_Requirements_v1.pdf', size: '1.9 MB', type: 'pdf', upload_date: 'ថ្ងៃនេះ' },
            { id: `doc-${Date.now() + 1}`, name: 'API_Contract_Review.xlsx', size: '420 KB', type: 'sheet', upload_date: 'ថ្ងៃនេះ' },
        ];
        const randomDoc = sampleDocs[Math.floor(Math.random() * sampleDocs.length)];
        task.documents.push(randomDoc);
        task.attachments_count = task.documents.length;
    }

    removeDocument(task: AdminTaskItem, docId: string): void {
        if (task.documents) {
            task.documents = task.documents.filter((d) => d.id !== docId);
            task.attachments_count = task.documents.length;
        }
    }

    updateTaskStatus(task: AdminTaskItem, status: string): void {
        task.status = status;
        if (status === 'done') {
            task.progress = 100;
        }
    }

    // Phase management
    openCreatePhaseModal(): void {
        const proj = this.selectedProject();
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            currentPhasesCount: this.phases().length,
            projectName: proj?.name,
        });
        const dialogRef = this._matDialog.open(CreatePhaseDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.title) {
                const newPhase: ProjectPhaseItem = {
                    id: `ph-${Date.now()}`,
                    title: result.title,
                    quarter: result.quarter || 'ត្រីមាស',
                    startDate: result.startDate || '01/10/2026',
                    endDate: result.endDate || '31/12/2026',
                    tasksCount: 0,
                    status: result.status || 'planned',
                };
                this.phases.update((list) => [...list, newPhase]);
            }
        });
    }

    deletePhase(phaseId: string, event: Event): void {
        event.stopPropagation();
        this.phases.update((list) => list.filter((p) => p.id !== phaseId));
    }

    // Project Dialog
    openCreateProjectModal(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
        });
        const dialogRef = this._matDialog.open(CreateProjectDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result?.created) {
                const created = result.project;
                if (created) {
                    this.loadData();
                }
            }
        });
    }

    // Agile Plan Dialog
    openAddPlanDialog(proj?: AdminProject | null): void {
        const p = proj || this.selectedProject();
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            totalWeeks: this.totalWeeks,
            weeks: this.weeks,
            projects: this.projects().map((item) => ({ id: item.id, code: item.code, name: item.name })),
            selectedProjectId: p?.id,
            selectedProjectName: p?.name,
        });

        const dialogRef = this._matDialog.open(AddPlanDialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe((result?: any) => {
            if (result) {
                const newTask: AgilePlanTask = result.task || result;
                this.agileTasks.update((list) => [newTask, ...list]);
            }
        });
    }

    deleteAgileTask(taskId: string, event: Event): void {
        event.stopPropagation();
        this.agileTasks.update((list) => list.filter((t) => t.id !== taskId));
    }

    // Meeting management
    openCreateMeetingModal(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
        });
        const dialogRef = this._matDialog.open(CreateMeetingDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                const newM: ProjectMeetingItem = {
                    id: `m-${Date.now()}`,
                    title: result.title || result.name || 'កិច្ចប្រជុំថ្មី',
                    description: result.description || 'ការពិភាក្សា និងសម្របសម្រួលការងារគម្រោង',
                    date: result.date || 'ថ្ងៃនេះ',
                    time: result.time || 'ម៉ោង ០២:០០ រសៀល',
                    platform: result.platform || 'Google Meet',
                    link: result.link || 'https://meet.google.com',
                    status: 'upcoming',
                    attendees: [...this.teamMembers().slice(0, 3)],
                };
                this.meetings.update((list) => [newM, ...list]);
            }
        });
    }

    deleteMeeting(meetingId: string, event: Event): void {
        event.stopPropagation();
        this.meetings.update((list) => list.filter((m) => m.id !== meetingId));
    }

    // Member management
    openCreateMemberModal(): void {
        const proj = this.selectedProject();
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            projectName: proj?.name,
        });
        const dialogRef = this._matDialog.open(CreateMemberDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.name) {
                const newM: TaskMember = {
                    id: Date.now(),
                    name: result.name,
                    role: result.role || 'Developer',
                    email: result.email || undefined,
                    initial: result.name.charAt(0).toUpperCase(),
                    bgClass: 'bg-indigo-600 text-white',
                };
                this.teamMembers.update((list) => [...list, newM]);
            }
        });
    }

    deleteMember(memberId: number, event: Event): void {
        event.stopPropagation();
        this.teamMembers.update((list) => list.filter((m) => m.id !== memberId));
    }

    // Link management
    openCreateLinkModal(): void {
        const proj = this.selectedProject();
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            taskCode: proj ? `#${proj.code}-001` : '#PMS-001',
            projectName: proj?.name,
        });
        const dialogRef = this._matDialog.open(CreateLinkDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.title) {
                const newLink: TaskLink = {
                    id: `lnk-${Date.now()}`,
                    title: result.title,
                    url: result.url,
                    type: result.type || 'figma',
                    taskCode: result.taskCode || (proj ? `#${proj.code}-CORE` : '#PMS-CORE'),
                    createdAt: 'ថ្ងៃនេះ',
                };
                this.links.update((list) => [newLink, ...list]);
            }
        });
    }

    deleteProjectLink(linkId: string, event: Event): void {
        event.stopPropagation();
        this.links.update((list) => list.filter((l) => l.id !== linkId));
    }

    // Create Task modal
    openCreateTaskModal(): void {
        const proj = this.selectedProject();
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            projectCode: proj?.code,
            projectName: proj?.name,
            members: this.teamMembers(),
            existingTasks: this.tasks(),
        });
        const dialogRef = this._matDialog.open(CreateTaskDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.title) {
                const codeFormatted = result.code ? (result.code.startsWith('#') ? result.code : `#${result.code}`) : `#${proj?.code || 'BMS'}-${String(this.tasks().length).padStart(4, '0')}`;
                
                const selectedMembers: TaskMember[] = result.assignees && result.assignees.length > 0
                    ? result.assignees.map((a: any, idx: number) => ({
                        id: Number(a.id) || idx + 1,
                        name: a.name,
                        role: a.role || 'Member',
                        initial: (a.name || 'M').charAt(0).toUpperCase(),
                        bgClass: 'bg-indigo-600 text-white',
                        avatar: a.avatar || null,
                    }))
                    : [...this.teamMembers().slice(0, 2)];

                const primaryAssignee: TaskMember = selectedMembers.length > 0 ? selectedMembers[0] : {
                    id: 1,
                    name: typeof result.assignee === 'string' ? result.assignee : (result.assignee?.name || 'PISETH PANHAVORN'),
                    role: result.assignee?.role || 'Super Admin',
                    initial: (typeof result.assignee === 'string' ? result.assignee : (result.assignee?.name || 'P')).charAt(0).toUpperCase(),
                    bgClass: 'bg-blue-600 text-white',
                };

                const reporterName = typeof result.reporter === 'string'
                    ? result.reporter
                    : (result.reporter?.name || result.reporterName || 'ពិសិដ្ឋ បញ្ញាវ័ន្ត');

                const newTask: AdminTaskItem = {
                    id: `tsk-${Date.now()}`,
                    code: codeFormatted,
                    title: result.title,
                    description: result.description || result.title,
                    status: result.status || 'new',
                    priority: result.priority || 'medium',
                    due_date: result.due_date || '15/09/2026',
                    time_ago: 'ទើបបង្កើត',
                    comments_count: 0,
                    attachments_count: 0,
                    progress: 0,
                    reporter: {
                        id: 1,
                        name: reporterName,
                        role: result.reporter?.role || 'Super Admin',
                        initial: reporterName.charAt(0).toUpperCase(),
                        bgClass: 'bg-blue-600 text-white',
                    },
                    assignee: primaryAssignee,
                    subtasks: [
                        { id: `st-${Date.now()}`, title: 'រៀបចំលក្ខខណ្ឌតម្រូវការដំបូង', completed: false },
                    ],
                    members: selectedMembers,
                    links: [],
                    documents: [],
                };
                this.tasks.update((list) => [newTask, ...list]);
            }
        });
    }

    // Helper visual formatting
    getPriorityVisual(priority: string): { icon: string; color: string } {
        switch (priority) {
            case 'urgent': return { icon: 'mdi:alert-octagon', color: 'text-rose-500' };
            case 'high': return { icon: 'mdi:arrow-up-bold', color: 'text-amber-500' };
            case 'low': return { icon: 'mdi:arrow-down-bold', color: 'text-slate-400' };
            case 'medium':
            default: return { icon: 'mdi:equal', color: 'text-blue-500' };
        }
    }

    getPriorityLabel(priority: string): string {
        switch (priority) {
            case 'urgent': return 'បន្ទាន់';
            case 'high': return 'ខ្ពស់';
            case 'low': return 'ទាប';
            case 'medium':
            default: return 'មធ្យម';
        }
    }

    getPriorityClass(priority: string): string {
        switch (priority) {
            case 'urgent': return 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-200 dark:border-rose-900';
            case 'high': return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-200 dark:border-amber-900';
            case 'low': return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
            case 'medium':
            default: return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-200 dark:border-blue-900';
        }
    }

    getDocIcon(type: string): string {
        switch (type) {
            case 'pdf': return 'mdi:file-pdf-box';
            case 'sheet': return 'mdi:file-excel-box';
            case 'image': return 'mdi:file-image-box';
            case 'doc':
            default: return 'mdi:file-document-outline';
        }
    }

    getDocIconClass(type: string): string {
        switch (type) {
            case 'pdf': return 'text-red-500';
            case 'sheet': return 'text-emerald-600';
            case 'image': return 'text-purple-600';
            case 'doc':
            default: return 'text-blue-500';
        }
    }

    getLinkIcon(type: string): string {
        switch (type) {
            case 'figma': return 'mdi:palette';
            case 'github': return 'mdi:github';
            case 'doc': return 'mdi:file-document-edit-outline';
            default: return 'mdi:link-variant';
        }
    }

    copyLinkUrl(url: string, id: string): void {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url);
        }
        this.copiedLinkId.set(id);
        setTimeout(() => {
            if (this.copiedLinkId() === id) {
                this.copiedLinkId.set(null);
            }
        }, 2000);
    }

    formatDate(dateStr?: string | null): string {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    getTaskDateToDo(dueDateStr?: string | null, createdDateStr?: string | null): string {
        if (dueDateStr) {
            return this.formatDate(dueDateStr);
        }
        if (createdDateStr) {
            const d = new Date(createdDateStr);
            d.setDate(d.getDate() + 7);
            return this.formatDate(d.toISOString());
        }
        return '15/09/2026';
    }

    getDaysRemainingInfo(dueDateStr?: string | null): { text: string; isOverdue: boolean; isToday: boolean; isUpcoming: boolean } {
        if (!dueDateStr) {
            return { text: 'សល់ 7 ថ្ងៃ', isOverdue: false, isToday: false, isUpcoming: true };
        }
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const dueDate = new Date(dueDateStr);
        if (isNaN(dueDate.getTime())) {
            return { text: 'កំណត់រួចរាល់', isOverdue: false, isToday: false, isUpcoming: true };
        }
        dueDate.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            return { text: 'ហួសកាលកំណត់', isOverdue: true, isToday: false, isUpcoming: false };
        } else if (diffDays === 0) {
            return { text: 'ថ្ងៃនេះ (Today)', isOverdue: false, isToday: true, isUpcoming: false };
        } else {
            return { text: `សល់ ${diffDays} ថ្ងៃ`, isOverdue: false, isToday: false, isUpcoming: true };
        }
    }

    getTaskStatusLabel(status: string): string {
        switch (status?.toLowerCase()) {
            case 'review':
            case 'in_review': return 'ស្នើសុំពិនិត្យ';
            case 'done':
            case 'completed': return 'បញ្ចប់';
            case 'confirmed': return 'បញ្ជាក់';
            case 'reopened': return 'បើកឡើងវិញ';
            case 'new':
            case 'pending': return 'ថ្មី';
            case 'in_progress': return 'កំពុងធ្វើ';
            case 'unconfirmed':
            case 'todo': return 'មិនបញ្ជាក់';
            default: return status || 'មិនបញ្ជាក់';
        }
    }

    getTaskStatusClass(status: string): string {
        switch (status?.toLowerCase()) {
            case 'review':
            case 'in_review': return 'bg-sky-50/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800';
            case 'done':
            case 'completed': return 'bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
            case 'confirmed': return 'bg-purple-50/80 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800';
            case 'reopened': return 'bg-rose-50/80 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800';
            case 'new':
            case 'pending': return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
            case 'in_progress': return 'bg-amber-50/80 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
            case 'unconfirmed':
            case 'todo': return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
            default: return 'bg-slate-100 text-slate-700 border-slate-300';
        }
    }

    getTaskStatusIcon(status: string): string {
        switch (status?.toLowerCase()) {
            case 'review':
            case 'in_review': return 'mdi:magnify';
            case 'done':
            case 'completed': return 'mdi:check-circle-outline';
            case 'confirmed': return 'mdi:clipboard-check-outline';
            case 'reopened': return 'mdi:restore';
            case 'new':
            case 'pending': return 'mdi:clipboard-text-outline';
            case 'in_progress': return 'mdi:progress-clock';
            case 'unconfirmed':
            case 'todo': return 'mdi:close-circle-outline';
            default: return 'mdi:circle-outline';
        }
    }

    private setupResizeObserver(): void {
        if (typeof ResizeObserver !== 'undefined') {
            this._resizeObserver = new ResizeObserver(() => {
                if (this._progressChart && !this._progressChart.isDisposed()) {
                    this._progressChart.resize();
                }
                if (this._distributionChart && !this._distributionChart.isDisposed()) {
                    this._distributionChart.resize();
                }
            });
            this._resizeObserver.observe(document.body);
        }
    }

    private disposeCharts(): void {
        if (this._progressChart && !this._progressChart.isDisposed()) {
            this._progressChart.dispose();
            this._progressChart = undefined;
        }
        if (this._distributionChart && !this._distributionChart.isDisposed()) {
            this._distributionChart.dispose();
            this._distributionChart = undefined;
        }
    }

    initProjectCharts(): void {
        const proj = this.selectedProject();
        if (!proj) return;

        // 1. Progress & S-Curve / Burndown Chart
        if (this.progressChartRef?.nativeElement) {
            if (this._progressChart && !this._progressChart.isDisposed()) {
                this._progressChart.dispose();
            }
            this._progressChart = echarts.init(this.progressChartRef.nativeElement);
            
            const option: echarts.EChartsOption = {
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    borderColor: '#cbd5e1',
                    borderWidth: 1,
                    padding: [10, 14],
                    textStyle: { color: '#1e293b', fontFamily: "'Kantumruy Pro', sans-serif", fontSize: 15 },
                    axisPointer: {
                        type: 'cross',
                        crossStyle: { color: '#94a3b8' }
                    }
                },
                legend: {
                    data: ['វឌ្ឍនភាពជាក់ស្តែង (%)', 'ផែនការគ្រោងទុក (S-Curve %)', 'ការងារបានបញ្ចប់ (Tasks)'],
                    bottom: 0,
                    itemGap: 16,
                    textStyle: { color: '#475569', fontFamily: "'Kantumruy Pro', sans-serif", fontSize: 14 }
                },
                grid: {
                    top: '12%',
                    left: '3%',
                    right: '4%',
                    bottom: '14%',
                    containLabel: true
                },
                xAxis: [
                    {
                        type: 'category',
                        data: ['សប្តាហ៍ ១', 'សប្តាហ៍ ២', 'សប្តាហ៍ ៣', 'សប្តាហ៍ ៤', 'សប្តាហ៍ ៥', 'សប្តាហ៍ ៦', 'សប្តាហ៍ ៧', 'សប្តាហ៍ ៨'],
                        axisLine: { lineStyle: { color: '#cbd5e1' } },
                        axisLabel: { color: '#64748b', fontFamily: "'Kantumruy Pro', sans-serif", fontSize: 14 }
                    }
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: 'វឌ្ឍនភាព (%)',
                        min: 0,
                        max: 100,
                        nameTextStyle: { fontFamily: "'Kantumruy Pro', sans-serif", fontSize: 14, color: '#475569' },
                        axisLabel: { formatter: '{value}%', color: '#64748b', fontFamily: "'Kantumruy Pro', sans-serif", fontSize: 13.5 },
                        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
                    },
                    {
                        type: 'value',
                        name: 'ចំនួនការងារ',
                        min: 0,
                        max: 30,
                        nameTextStyle: { fontFamily: "'Kantumruy Pro', sans-serif", fontSize: 14, color: '#475569' },
                        axisLabel: { color: '#64748b', fontFamily: "'Kantumruy Pro', sans-serif", fontSize: 13.5 },
                        splitLine: { show: false }
                    }
                ],
                series: [
                    {
                        name: 'ផែនការគ្រោងទុក (S-Curve %)',
                        type: 'line',
                        smooth: true,
                        lineStyle: { width: 2.5, type: 'dashed', color: '#94a3b8' },
                        itemStyle: { color: '#94a3b8' },
                        data: [10, 20, 35, 50, 65, 80, 90, 100]
                    },
                    {
                        name: 'វឌ្ឍនភាពជាក់ស្តែង (%)',
                        type: 'line',
                        smooth: true,
                        lineStyle: { width: 3.5, color: '#2563eb' },
                        itemStyle: { color: '#2563eb' },
                        areaStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: 'rgba(37, 99, 235, 0.28)' },
                                { offset: 1, color: 'rgba(37, 99, 235, 0.01)' }
                            ])
                        },
                        data: [12, 22, 38, 48, proj.progress || 58]
                    },
                    {
                        name: 'ការងារបានបញ្ចប់ (Tasks)',
                        type: 'bar',
                        yAxisIndex: 1,
                        barWidth: 14,
                        itemStyle: {
                            borderRadius: [4, 4, 0, 0],
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: '#38bdf8' },
                                { offset: 1, color: '#0284c7' }
                            ])
                        },
                        data: [2, 5, 8, 11, proj.completed_tasks || 14]
                    }
                ]
            };
            this._progressChart.setOption(option);
        }

        // 2. Task Status Distribution Doughnut Chart
        if (this.taskDistributionChartRef?.nativeElement) {
            if (this._distributionChart && !this._distributionChart.isDisposed()) {
                this._distributionChart.dispose();
            }
            this._distributionChart = echarts.init(this.taskDistributionChartRef.nativeElement);

            const distList = this.taskStatusDistribution();

            const option: echarts.EChartsOption = {
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    borderColor: '#cbd5e1',
                    borderWidth: 1,
                    padding: [10, 14],
                    textStyle: { color: '#1e293b', fontFamily: "'Kantumruy Pro', sans-serif", fontSize: 15 },
                    formatter: '{b}: <b>{c} ការងារ</b> ({d}%)'
                },
                legend: {
                    show: false
                },
                series: [
                    {
                        name: 'ស្ថានភាពការងារ',
                        type: 'pie',
                        radius: ['50%', '76%'],
                        center: ['50%', '50%'],
                        avoidLabelOverlap: false,
                        itemStyle: {
                            borderRadius: 6,
                            borderColor: '#ffffff',
                            borderWidth: 2.5
                        },
                        label: {
                            show: false,
                            position: 'center'
                        },
                        emphasis: {
                            label: {
                                show: true,
                                formatter: '{b}\n{c} ការងារ',
                                fontSize: 15,
                                fontWeight: 'bold',
                                fontFamily: "'Kantumruy Pro', sans-serif",
                                color: '#1e293b'
                            }
                        },
                        labelLine: {
                            show: false
                        },
                        data: distList.map(item => ({
                            value: item.count,
                            name: item.name,
                            itemStyle: { color: item.color }
                        }))
                    }
                ]
            };
            this._distributionChart.setOption(option);
        }
    }

    loadData(): void {
        this.loading.set(true);
        this._adminService.getProjects().subscribe({
            next: (res) => {
                if (res.data && res.data.results) {
                    this.projects.set(res.data.results);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load projects:', err);
                this.loading.set(false);
            },
        });

        this._adminService.getUsers().subscribe({
            next: (res) => {
                if (res.data && res.data.results) {
                    this.users.set(res.data.results);
                }
            },
        });
    }

    selectProject(project: AdminProject): void {
        this.selectedProject.set(project);
        this.projectNavTab.set('tasks');
    }

    clearSelectedProject(): void {
        this.disposeCharts();
        this.selectedProject.set(null);
        this.activeTaskModal.set(null);
    }

    filterByStatus(status: string): void {
        this.statusFilter.set(status);
    }

    openCreateDrawer(): void {
        this.isEditing.set(false);
        this.projectForm.reset({
            name: '',
            code: `PMS-${Math.floor(100 + Math.random() * 900)}`,
            description: '',
            status: 'active',
            progress: 0,
            start_date: new Date().toISOString().slice(0, 10),
            end_date: new Date(Date.now() + 86400000 * 45).toISOString().slice(0, 10),
            budget: 5000,
        });
        this.isDrawerOpen.set(true);
    }

    openEditDrawer(project: AdminProject): void {
        this.isEditing.set(true);
        this.projectForm.patchValue({
            name: project.name,
            code: project.code,
            description: project.description,
            status: project.status,
            progress: project.progress,
            start_date: project.start_date ? project.start_date.slice(0, 10) : '',
            end_date: project.end_date ? project.end_date.slice(0, 10) : '',
            budget: project.budget || 0,
        });
        this.isDrawerOpen.set(true);
    }

    closeDrawer(): void {
        this.isDrawerOpen.set(false);
    }

    submitProjectForm(): void {
        if (this.projectForm.invalid) {
            this.projectForm.markAllAsTouched();
            return;
        }

        this.saving.set(true);
        const formVal = this.projectForm.value;

        if (this.isEditing() && this.selectedProject()) {
            this._adminService.updateProject(this.selectedProject()!.id, formVal).subscribe({
                next: (res) => {
                    this.projects.update((list) =>
                        list.map((p) => (p.id === res.data.id ? res.data : p)),
                    );
                    if (this.selectedProject()?.id === res.data.id) {
                        this.selectedProject.set(res.data);
                    }
                    this.saving.set(false);
                    this.closeDrawer();
                },
                error: (err) => {
                    console.error('Failed to update project:', err);
                    this.saving.set(false);
                },
            });
        } else {
            this._adminService.createProject(formVal).subscribe({
                next: (res) => {
                    this.projects.update((list) => [res.data, ...list]);
                    this.saving.set(false);
                    this.closeDrawer();
                },
                error: (err) => {
                    console.error('Failed to create project:', err);
                    this.saving.set(false);
                },
            });
        }
    }

    openBudgetModal(project: AdminProject, event?: Event): void {
        if (event) event.stopPropagation();
        this.budgetProject.set(project);
        this.budgetForm.patchValue({
            budget: project.budget || 5000,
            spent: project.spent || 0,
        });
        this.showBudgetModal.set(true);
    }

    saveBudget(): void {
        const project = this.budgetProject();
        if (!project || this.budgetForm.invalid) return;

        const val = this.budgetForm.value;
        this._adminService.updateProjectBudget(project.id, val.budget, val.spent).subscribe({
            next: (res) => {
                this.projects.update((list) =>
                    list.map((p) => (p.id === res.data.id ? { ...p, budget: val.budget, spent: val.spent } : p)),
                );
                if (this.selectedProject()?.id === res.data.id) {
                    this.selectedProject.update((p) => p ? { ...p, budget: val.budget, spent: val.spent } : null);
                }
                this.showBudgetModal.set(false);
                this.budgetProject.set(null);
            },
            error: (err) => console.error('Failed to update budget:', err),
        });
    }

    openLeadModal(project: AdminProject, event?: Event): void {
        if (event) event.stopPropagation();
        this.leadProject.set(project);
        const currentLead = project.members?.[0];
        this.selectedLeadId.set(currentLead ? currentLead.id : (this.users()[0]?.id || 1));
        this.showLeadModal.set(true);
    }

    saveLead(): void {
        const project = this.leadProject();
        const leadId = this.selectedLeadId();
        if (!project || !leadId) return;

        const leadUser = this.users().find((u) => u.id === Number(leadId));
        const leadName = leadUser ? leadUser.name_kh : 'Project Lead';

        this._adminService.updateProjectLead(project.id, Number(leadId), leadName).subscribe({
            next: (res) => {
                this.projects.update((list) =>
                    list.map((p) => (p.id === res.data.id ? res.data : p)),
                );
                if (this.selectedProject()?.id === res.data.id) {
                    this.selectedProject.set(res.data);
                }
                this.showLeadModal.set(false);
                this.leadProject.set(null);
            },
            error: (err) => console.error('Failed to update lead:', err),
        });
    }

    confirmDelete(project: AdminProject, event?: Event): void {
        if (event) event.stopPropagation();
        this.deleteTarget.set(project);
        this.showDeleteModal.set(true);
    }

    deleteProject(): void {
        const target = this.deleteTarget();
        if (!target) return;

        this._adminService.deleteProject(target.id).subscribe({
            next: () => {
                this.projects.update((list) => list.filter((p) => p.id !== target.id));
                if (this.selectedProject()?.id === target.id) {
                    this.clearSelectedProject();
                }
                this.showDeleteModal.set(false);
                this.deleteTarget.set(null);
            },
            error: (err) => console.error('Failed to delete project:', err),
        });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'active':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
            case 'completed':
                return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
            case 'on_hold':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
            case 'planning':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
        }
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'active': return 'mdi:progress-clock';
            case 'completed': return 'mdi:check-circle-outline';
            case 'on_hold': return 'mdi:pause-circle-outline';
            case 'planning': return 'mdi:calendar-outline';
            default: return 'mdi:circle-outline';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'active': return 'កំពុងដំណើរការ';
            case 'completed': return 'បានបញ្ចប់';
            case 'on_hold': return 'ផ្អាក';
            case 'planning': return 'រៀបចំផែនការ';
            default: return status;
        }
    }
}
