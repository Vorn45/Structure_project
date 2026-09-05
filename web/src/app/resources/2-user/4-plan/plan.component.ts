import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, effect, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import * as echarts from 'echarts';
import { UserService } from 'app/core/user/user.service';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { CreateProjectDialogComponent } from '../1-home/create-project-dialog/create-project-dialog.component';
import { CreateMeetingDialogComponent } from '../1-home/create-meeting-dialog/create-meeting-dialog.component';
import { AddPlanDialogComponent } from '../3-activity/add-plan-dialog.component';
import { ProfileViewComponent } from 'app/resources/1-account/2-profile/view/component';
import { ProjectPlanItem, UserPlanService } from './plan.service';

export interface AgilePlanSegment {
    iteration: 1 | 2 | 3;
    startWeek: number; // 14 to 40
    durationWeeks: number; // duration
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

export interface ProjectActivityItem {
    id: string;
    user: TaskMember;
    action: string;
    target: string;
    targetCode?: string;
    time_ago: string;
    type: 'status' | 'comment' | 'attachment' | 'subtask' | 'link';
}

export interface ProjectPhaseItem {
    id: string;
    number?: number;
    title: string;
    quarter: string;
    status: 'completed' | 'in_progress' | 'planned';
    progress?: number;
    startDate: string;
    endDate: string;
    tasksCount: number;
}

export interface IndividualTaskItem {
    id: string;
    code: string;
    title: string;
    description: string;
    type?: 'bug' | 'feature' | 'improvement';
    status: 'review' | 'done' | 'confirmed' | 'reopened' | 'new' | 'in_progress' | 'unconfirmed' | string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    due_date?: string;
    due_days_left?: number;
    created_at?: string;
    time_ago?: string;
    comments_count: number;
    attachments_count: number;
    reporter?: TaskMember;
    assignee: TaskMember;
    members: TaskMember[];
    progress?: number;
    subtasks: ProjectSubtaskItem[];
    links: TaskLink[];
    documents: TaskDocument[];
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

export interface ExtendedProjectItem extends Omit<ProjectPlanItem, 'members'> {
    members: TaskMember[];
    tasks: IndividualTaskItem[];
    meetings?: ProjectMeetingItem[];
    activities?: ProjectActivityItem[];
    phases?: ProjectPhaseItem[];
    agileTasks?: AgilePlanTask[];
    links?: TaskLink[];
    priority?: 'urgent' | 'high' | 'medium' | 'low' | string;
    category?: string;
    budget_allocated?: number;
    budget_spent?: number;
    team_lead?: TaskMember;
}

export const DEFAULT_AGILE_TASKS: AgilePlanTask[] = [
    {
        id: 'task-1',
        name: 'ការប្រមូលតម្រូវការ',
        segments: [
            { iteration: 1, startWeek: 14, durationWeeks: 1 },
            { iteration: 2, startWeek: 15, durationWeeks: 1 },
            { iteration: 3, startWeek: 16, durationWeeks: 3, label: '3W' },
        ],
    },
    {
        id: 'task-2',
        name: 'ដំណាក់កាលរចនាប្លង់',
        segments: [
            { iteration: 1, startWeek: 15, durationWeeks: 1 },
            { iteration: 3, startWeek: 16, durationWeeks: 5, label: '5W' },
        ],
    },
    {
        id: 'task-3',
        name: 'ការអភិវឌ្ឍគំរូសាកល្បង',
        segments: [
            { iteration: 1, startWeek: 16, durationWeeks: 1 },
            { iteration: 3, startWeek: 17, durationWeeks: 8, label: '8W' },
        ],
    },
    {
        id: 'task-4',
        name: 'ការប្រមូលមតិកែលម្អ',
        segments: [
            { iteration: 1, startWeek: 20, durationWeeks: 1 },
            { iteration: 2, startWeek: 21, durationWeeks: 1 },
            { iteration: 3, startWeek: 22, durationWeeks: 6, label: '6W' },
        ],
    },
    {
        id: 'task-5',
        name: 'ការរចនាស្ថាបត្យកម្មប្រព័ន្ធ',
        segments: [
            { iteration: 1, startWeek: 22, durationWeeks: 1 },
            { iteration: 2, startWeek: 23, durationWeeks: 1 },
            { iteration: 3, startWeek: 24, durationWeeks: 7, label: '7W' },
        ],
    },
    {
        id: 'task-6',
        name: 'ការអភិវឌ្ឍប្រព័ន្ធ Backend',
        segments: [
            { iteration: 1, startWeek: 23, durationWeeks: 2 },
            { iteration: 2, startWeek: 25, durationWeeks: 1 },
            { iteration: 3, startWeek: 26, durationWeeks: 8, label: '8W' },
        ],
    },
    {
        id: 'task-7',
        name: 'ការអភិវឌ្ឍផ្ទៃប្រព័ន្ធ Frontend',
        segments: [
            { iteration: 1, startWeek: 25, durationWeeks: 2 },
            { iteration: 2, startWeek: 27, durationWeeks: 2 },
            { iteration: 3, startWeek: 29, durationWeeks: 7, label: '7W' },
        ],
    },
    {
        id: 'task-8',
        name: 'ការធ្វើតេស្តសមាហរណកម្ម',
        segments: [
            { iteration: 1, startWeek: 26, durationWeeks: 1 },
            { iteration: 2, startWeek: 27, durationWeeks: 2 },
            { iteration: 3, startWeek: 29, durationWeeks: 6, label: '6W' },
        ],
    },
    {
        id: 'task-9',
        name: 'ការធ្វើតេស្តទទួលយក (UAT)',
        segments: [
            { iteration: 1, startWeek: 27, durationWeeks: 1 },
            { iteration: 2, startWeek: 28, durationWeeks: 2 },
            { iteration: 3, startWeek: 30, durationWeeks: 9, label: '9W' },
        ],
    },
    {
        id: 'task-10',
        name: 'ការកែសម្រួល & ដោះស្រាយបញ្ហា',
        segments: [
            { iteration: 1, startWeek: 28, durationWeeks: 2 },
            { iteration: 2, startWeek: 30, durationWeeks: 1 },
            { iteration: 3, startWeek: 31, durationWeeks: 8, label: '8W' },
        ],
    },
    {
        id: 'task-11',
        name: 'ការបង្កើនល្បឿន & សមត្ថភាព',
        segments: [
            { iteration: 3, startWeek: 32, durationWeeks: 4, label: '4W' },
        ],
    },
    {
        id: 'task-12',
        name: 'ការវាយតម្លៃសុវត្ថិភាព',
        segments: [
            { iteration: 1, startWeek: 30, durationWeeks: 1 },
            { iteration: 2, startWeek: 31, durationWeeks: 2, label: '5W' },
            { iteration: 3, startWeek: 33, durationWeeks: 5, label: '5W' },
        ],
    },
    {
        id: 'task-13',
        name: 'ការរៀបចំឯកសារបច្ចេកទេស',
        segments: [
            { iteration: 1, startWeek: 31, durationWeeks: 1 },
            { iteration: 2, startWeek: 32, durationWeeks: 2 },
            { iteration: 3, startWeek: 34, durationWeeks: 5, label: '5W' },
        ],
    },
    {
        id: 'task-14',
        name: 'ការបណ្តុះបណ្តាល & ណែនាំ',
        segments: [
            { iteration: 1, startWeek: 31, durationWeeks: 1 },
            { iteration: 2, startWeek: 32, durationWeeks: 3, label: '4W' },
            { iteration: 3, startWeek: 35, durationWeeks: 3, label: '3W' },
        ],
    },
    {
        id: 'task-15',
        name: 'ការពិនិត្យ & អនុម័តចុងក្រោយ',
        segments: [
            { iteration: 1, startWeek: 32, durationWeeks: 2, label: '3W' },
            { iteration: 2, startWeek: 34, durationWeeks: 2, label: '4W' },
            { iteration: 3, startWeek: 36, durationWeeks: 4, label: '4W' },
        ],
    },
    {
        id: 'task-16',
        name: 'ការត្រៀមដាក់ឱ្យដំណើរការ',
        segments: [
            { iteration: 2, startWeek: 33, durationWeeks: 3, label: '4W' },
            { iteration: 3, startWeek: 36, durationWeeks: 5, label: '5W' },
        ],
    },
    {
        id: 'task-17',
        name: 'ការដាក់ឱ្យប្រើប្រាស់ផ្លូវការ',
        segments: [
            { iteration: 1, startWeek: 33, durationWeeks: 1 },
            { iteration: 2, startWeek: 34, durationWeeks: 2, label: '4W' },
            { iteration: 3, startWeek: 36, durationWeeks: 4, label: '4W' },
        ],
    },
    {
        id: 'task-18',
        name: 'ការគាំទ្របច្ចេកទេស',
        segments: [
            { iteration: 1, startWeek: 33, durationWeeks: 1 },
            { iteration: 2, startWeek: 34, durationWeeks: 2, label: '4W' },
            { iteration: 3, startWeek: 36, durationWeeks: 4, label: '4W' },
        ],
    },
    {
        id: 'task-19',
        name: 'ការបិទបញ្ចប់ & ប្រគល់គម្រោង',
        segments: [
            { iteration: 1, startWeek: 34, durationWeeks: 1 },
            { iteration: 2, startWeek: 35, durationWeeks: 2, label: '3W' },
            { iteration: 3, startWeek: 37, durationWeeks: 3, label: '3W' },
        ],
    },
];

const DEFAULT_INVITED_PROJECTS: ExtendedProjectItem[] = [
    {
        id: '1',
        code: 'PMS-V2',
        name: 'ប្រព័ន្ធគ្រប់គ្រងគម្រោងបច្ចេកវិទ្យា (PMS)',
        description: 'ប្រព័ន្ធគ្រប់គ្រងគម្រោងបច្ចេកវិទ្យា ការងារ ដំណាក់កាល និងកាលវិភាគការងាររបស់បុគ្គលិក។',
        status: 'active',
        progress: 85,
        start_date: new Date(Date.now() - 86400000 * 30).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 45).toISOString(),
        total_tasks: 8,
        completed_tasks: 2,
        members: [
            { id: 1, name: 'ចេង ច័ន្ទបញ្ញា', role: 'Frontend Dev', avatar: null, initial: 'C', bgClass: 'bg-blue-600' },
            { id: 2, name: 'សុខ សុភា', role: 'Project Lead', avatar: null, initial: 'S', bgClass: 'bg-blue-600' },
            { id: 3, name: 'រ័ត្ន វិចិត្រ', role: 'DevOps', avatar: null, initial: 'R', bgClass: 'bg-blue-700' },
        ],
        tasks: [
            {
                id: 't-1',
                code: '#PMS-675',
                title: 'Org Admin | Structure | Department',
                description: 'គ្រប់គ្រងរចនាសម្ព័ន្ធស្ថាប័ន និងការបែងចែកនាយកដ្ឋានក្នុងប្រព័ន្ធ PMS។',
                priority: 'high',
                status: 'review',
                due_date: '2026-09-10',
                created_at: '2026-08-25',
                time_ago: '6 ថ្ងៃមុន',
                comments_count: 1,
                attachments_count: 2,
                assignee: { id: 0, name: 'Assignee', role: 'Member', avatar: null },
                members: [
                    { id: 2, name: 'សុខ សុភា', role: 'Lead', initial: 'S', bgClass: 'bg-blue-600' },
                ],
                progress: 80,
                subtasks: [
                    { id: 'st-1', title: 'Setup Department Hierarchy DB table', completed: true },
                    { id: 'st-2', title: 'Connect tree view in Angular', completed: true },
                    { id: 'st-3', title: 'User assignment modal', completed: false },
                ],
                links: [
                    { id: 'l-1', title: 'Figma: Department Hierarchy Spec', url: 'https://figma.com', type: 'figma' },
                ],
                documents: [
                    { id: 'd-1', name: 'Org_Structure_SRS.pdf', size: '1.4 MB', type: 'pdf', upload_date: '២៦ សីហា ២០២៦' },
                    { id: 'd-2', name: 'Department_Tree_Sample.xlsx', size: '340 KB', type: 'sheet', upload_date: '២៧ សីហា ២០២៦' },
                ],
            },
            {
                id: 't-2',
                code: '#PMS-671',
                title: 'Project | Folder | Drag & Drop',
                description: 'មុខងារអូសទម្លាក់ Folder គម្រោង និងឯកសារដើម្បីផ្លាស់ប្តូរលំដាប់ដោយរលូន។',
                priority: 'high',
                status: 'done',
                due_date: '2026-09-08',
                created_at: '2026-08-22',
                time_ago: '1 សប្តាហ៍មុន',
                comments_count: 0,
                attachments_count: 2,
                assignee: { id: 2, name: 'សុខ សុភា', role: 'Lead', initial: 'S', bgClass: 'bg-blue-600' },
                members: [
                    { id: 2, name: 'សុខ សុភា', role: 'Lead', initial: 'S', bgClass: 'bg-blue-600' },
                    { id: 1, name: 'ចេង ច័ន្ទបញ្ញា', role: 'Frontend', initial: 'C', bgClass: 'bg-blue-600' },
                ],
                progress: 100,
                subtasks: [
                    { id: 'st-4', title: 'Integrate CDK DragDropModule', completed: true },
                    { id: 'st-5', title: 'Add drop placeholder animations', completed: true },
                ],
                links: [
                    { id: 'l-2', title: 'GitHub PR #481: Drag and Drop feature', url: 'https://github.com', type: 'github' },
                ],
                documents: [
                    { id: 'd-3', name: 'Folder_Dnd_Workflow.png', size: '1.2 MB', type: 'image', upload_date: '២៥ សីហា ២០២៦' },
                    { id: 'd-4', name: 'Folder_API_Specs.pdf', size: '890 KB', type: 'pdf', upload_date: '២៥ សីហា ២០២៦' },
                ],
            },
            {
                id: 't-3',
                code: '#PMS-670',
                title: 'Project | Folder | Cannot Scroll PDF',
                description: 'កែសម្រួលបញ្ហាមិនអាច Scroll មើលឯកសារ PDF នៅក្នុង Folder Preview Viewer។',
                priority: 'urgent',
                status: 'confirmed',
                due_date: '2026-09-01',
                created_at: '2026-08-20',
                time_ago: '1 សប្តាហ៍មុន',
                comments_count: 5,
                attachments_count: 1,
                assignee: { id: 0, name: 'Assignee', role: 'Member', avatar: null },
                members: [
                    { id: 1, name: 'ចេង ច័ន្ទបញ្ញា', role: 'Frontend', initial: 'C', bgClass: 'bg-blue-600' },
                ],
                progress: 60,
                subtasks: [
                    { id: 'st-6', title: 'Fix overflow-y-auto on PDF container', completed: true },
                    { id: 'st-7', title: 'Test on Mobile Touch events', completed: false },
                ],
                links: [
                    { id: 'l-3', title: 'Bug Report Video Link', url: 'https://loom.com', type: 'external' },
                ],
                documents: [
                    { id: 'd-5', name: 'PDF_Viewer_Bug_Screenshot.png', size: '650 KB', type: 'image', upload_date: '២៤ សីហា ២០២៦' },
                ],
            },
            {
                id: 't-4',
                code: '#PMS-574',
                title: 'My Work | Profile | Missing Cover',
                description: 'រូបភាព Cover ក្នុងផ្ទាំង Profile ផ្ទាល់ខ្លួនមិនបង្ហាញនៅពេល User ចូលប្រើដំបូង។',
                priority: 'urgent',
                status: 'reopened',
                due_date: '2026-08-30',
                created_at: '2026-08-18',
                time_ago: '1 សប្តាហ៍មុន',
                comments_count: 3,
                attachments_count: 1,
                assignee: { id: 3, name: 'រ័ត្ន វិចិត្រ', role: 'DevOps', initial: 'R', bgClass: 'bg-blue-700' },
                members: [
                    { id: 3, name: 'រ័ត្ន វិចិត្រ', role: 'DevOps', initial: 'R', bgClass: 'bg-blue-700' },
                ],
                progress: 40,
                subtasks: [
                    { id: 'st-8', title: 'Add default gradient fallback cover', completed: true },
                    { id: 'st-9', title: 'Check S3 presigned URL expiration', completed: false },
                ],
                links: [],
                documents: [
                    { id: 'd-6', name: 'Profile_Cover_Issue.pdf', size: '540 KB', type: 'pdf', upload_date: '២២ សីហា ២០២៦' },
                ],
            },
            {
                id: 't-5',
                code: '#PMS-554',
                title: 'Security setting UI improvements',
                description: 'កែលម្អលើទំព័រ Security Settings ដូចជា 2FA, Session Management, និង Password Expiry។',
                priority: 'high',
                status: 'new',
                due_date: '2026-08-29',
                created_at: '2026-08-16',
                time_ago: '1 សប្តាហ៍មុន',
                comments_count: 4,
                attachments_count: 1,
                assignee: { id: 0, name: 'Assignee', role: 'Member', avatar: null },
                members: [
                    { id: 1, name: 'ចេង ច័ន្ទបញ្ញា', role: 'Frontend', initial: 'C', bgClass: 'bg-blue-600' },
                ],
                progress: 0,
                subtasks: [
                    { id: 'st-10', title: 'Design 2FA QR verification modal', completed: false },
                    { id: 'st-11', title: 'Add Active Sessions IP listing', completed: false },
                ],
                links: [
                    { id: 'l-4', title: 'Figma Security Settings v2', url: 'https://figma.com', type: 'figma' },
                ],
                documents: [
                    { id: 'd-7', name: 'Security_Audit_Report.pdf', size: '2.1 MB', type: 'pdf', upload_date: '២០ សីហា ២០២៦' },
                ],
            },
            {
                id: 't-6',
                code: '#PMS-532',
                title: 'User | Report | Progress Compare',
                description: 'ផ្ទាំងប្រៀបធៀបវឌ្ឍនភាពការងាររវាងខែមុន និងខែបច្ចុប្បន្នរបស់សមាជិកម្នាក់ៗ។',
                priority: 'medium',
                status: 'in_progress',
                due_date: '2026-09-15',
                created_at: '2026-08-28',
                time_ago: '2 សប្តាហ៍មុន',
                comments_count: 0,
                attachments_count: 1,
                assignee: { id: 2, name: 'សុខ សុភា', role: 'Lead', initial: 'S', bgClass: 'bg-blue-600' },
                members: [
                    { id: 2, name: 'សុខ សុភា', role: 'Lead', initial: 'S', bgClass: 'bg-blue-600' },
                ],
                progress: 65,
                subtasks: [
                    { id: 'st-12', title: 'Build comparison chart with ChartJS', completed: true },
                    { id: 'st-13', title: 'Connect month selector dropdown', completed: true },
                    { id: 'st-14', title: 'Export comparison data to Excel', completed: false },
                ],
                links: [
                    { id: 'l-5', title: 'Report Formula Documentation', url: 'https://notion.so', type: 'doc' },
                ],
                documents: [
                    { id: 'd-8', name: 'Progress_Comparison_Template.xlsx', size: '420 KB', type: 'sheet', upload_date: '១៨ សីហា ២០២៦' },
                ],
            },
            {
                id: 't-7',
                code: '#PMS-531',
                title: 'User | Report | Progress',
                description: 'ទំព័ររបាយការណ៍សរុបវឌ្ឍនភាពបុគ្គលិក ម៉ោងបំពេញការងារ និងភាគរយសម្រេច។',
                priority: 'medium',
                status: 'done',
                due_date: '2026-09-06',
                created_at: '2026-08-15',
                time_ago: '2 សប្តាហ៍មុន',
                comments_count: 19,
                attachments_count: 1,
                assignee: { id: 0, name: 'Assignee', role: 'Member', avatar: null },
                members: [
                    { id: 1, name: 'ចេង ច័ន្ទបញ្ញា', role: 'Frontend', initial: 'C', bgClass: 'bg-blue-600' },
                    { id: 2, name: 'សុខ សុភា', role: 'Lead', initial: 'S', bgClass: 'bg-blue-600' },
                ],
                progress: 100,
                subtasks: [
                    { id: 'st-15', title: 'User Progress Overview metrics cards', completed: true },
                    { id: 'st-16', title: 'Daily activity bar breakdown', completed: true },
                ],
                links: [
                    { id: 'l-6', title: 'GitHub PR #412: User Progress Report', url: 'https://github.com', type: 'github' },
                ],
                documents: [
                    { id: 'd-9', name: 'User_Progress_Sample.pdf', size: '1.5 MB', type: 'pdf', upload_date: '១៥ សីហា ២០២៦' },
                ],
            },
            {
                id: 't-8',
                code: '#PMS-513',
                title: 'Profile | Switch Org | Exit Org',
                description: 'មុខងារប្តូរស្ថាប័នការងារ (Switch Organization) និងការចាកចេញពីស្ថាប័នដោយសុវត្ថិភាព។',
                priority: 'low',
                status: 'unconfirmed',
                due_date: '2026-09-12',
                created_at: '2026-08-14',
                time_ago: '2 សប្តាហ៍មុន',
                comments_count: 10,
                attachments_count: 0,
                assignee: { id: 0, name: 'Assignee', role: 'Member', avatar: null },
                members: [
                    { id: 1, name: 'ចេង ច័ន្ទបញ្ញា', role: 'Frontend', initial: 'C', bgClass: 'bg-blue-600' },
                ],
                progress: 20,
                subtasks: [
                    { id: 'st-17', title: 'Clear active tokens and cookies', completed: true },
                    { id: 'st-18', title: 'Redirect to SSO logout flow', completed: false },
                ],
                links: [],
                documents: [],
            },
        ],
        phases: [
            {
                id: 'ph-1',
                number: 1,
                title: 'ដំណាក់កាលទី ១៖ ប្រមូលតម្រូវការ និងរចនាប្លង់ (UI/UX SRS)',
                quarter: 'ត្រីមាសទី ២ (Q2)',
                status: 'completed',
                progress: 100,
                startDate: '០១ មេសា ២០២៦',
                endDate: '៣០ មិថុនា ២០២៦',
                tasksCount: 4,
            },
            {
                id: 'ph-2',
                number: 2,
                title: 'ដំណាក់កាលទី ២៖ ការអភិវឌ្ឍប្រព័ន្ធ និង API (Core Development)',
                quarter: 'ត្រីមាសទី ៣ (Q3)',
                status: 'in_progress',
                progress: 75,
                startDate: '០១ កក្កដា ២០២៦',
                endDate: '៣០ កញ្ញា ២០២៦',
                tasksCount: 8,
            },
            {
                id: 'ph-3',
                number: 3,
                title: 'ដំណាក់កាលទី ៣៖ ការធ្វើតេស្តប្រព័ន្ធ និងដាក់ឱ្យប្រើប្រាស់ (QA & Deployment)',
                quarter: 'ត្រីមាសទី ៤ (Q4)',
                status: 'planned',
                progress: 0,
                startDate: '០១ តុលា ២០២៦',
                endDate: '៣១ ធ្នូ ២០២៦',
                tasksCount: 3,
            },
        ],
        meetings: [
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
                    { id: 2, name: 'សុខ សុភា', role: 'Project Lead', initial: 'S', bgClass: 'bg-blue-600' },
                    { id: 1, name: 'ចេង ច័ន្ទបញ្ញា', role: 'Frontend Dev', initial: 'C', bgClass: 'bg-blue-600' },
                    { id: 3, name: 'រ័ត្ន វិចិត្រ', role: 'DevOps', initial: 'R', bgClass: 'bg-blue-700' },
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
                    { id: 2, name: 'សុខ សុភា', role: 'Project Lead', initial: 'S', bgClass: 'bg-blue-600' },
                    { id: 1, name: 'ចេង ច័ន្ទបញ្ញា', role: 'Frontend Dev', initial: 'C', bgClass: 'bg-blue-600' },
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
                    { id: 2, name: 'សុខ សុភា', role: 'Project Lead', initial: 'S', bgClass: 'bg-blue-600' },
                    { id: 3, name: 'រ័ត្ន វិចិត្រ', role: 'DevOps', initial: 'R', bgClass: 'bg-blue-700' },
                ],
            },
        ],
        activities: [
            {
                id: 'act-1',
                user: { id: 2, name: 'សុខ សុភា', role: 'Lead', initial: 'S', bgClass: 'bg-blue-600' },
                action: 'បានផ្លាស់ប្តូរស្ថានភាពកិច្ចការទៅជា',
                target: '✓ បញ្ចប់',
                targetCode: '#PMS-671',
                time_ago: '១០ នាទីមុន',
                type: 'status',
            },
            {
                id: 'act-2',
                user: { id: 1, name: 'ចេង ច័ន្ទបញ្ញា', role: 'Frontend', initial: 'C', bgClass: 'bg-blue-600' },
                action: 'បានស្នើសុំពិនិត្យកិច្ចការ',
                target: 'Org Admin | Structure | Department',
                targetCode: '#PMS-675',
                time_ago: '២ ម៉ោងមុន',
                type: 'status',
            },
            {
                id: 'act-3',
                user: { id: 3, name: 'រ័ត្ន វិចិត្រ', role: 'DevOps', initial: 'R', bgClass: 'bg-blue-700' },
                action: 'បានភ្ជាប់ឯកសារថ្មី',
                target: 'Security_Audit_Report.pdf',
                targetCode: '#PMS-554',
                time_ago: 'ម្សិលមិញ',
                type: 'attachment',
            },
            {
                id: 'act-4',
                user: { id: 2, name: 'សុខ សុភា', role: 'Lead', initial: 'S', bgClass: 'bg-blue-600' },
                action: 'បានបន្ថែមតំណភ្ជាប់ Figma Spec',
                target: 'Figma Security Settings v2',
                targetCode: '#PMS-554',
                time_ago: '៣ ថ្ងៃមុន',
                type: 'link',
            },
            {
                id: 'act-5',
                user: { id: 1, name: 'ចេង ច័ន្ទបញ្ញា', role: 'Frontend', initial: 'C', bgClass: 'bg-blue-600' },
                action: 'បានបញ្ចប់កិច្ចការរង',
                target: 'Integrate CDK DragDropModule',
                targetCode: '#PMS-671',
                time_ago: '១ សប្តាហ៍មុន',
                type: 'subtask',
            },
        ],
        agileTasks: [...DEFAULT_AGILE_TASKS],
    },
];

@Component({
    selector: 'user-plan',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        MatDialogModule,
    ],
    templateUrl: './plan.component.html',
})
export class UserPlanComponent implements OnInit, OnDestroy {
    @ViewChild('taskDistributionChartRef') taskDistributionChartRef?: ElementRef<HTMLDivElement>;
    @ViewChild('taskTrendChartRef') taskTrendChartRef?: ElementRef<HTMLDivElement>;
    private _generalCharts: echarts.ECharts[] = [];
    private _resizeListener?: () => void;

    loading = signal<boolean>(false);
    plans = signal<ExtendedProjectItem[]>(DEFAULT_INVITED_PROJECTS);
    searchQuery = signal<string>('');
    statusFilter = signal<string>('all');

    // Currently selected project
    selectedProject = signal<ExtendedProjectItem | null>(null);

    // Sidebar navigation inside selected project (Matching Screenshot Concept)
    projectNavTab = signal<'general' | 'tasks' | 'plan' | 'phases' | 'team' | 'meetings' | 'links'>('tasks');

    // View Style for tasks: 'list' (exact match with screenshot) or 'board'
    taskViewStyle = signal<'list' | 'board'>('list');

    // Timeline configuration (Weeks 14 to 40 = 27 weeks total)
    readonly DEFAULT_AGILE_TASKS = DEFAULT_AGILE_TASKS;
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

    constructor(
        private readonly _planService: UserPlanService,
        private readonly _router: Router,
        private readonly _matDialog: MatDialog,
        private readonly _dialogConfigService: DialogConfigService,
        private readonly _userService: UserService,
    ) {
        effect(() => {
            const project = this.selectedProject();
            const tab = this.projectNavTab();
            if (project && tab === 'general') {
                setTimeout(() => this.initGeneralCharts(), 80);
            }
        });
    }

    openCreateProjectModal(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
        });
        const dialogRef = this._matDialog.open(CreateProjectDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result?.created) {
                const created = result.project;
                if (created) {
                    const newProj: ExtendedProjectItem = {
                        id: String(created.id || `proj-${Date.now()}`),
                        code: created.code || `PMS-${Math.floor(100 + Math.random() * 900)}`,
                        name: created.name || result.name || 'គម្រោងថ្មី',
                        description: created.description || '',
                        status: created.status || result.status || 'active',
                        priority: 'high',
                        category: 'Development',
                        budget_allocated: 50000,
                        budget_spent: 0,
                        total_tasks: 0,
                        completed_tasks: 0,
                        progress: 0,
                        start_date: created.start_date || new Date().toISOString(),
                        end_date: created.end_date || new Date(Date.now() + 86400000 * 30).toISOString(),
                        team_lead: { id: 1, name: result.reporter || 'Project Lead', role: 'Leader' },
                        members: (result.assignees || []).map((a: any, idx: number) => ({
                            id: Number(a.id) || idx + 1,
                            name: a.name,
                            role: a.role || 'Member',
                            initial: a.name ? a.name.charAt(0) : 'M',
                            bgClass: 'bg-blue-600',
                        })),
                        tasks: [],
                        phases: [],
                        meetings: [],
                        agileTasks: [...DEFAULT_AGILE_TASKS],
                        links: [],
                    };
                    this.plans.set([newProj, ...this.plans()]);
                    this.saveProjectChanges(newProj);
                }
                this.loadPlans();
            }
        });
    }

    openUserProfileDialog(user?: any): void {
        const currentUser = this._userService.getUser();
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            data: user || currentUser,
            roles: (user || currentUser)?.roles ?? [],
            type: 'គណនី',
        });
        this._matDialog.open(ProfileViewComponent, dialogConfig);
    }

    // Search input inside selected project tasks
    taskSearchQuery = signal<string>('');

    // Filter for subtasks/tasks within selected project
    subtaskFilter = signal<string>('all');

    // Links search and filtering
    linkSearchQuery = signal<string>('');
    linkTypeFilter = signal<string>('all');
    copiedLinkId = signal<string | null>(null);

    // Active Task for full modal / side detail view (showing chat, subtasks, members, links, documents)
    activeTaskModal = signal<IndividualTaskItem | null>(null);

    // Active Tab in Task Detail Modal: 'chat' | 'subtasks' | 'members' | 'links' | 'documents'
    activeDetailTab = signal<'chat' | 'subtasks' | 'members' | 'links' | 'documents'>('chat');

    // Task Chat Room State
    newChatMessageText = signal<string>('');
    pendingChatAttachments = signal<{ name: string; size: string; type: string; url?: string; isImage?: boolean }[]>([]);
    currentTaskChatMessages = signal<TaskChatMessageItem[]>([]);
    private _taskChatMap: Map<string, TaskChatMessageItem[]> = new Map();

    // New item inputs
    newSubtaskTitle = signal<string>('');
    newLinkTitle = signal<string>('');
    newLinkUrl = signal<string>('');
    showAddLinkForm = signal<boolean>(false);

    // Create Phase state
    showCreatePhaseModal = signal<boolean>(false);
    newPhaseTitle = signal<string>('');
    newPhaseQuarter = signal<string>('ត្រីមាសទី ១ (Q1)');
    newPhaseStartDate = signal<string>('01/10/2026');
    newPhaseEndDate = signal<string>('31/12/2026');
    newPhaseStatus = signal<'completed' | 'in_progress' | 'planned'>('planned');

    // Create Meeting state
    showCreateMeetingModal = signal<boolean>(false);
    newMeetingTitle = signal<string>('');
    newMeetingDescription = signal<string>('');
    newMeetingPlatform = signal<'Google Meet' | 'Zoom' | 'Microsoft Teams' | 'Office'>('Google Meet');
    newMeetingLink = signal<string>('https://meet.google.com/abc-defg-hij');
    newMeetingDate = signal<string>('ថ្ងៃនេះ (Today)');
    newMeetingTime = signal<string>('ម៉ោង ០២:០០ រសៀល - ០៣:០០ រសៀល');
    newMeetingStatus = signal<'upcoming' | 'completed' | 'ongoing'>('upcoming');

    // Create Member state
    showCreateMemberModal = signal<boolean>(false);
    newMemberName = signal<string>('');
    newMemberRole = signal<string>('Frontend Developer');
    newMemberEmail = signal<string>('');

    // Create Link state
    showCreateLinkModal = signal<boolean>(false);
    newProjectLinkTitle = signal<string>('');
    newProjectLinkUrl = signal<string>('');
    newProjectLinkType = signal<'figma' | 'github' | 'doc' | 'external'>('figma');
    newProjectLinkTaskCode = signal<string>('');

    // Create Task state
    showCreateTaskModal = signal<boolean>(false);
    newTaskTitle = signal<string>('');
    newTaskPriority = signal<'urgent' | 'high' | 'medium' | 'low'>('medium');
    newTaskStatus = signal<string>('new');
    newTaskDueDate = signal<string>('15/09/2026');
    newTaskAssignee = signal<string>('');

    // Project counts computed
    projectCounts = computed(() => {
        const all = this.plans();
        return {
            all: all.length,
            active: all.filter((p) => p.status === 'active').length,
            planning: all.filter((p) => p.status === 'planning').length,
            on_hold: all.filter((p) => p.status === 'on_hold').length,
            completed: all.filter((p) => p.status === 'completed').length,
        };
    });

    // Filtered plans computed
    filteredPlans = computed(() => {
        let list = this.plans();
        const q = this.searchQuery().toLowerCase().trim();
        if (q) {
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.code.toLowerCase().includes(q) ||
                    p.description.toLowerCase().includes(q),
            );
        }
        const status = this.statusFilter();
        if (status !== 'all') {
            list = list.filter((p) => p.status === status);
        }
        return list;
    });

    // Filtered tasks for currently selected project
    filteredProjectTasks = computed(() => {
        const proj = this.selectedProject();
        if (!proj || !proj.tasks) return [];
        let list = proj.tasks;

        const q = this.taskSearchQuery().toLowerCase().trim();
        if (q) {
            list = list.filter(
                (t) =>
                    t.title.toLowerCase().includes(q) ||
                    t.code.toLowerCase().includes(q) ||
                    t.description.toLowerCase().includes(q),
            );
        }

        const filter = this.subtaskFilter();
        if (filter !== 'all') {
            list = list.filter((t) => t.status === filter);
        }
        return list;
    });

    // All links flattened across all tasks and project-level links for the selected project
    allProjectLinks = computed(() => {
        const proj = this.selectedProject();
        if (!proj) return [];
        const q = this.linkSearchQuery().toLowerCase().trim();
        const filter = this.linkTypeFilter();

        const list: {
            id: string;
            title: string;
            url: string;
            type: 'figma' | 'github' | 'doc' | 'external';
            taskCode: string;
            taskTitle: string;
            task?: IndividualTaskItem;
        }[] = [];

        const seenIds = new Set<string>();

        if (proj.links) {
            for (const l of proj.links) {
                if (!seenIds.has(l.id)) {
                    seenIds.add(l.id);
                    list.push({
                        id: l.id,
                        title: l.title,
                        url: l.url,
                        type: l.type,
                        taskCode: `#${proj.code || 'PMS'}-001`,
                        taskTitle: proj.name || 'ឯកសារគម្រោង',
                    });
                }
            }
        }

        if (proj.tasks) {
            for (const t of proj.tasks) {
                if (t.links) {
                    for (const l of t.links) {
                        if (!seenIds.has(l.id)) {
                            seenIds.add(l.id);
                            list.push({
                                id: l.id,
                                title: l.title,
                                url: l.url,
                                type: l.type,
                                taskCode: t.code || `#${proj.code || 'PMS'}-001`,
                                taskTitle: t.title || proj.name,
                                task: t,
                            });
                        }
                    }
                }
            }
        }

        return list.filter((item) => {
            const matchesQuery =
                !q ||
                item.title.toLowerCase().includes(q) ||
                item.url.toLowerCase().includes(q) ||
                item.taskCode.toLowerCase().includes(q) ||
                item.taskTitle.toLowerCase().includes(q);
            const matchesType = filter === 'all' || item.type === filter;
            return matchesQuery && matchesType;
        });
    });

    // Board / Kanban Columns Grouping
    boardColumns = computed(() => {
        const tasks = this.filteredProjectTasks();
        return [
            {
                id: 'new',
                title: 'ថ្មី',
                count: tasks.filter((t) => t.status === 'new' || t.status === 'unconfirmed').length,
                badgeClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/50',
                dotClass: 'bg-sky-500',
                tasks: tasks.filter((t) => t.status === 'new' || t.status === 'unconfirmed'),
            },
            {
                id: 'in_progress',
                title: 'កំពុងដំណើរការ',
                count: tasks.filter((t) => t.status === 'in_progress' || t.status === 'reopened').length,
                badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
                dotClass: 'bg-amber-500',
                tasks: tasks.filter((t) => t.status === 'in_progress' || t.status === 'reopened'),
            },
            {
                id: 'review',
                title: 'ស្នើសុំពិនិត្យ',
                count: tasks.filter((t) => t.status === 'review' || t.status === 'confirmed').length,
                badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
                dotClass: 'bg-purple-500',
                tasks: tasks.filter((t) => t.status === 'review' || t.status === 'confirmed'),
            },
            {
                id: 'done',
                title: 'បានបញ្ចប់',
                count: tasks.filter((t) => t.status === 'done' || t.status === 'completed').length,
                badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
                dotClass: 'bg-emerald-500',
                tasks: tasks.filter((t) => t.status === 'done' || t.status === 'completed'),
            },
        ];
    });

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

    openAddPlanDialog(proj: ExtendedProjectItem): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            currentWeek: this.currentWeek,
            startWeek: this.startWeek,
            totalWeeks: this.totalWeeks,
            weeks: this.weeks,
            projects: this.plans().map((p) => ({ id: p.id, code: p.code, name: p.name })),
            selectedProjectId: proj.id,
            selectedProjectName: proj.name,
        });

        const dialogRef = this._matDialog.open(AddPlanDialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe((result?: any) => {
            if (result) {
                const newTask: AgilePlanTask = result.task || result;
                const targetProj =
                    (result.projectId && this.plans().find((p) => p.id === String(result.projectId))) || proj;
                if (!targetProj.agileTasks) {
                    targetProj.agileTasks = [...DEFAULT_AGILE_TASKS];
                }
                targetProj.agileTasks = [newTask, ...targetProj.agileTasks];
                this.saveProjectChanges(targetProj);
            }
        });
    }

            deleteAgileTask(proj: ExtendedProjectItem, taskId: string, event: Event): void {
                event.stopPropagation();
                if (!proj.agileTasks) {
                    proj.agileTasks = [...DEFAULT_AGILE_TASKS];
                }
                proj.agileTasks = proj.agileTasks.filter((t) => t.id !== taskId);
                this.saveProjectChanges(proj);
            }

            ngOnInit(): void {
                this.loadPlans();
            }

            loadPlans(): void {
                this.loading.set(true);

                this._planService
                    .getPlans({
                        search: this.searchQuery() || undefined,
                        status: this.statusFilter() !== 'all' ? this.statusFilter() : undefined,
                    })
                    .subscribe({
                        next: (res) => {
                            if (res?.data?.results?.length) {
                                const items: ExtendedProjectItem[] = res.data.results.map((ap) => {
                                    const existing = DEFAULT_INVITED_PROJECTS.find(
                                        (p) => p.id === String(ap.id) || p.code === ap.code || p.name === ap.name
                                    );
                                    return {
                                        id: String(ap.id),
                                        code: ap.code,
                                        name: ap.name,
                                        description: ap.description || existing?.description || '',
                                        status: (ap.status as any) || existing?.status || 'active',
                                        priority: (ap as any).priority || existing?.priority || 'high',
                                        category: (ap as any).category || existing?.category || 'Development',
                                        budget_allocated: (ap as any).budget_allocated || existing?.budget_allocated || 50000,
                                        budget_spent: (ap as any).budget_spent || existing?.budget_spent || 20000,
                                        total_tasks: ap.total_tasks || existing?.total_tasks || 0,
                                        completed_tasks: ap.completed_tasks || existing?.completed_tasks || 0,
                                        progress: ap.progress || existing?.progress || 0,
                                        start_date: ap.start_date || existing?.start_date || new Date().toISOString(),
                                        end_date: ap.end_date || existing?.end_date || new Date(Date.now() + 86400000 * 30).toISOString(),
                                        team_lead: (ap as any).team_lead || existing?.team_lead || { id: 1, name: 'Project Lead', role: 'Leader' },
                                        members: (ap as any).members?.length ? (ap as any).members : (existing?.members || []),
                                        tasks: (ap as any).tasks?.length ? (ap as any).tasks : (existing?.tasks || []),
                                        phases: (ap as any).phases?.length ? (ap as any).phases : (existing?.phases || []),
                                        meetings: (ap as any).meetings?.length ? (ap as any).meetings : (existing?.meetings || []),
                                        agileTasks: (ap as any).agileTasks?.length ? (ap as any).agileTasks : (existing?.agileTasks || [...DEFAULT_AGILE_TASKS]),
                                        links: (ap as any).links?.length ? (ap as any).links : (existing?.links || []),
                                    };
                                });
                                this.plans.set(items);
                            } else {
                                this.plans.set(DEFAULT_INVITED_PROJECTS);
                            }
                            this.loading.set(false);
                        },
                        error: () => {
                            this.plans.set(DEFAULT_INVITED_PROJECTS);
                            this.loading.set(false);
                        },
                    });
            }

            saveProjectChanges(proj?: ExtendedProjectItem | null): void {
                const target = proj || this.selectedProject();
                if (!target) return;

                const updated = { ...target };
                this.selectedProject.set(updated);
                this.plans.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));

                this._planService
                    .updatePlan(target.id, {
                        name: target.name,
                        code: target.code,
                        description: target.description,
                        status: target.status as any,
                        progress: target.progress,
                        start_date: target.start_date,
                        end_date: target.end_date,
                        total_tasks: target.tasks?.length || target.total_tasks,
                        completed_tasks:
                            target.tasks?.filter((t) => t.status === 'done' || t.status === 'completed').length ||
                            target.completed_tasks,
                        members: target.members,
                        ...({
                            tasks: target.tasks,
                            phases: target.phases,
                            meetings: target.meetings,
                            agileTasks: target.agileTasks,
                            links: target.links,
                        } as any),
                    })
                    .subscribe({
                        next: () => {},
                        error: () => {},
                    });
            }

    onSearchChange(): void {
        const q = this.searchQuery().toLowerCase().trim();
        if (!q && this.statusFilter() === 'all') {
            this.loadPlans();
        }
    }

    filterByStatus(status: string): void {
        this.statusFilter.set(status);
    }

    selectProject(project: ExtendedProjectItem): void {
        this.selectedProject.set(project);
        this.projectNavTab.set('tasks');
        this.subtaskFilter.set('all');
        this.taskSearchQuery.set('');
    }

    clearSelectedProject(): void {
        this.selectedProject.set(null);
        this.activeTaskModal.set(null);
    }

    // Open task detail & chat modal for selected project task
    openTaskModal(task: IndividualTaskItem): void {
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

    loadTaskChat(task: IndividualTaskItem): void {
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
                    sender_name: 'សុខ សុភា',
                    sender_initial: 'S',
                    sender_bg: 'bg-blue-600',
                    text: `សួស្តីក្រុមការងារ! សូមពិនិត្យមើលព័ត៌មានលម្អិត និងកិច្ចការរងសម្រាប់ ${task.title} នេះផង។`,
                    time: '១០ នាទីមុន',
                    is_self: false,
                    is_system: false,
                },
                {
                    id: `msg-${Date.now()}-3`,
                    sender_name: 'ចេង ច័ន្ទបញ្ញា',
                    sender_initial: 'C',
                    sender_bg: 'bg-blue-600',
                    text: 'បានទទួលហើយបង! ខ្ញុំកំពុងត្រៀមអនុវត្ត និងធ្វើតេស្តតាមដំណាក់កាល។',
                    time: '៥ នាទីមុន',
                    is_self: false,
                    is_system: false,
                },
            ];

            if (task.code === '#PMS-513') {
                initialChats.push({
                    id: `msg-${Date.now()}-4`,
                    sender_name: 'សុខ សុភា',
                    sender_initial: 'S',
                    sender_bg: 'bg-blue-600',
                    text: 'សូមយកចិត្តទុកដាក់លើ Flow Clear Active Tokens and Cookies ពេល User Logout ដើម្បីធានាសុវត្ថិភាពទិន្នន័យ។',
                    time: '៣ នាទីមុន',
                    is_self: false,
                    is_system: false,
                });
            }

            this._taskChatMap.set(task.id, initialChats);
        }

        this.currentTaskChatMessages.set([...(this._taskChatMap.get(task.id) || [])]);
    }

    sendTaskChatMessage(task: IndividualTaskItem): void {
        const text = this.newChatMessageText().trim();
        const pendingAtts = [...this.pendingChatAttachments()];

        if (!text && pendingAtts.length === 0) return;

        const newMsg: TaskChatMessageItem = {
            id: `msg-${Date.now()}`,
            sender_name: 'អ្នក (ខ្ញុំ)',
            sender_initial: 'ME',
            sender_bg: 'bg-blue-600',
            text: text,
            time: 'ទើបតែផ្ញើ (Just now)',
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

    onChatFileSelected(event: Event, task: IndividualTaskItem): void {
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

    toggleSubtask(task: IndividualTaskItem, subtask: ProjectSubtaskItem): void {
        subtask.completed = !subtask.completed;
        const total = task.subtasks.length;
        const done = task.subtasks.filter((s) => s.completed).length;
        task.progress = total > 0 ? Math.round((done / total) * 100) : 0;
        if (task.progress === 100) {
            task.status = 'done';
        } else if (task.progress > 0) {
            task.status = 'in_progress';
        }
        this.saveProjectChanges();
    }

    addSubtask(task: IndividualTaskItem): void {
        const title = this.newSubtaskTitle().trim();
        if (!title) return;
        task.subtasks.push({
            id: `st-${Date.now()}`,
            title,
            completed: false,
        });
        this.newSubtaskTitle.set('');
        const total = task.subtasks.length;
        const done = task.subtasks.filter((s) => s.completed).length;
        task.progress = Math.round((done / total) * 100);
        this.saveProjectChanges();
    }

    addLink(task: IndividualTaskItem): void {
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

        task.links.push({
            id: `link-${Date.now()}`,
            title,
            url,
            type,
        });

        this.newLinkTitle.set('');
        this.newLinkUrl.set('');
        this.showAddLinkForm.set(false);
        this.saveProjectChanges();
    }

    removeLink(task: IndividualTaskItem, linkId: string): void {
        task.links = task.links.filter((l) => l.id !== linkId);
        this.saveProjectChanges();
    }

    openCreatePhaseModal(): void {
        const proj = this.selectedProject();
        const nextNum = (proj?.phases?.length || 0) + 1;
        this.newPhaseTitle.set(`ដំណាក់កាលទី ${nextNum}៖ `);
        this.newPhaseQuarter.set(`ត្រីមាសទី ${nextNum} (Q${nextNum})`);
        this.newPhaseStartDate.set('01/10/2026');
        this.newPhaseEndDate.set('31/12/2026');
        this.newPhaseStatus.set('planned');
        this.showCreatePhaseModal.set(true);
    }

    createPhase(): void {
        const title = this.newPhaseTitle().trim();
        const proj = this.selectedProject();
        if (!title || !proj) return;
        if (!proj.phases) proj.phases = [];
        const newPhase: ProjectPhaseItem = {
            id: `ph-${Date.now()}`,
            title,
            quarter: this.newPhaseQuarter() || 'ត្រីមាស',
            startDate: this.newPhaseStartDate() || '01/10/2026',
            endDate: this.newPhaseEndDate() || '31/12/2026',
            tasksCount: 0,
            status: this.newPhaseStatus(),
        };
        proj.phases.push(newPhase);
        this.showCreatePhaseModal.set(false);
        this.saveProjectChanges(proj);
    }

    deletePhase(phaseId: string, event: Event): void {
        event.stopPropagation();
        const proj = this.selectedProject();
        if (!proj || !proj.phases) return;
        proj.phases = proj.phases.filter((p) => p.id !== phaseId);
        this.saveProjectChanges(proj);
    }

    openCreateMeetingModal(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
        });
        const dialogRef = this._matDialog.open(CreateMeetingDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadPlans();
            }
        });
    }

    createMeeting(): void {
        const title = this.newMeetingTitle().trim();
        const proj = this.selectedProject();
        if (!title || !proj) return;
        if (!proj.meetings) proj.meetings = [];
        const newM: ProjectMeetingItem = {
            id: `m-${Date.now()}`,
            title,
            description: this.newMeetingDescription().trim() || 'ការពិភាក្សា និងសម្របសម្រួលការងារគម្រោង',
            date: this.newMeetingDate().trim() || 'ថ្ងៃនេះ',
            time: this.newMeetingTime().trim() || 'ម៉ោង ០២:០០ រសៀល',
            platform: this.newMeetingPlatform(),
            link: this.newMeetingLink().trim() || 'https://meet.google.com',
            status: this.newMeetingStatus(),
            attendees: proj.members ? [...proj.members.slice(0, 3)] : [],
        };
        proj.meetings.unshift(newM);
        this.showCreateMeetingModal.set(false);
        this.saveProjectChanges(proj);
    }

    deleteMeeting(meetingId: string, event: Event): void {
        event.stopPropagation();
        const proj = this.selectedProject();
        if (!proj || !proj.meetings) return;
        proj.meetings = proj.meetings.filter((m) => m.id !== meetingId);
        this.saveProjectChanges(proj);
    }

    openCreateMemberModal(): void {
        this.newMemberName.set('');
        this.newMemberRole.set('Frontend Developer');
        this.newMemberEmail.set('');
        this.showCreateMemberModal.set(true);
    }

    createMember(): void {
        const name = this.newMemberName().trim();
        const proj = this.selectedProject();
        if (!name || !proj) return;
        if (!proj.members) proj.members = [];
        const newM: TaskMember = {
            id: Date.now(),
            name,
            role: this.newMemberRole() || 'Developer',
            email: this.newMemberEmail().trim() || undefined,
            initial: name.charAt(0).toUpperCase(),
            bgClass: 'bg-indigo-600',
        };
        proj.members.push(newM);
        this.showCreateMemberModal.set(false);
        this.saveProjectChanges(proj);
    }

    deleteMember(memberId: number, event: Event): void {
        event.stopPropagation();
        const proj = this.selectedProject();
        if (!proj || !proj.members) return;
        proj.members = proj.members.filter((m) => m.id !== memberId);
        this.saveProjectChanges(proj);
    }

    openCreateLinkModal(): void {
        const proj = this.selectedProject();
        this.newProjectLinkTitle.set('');
        this.newProjectLinkUrl.set('');
        this.newProjectLinkType.set('figma');
        this.newProjectLinkTaskCode.set(proj ? `#${proj.code}-001` : '#PMS-001');
        this.showCreateLinkModal.set(true);
    }

    createProjectLink(): void {
        const title = this.newProjectLinkTitle().trim();
        let url = this.newProjectLinkUrl().trim();
        const proj = this.selectedProject();
        if (!title || !proj) return;

        if (!url) {
            const type = this.newProjectLinkType();
            if (type === 'figma') url = 'https://figma.com';
            else if (type === 'github') url = 'https://github.com';
            else if (type === 'doc') url = 'https://notion.so';
            else url = 'https://google.com';
        } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        if (!proj.links) {
            proj.links = [];
        }

        const newLink: TaskLink = {
            id: `lnk-${Date.now()}`,
            title,
            url,
            type: this.newProjectLinkType(),
            createdAt: 'ថ្ងៃនេះ',
        };

        proj.links.unshift(newLink);

        if (proj.tasks && proj.tasks.length > 0) {
            const task = proj.tasks[0];
            if (!task.links) task.links = [];
            task.links.unshift(newLink);
        }

        this.showCreateLinkModal.set(false);
        this.newProjectLinkTitle.set('');
        this.newProjectLinkUrl.set('');
        this.saveProjectChanges(proj);
    }

    deleteProjectLink(linkId: string, event: Event): void {
        event.stopPropagation();
        const proj = this.selectedProject();
        if (!proj) return;
        if (proj.links) {
            proj.links = proj.links.filter((l) => l.id !== linkId);
        }
        if (proj.tasks) {
            for (const t of proj.tasks) {
                if (t.links) {
                    t.links = t.links.filter((l) => l.id !== linkId);
                }
            }
        }
        this.saveProjectChanges(proj);
    }

    openCreateTaskModal(): void {
        this.newTaskTitle.set('');
        this.newTaskStatus.set('new');
        this.newTaskPriority.set('medium');
        this.newTaskDueDate.set('');
        this.newTaskAssignee.set('');
        this.showCreateTaskModal.set(true);
    }

    createProjectTask(): void {
        const title = this.newTaskTitle().trim();
        const proj = this.selectedProject();
        if (!title || !proj) return;
        if (!proj.tasks) proj.tasks = [];
        const nextNum = proj.tasks.length + 101;
        const newTask: IndividualTaskItem = {
            id: `tsk-${Date.now()}`,
            code: `#${proj.code}-${nextNum}`,
            title,
            description: title,
            status: this.newTaskStatus(),
            priority: this.newTaskPriority(),
            due_date: this.newTaskDueDate(),
            due_days_left: 7,
            comments_count: 0,
            attachments_count: 0,
            reporter: {
                id: 1,
                name: 'អ្នកគ្រប់គ្រង (Admin)',
                role: 'Project Manager',
                initial: 'A',
                bgClass: 'bg-blue-600',
            },
            assignee: {
                id: 2,
                name: this.newTaskAssignee() || 'សមាជិកក្រុម',
                role: 'Assignee',
                initial: 'S',
                bgClass: 'bg-emerald-600',
            },
            subtasks: [
                { id: 'st-1', title: 'រៀបចំលក្ខខណ្ឌតម្រូវការដំបូង', completed: false },
            ],
            members: proj.members ? [...proj.members.slice(0, 2)] : [],
            links: [],
            documents: [],
        };
        proj.tasks.unshift(newTask);
        this.showCreateTaskModal.set(false);
        this.saveProjectChanges(proj);
    }

    triggerUploadDocument(task: IndividualTaskItem): void {
        const sampleDocs: TaskDocument[] = [
            { id: `doc-${Date.now()}`, name: 'System_Functional_Requirements_v1.pdf', size: '1.9 MB', type: 'pdf', upload_date: 'ថ្ងៃនេះ' },
            { id: `doc-${Date.now() + 1}`, name: 'API_Contract_Review.xlsx', size: '420 KB', type: 'sheet', upload_date: 'ថ្ងៃនេះ' },
        ];
        const randomDoc = sampleDocs[Math.floor(Math.random() * sampleDocs.length)];
        task.documents.push(randomDoc);
        task.attachments_count = task.documents.length;
    }

    removeDocument(task: IndividualTaskItem, docId: string): void {
        task.documents = task.documents.filter((d) => d.id !== docId);
        task.attachments_count = task.documents.length;
    }

    navigateHome(): void {
        this._router.navigate(['/member/home']);
    }

    navigateToPlan(): void {
        this._router.navigate(['/member/activity']);
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'active':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
            case 'completed':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/40';
            case 'on_hold':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
            case 'planning':
                return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/40';
            default:
                return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'active':
                return 'កំពុងដំណើរការ';
            case 'completed':
                return 'បានបញ្ចប់';
            case 'on_hold':
                return 'ផ្អាក';
            case 'planning':
                return 'រៀបចំផែនការ';
            default:
                return status;
        }
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'active':
                return 'mdi:clock-outline';
            case 'completed':
                return 'mdi:check-circle-outline';
            case 'on_hold':
                return 'mdi:pause-circle-outline';
            case 'planning':
                return 'mdi:calendar-clock-outline';
            default:
                return 'mdi:circle-outline';
        }
    }

    // Exact Status Pill Classes matching 2-task
    getTaskStatusClass(status: string): string {
        switch (status?.toLowerCase()) {
            case 'new':
            case 'pending':
                return 'bg-blue-50/90 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/40';
            case 'confirmed':
                return 'bg-indigo-50/90 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-800/40';
            case 'unconfirmed':
            case 'todo':
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
            case 'in_progress':
                return 'bg-amber-50/90 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/40';
            case 'in_review':
            case 'review':
                return 'bg-sky-50/90 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200/80 dark:border-sky-800/40';
            case 'reopened':
                return 'bg-rose-50/90 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/40';
            case 'done':
            case 'completed':
                return 'bg-emerald-50/90 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/40';
            default:
                return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    }

    // Exact Status MDI Icons matching 2-task
    getTaskStatusIcon(status: string): string {
        switch (status?.toLowerCase()) {
            case 'new':
            case 'pending':
                return 'mdi:clipboard-text-outline';
            case 'confirmed':
                return 'mdi:clipboard-check-outline';
            case 'unconfirmed':
            case 'todo':
                return 'mdi:clipboard-minus-outline';
            case 'in_progress':
                return 'mdi:progress-clock';
            case 'in_review':
            case 'review':
                return 'mdi:magnify';
            case 'reopened':
                return 'mdi:restore';
            case 'done':
            case 'completed':
                return 'mdi:check-circle';
            default:
                return 'mdi:clipboard-outline';
        }
    }

    // Exact Status Pill Clean Khmer Labels matching 2-task
    getTaskStatusLabel(status: string): string {
        switch (status?.toLowerCase()) {
            case 'new':
            case 'pending':
                return 'ថ្មី';
            case 'confirmed':
                return 'បញ្ជាក់';
            case 'unconfirmed':
            case 'todo':
                return 'មិនបញ្ជាក់';
            case 'in_progress':
                return 'កំពុងធ្វើ';
            case 'in_review':
            case 'review':
                return 'ស្នើពិនិត្យ';
            case 'reopened':
                return 'បើកឡើងវិញ';
            case 'done':
            case 'completed':
                return 'បញ្ចប់';
            default:
                return status || 'មិនបញ្ជាក់';
        }
    }

    // Exact Priority Icon matching Screenshot 2
    getPriorityVisual(priority: string): { icon: string; color: string } {
        switch (priority) {
            case 'urgent':
                return { icon: 'mdi:alert-octagon', color: 'text-red-500' };
            case 'high':
                return { icon: 'mdi:arrow-up-bold', color: 'text-amber-500' };
            case 'low':
                return { icon: 'mdi:arrow-down-bold', color: 'text-slate-400' };
            case 'medium':
            default:
                return { icon: 'mdi:equal', color: 'text-blue-500' };
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
            case 'pdf':
                return 'mdi:file-pdf-box';
            case 'sheet':
                return 'mdi:file-excel-box';
            case 'image':
                return 'mdi:file-image-box';
            case 'doc':
            default:
                return 'mdi:file-document-outline';
        }
    }

    getDocIconClass(type: string): string {
        switch (type) {
            case 'pdf':
                return 'text-red-500';
            case 'sheet':
                return 'text-emerald-600';
            case 'image':
                return 'text-purple-600';
            case 'doc':
            default:
                return 'text-blue-500';
        }
    }

    getLinkIcon(type: string): string {
        switch (type) {
            case 'figma':
                return 'mdi:palette';
            case 'github':
                return 'mdi:github';
            case 'doc':
                return 'mdi:file-document-edit-outline';
            default:
                return 'mdi:link-variant';
        }
    }

    getLinkTypeBadge(type: string): { label: string; bg: string; icon: string } {
        switch (type) {
            case 'figma':
                return {
                    label: 'Figma Spec',
                    bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
                    icon: 'mdi:palette',
                };
            case 'github':
                return {
                    label: 'GitHub PR / Repo',
                    bg: 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-200 border-slate-700',
                    icon: 'mdi:github',
                };
            case 'doc':
                return {
                    label: 'Documentation',
                    bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
                    icon: 'mdi:file-document-outline',
                };
            default:
                return {
                    label: 'External Link',
                    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
                    icon: 'mdi:link-variant',
                };
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

    updateTaskStatus(task: IndividualTaskItem, status: string): void {
        task.status = status;
        if (status === 'done') {
            task.progress = 100;
        }
        this.initGeneralCharts();
        this.saveProjectChanges();
    }

    getTaskCountByStatus(status: 'completed' | 'in_progress' | 'review' | 'new'): number {
        const proj = this.selectedProject();
        if (!proj || !proj.tasks || proj.tasks.length === 0) {
            if (status === 'completed') return 4;
            if (status === 'in_progress') return 2;
            if (status === 'review') return 1;
            if (status === 'new') return 1;
            return 0;
        }
        if (status === 'completed') {
            return proj.tasks.filter((t) => t.status === 'done' || t.status === 'confirmed').length;
        }
        if (status === 'in_progress') {
            return proj.tasks.filter((t) => t.status === 'in_progress').length;
        }
        if (status === 'review') {
            return proj.tasks.filter((t) => t.status === 'review').length;
        }
        if (status === 'new') {
            return proj.tasks.filter((t) => t.status === 'new' || t.status === 'unconfirmed' || t.status === 'reopened').length;
        }
        return 0;
    }

    initGeneralCharts(): void {
        this._generalCharts.forEach((c) => c.dispose());
        this._generalCharts = [];

        const proj = this.selectedProject();
        if (!proj) return;

        const completedCount = this.getTaskCountByStatus('completed');
        const inProgressCount = this.getTaskCountByStatus('in_progress');
        const reviewCount = this.getTaskCountByStatus('review');
        const newCount = this.getTaskCountByStatus('new');

        // 1. Task Distribution Donut Chart
        if (this.taskDistributionChartRef?.nativeElement) {
            const chart = echarts.init(this.taskDistributionChartRef.nativeElement);
            this._generalCharts.push(chart);

            const option: echarts.EChartsOption = {
                tooltip: {
                    trigger: 'item',
                    formatter: '{b}: {c} កិច្ចការ ({d}%)',
                    textStyle: {
                        fontFamily: 'Kantumruy Pro',
                        fontSize: 13,
                    },
                },
                legend: {
                    bottom: '0%',
                    left: 'center',
                    icon: 'circle',
                    itemWidth: 10,
                    itemHeight: 10,
                    textStyle: {
                        fontFamily: 'Kantumruy Pro',
                        fontSize: 13,
                        color: '#64748b',
                    },
                },
                series: [
                    {
                        name: 'ស្ថានភាពកិច្ចការ',
                        type: 'pie',
                        radius: ['52%', '78%'],
                        center: ['50%', '42%'],
                        avoidLabelOverlap: false,
                        itemStyle: {
                            borderRadius: 6,
                            borderColor: '#ffffff',
                            borderWidth: 2,
                        },
                        label: {
                            show: false,
                            position: 'center',
                        },
                        emphasis: {
                            label: {
                                show: true,
                                fontSize: 14,
                                fontWeight: 500,
                                fontFamily: 'Kantumruy Pro',
                                formatter: '{b}\n{c} ({d}%)',
                            },
                            scaleSize: 6,
                        },
                        labelLine: {
                            show: false,
                        },
                        data: [
                            { value: completedCount, name: 'បានបញ្ចប់', itemStyle: { color: '#10b981' } },
                            { value: inProgressCount, name: 'កំពុងធ្វើ', itemStyle: { color: '#3b82f6' } },
                            { value: reviewCount, name: 'រង់ចាំពិនិត្យ', itemStyle: { color: '#f59e0b' } },
                            { value: newCount, name: 'ថ្មី (To-Do)', itemStyle: { color: '#8b5cf6' } },
                        ],
                    },
                ],
            };
            chart.setOption(option);
        }

        // 2. Weekly Velocity & Progress Trend Area Chart
        if (this.taskTrendChartRef?.nativeElement) {
            const chart = echarts.init(this.taskTrendChartRef.nativeElement);
            this._generalCharts.push(chart);

            const option: echarts.EChartsOption = {
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross',
                        label: {
                            backgroundColor: '#6a7985',
                            fontFamily: 'Kantumruy Pro',
                        },
                    },
                    textStyle: {
                        fontFamily: 'Kantumruy Pro',
                        fontSize: 13,
                    },
                },
                legend: {
                    data: ['បានបញ្ចប់', 'គ្រោងទុក'],
                    top: '0%',
                    right: '4%',
                    icon: 'roundRect',
                    textStyle: {
                        fontFamily: 'Kantumruy Pro',
                        fontSize: 13,
                        color: '#64748b',
                    },
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    top: '15%',
                    containLabel: true,
                },
                xAxis: [
                    {
                        type: 'category',
                        boundaryGap: false,
                        data: ['W14', 'W15', 'W16', 'W17', 'W18', 'W19', 'W20', 'W21', 'W22'],
                        axisLine: { lineStyle: { color: '#cbd5e1' } },
                        axisLabel: {
                            color: '#64748b',
                            fontFamily: 'Kantumruy Pro',
                            fontSize: 12,
                        },
                    },
                ],
                yAxis: [
                    {
                        type: 'value',
                        splitLine: { lineStyle: { color: '#f1f5f9' } },
                        axisLabel: {
                            color: '#64748b',
                            fontFamily: 'Kantumruy Pro',
                            fontSize: 12,
                        },
                    },
                ],
                series: [
                    {
                        name: 'បានបញ្ចប់',
                        type: 'line',
                        smooth: true,
                        lineStyle: { width: 3, color: '#10b981' },
                        showSymbol: false,
                        areaStyle: {
                            opacity: 0.25,
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: '#10b981' },
                                { offset: 1, color: 'rgba(16, 185, 129, 0)' },
                            ]),
                        },
                        emphasis: { focus: 'series' },
                        data: [1, 2, 2, 4, 5, 5, 6, 7, 8],
                    },
                    {
                        name: 'គ្រោងទុក',
                        type: 'line',
                        smooth: true,
                        lineStyle: { width: 3, color: '#3b82f6', type: 'dashed' },
                        showSymbol: false,
                        areaStyle: {
                            opacity: 0.15,
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: '#3b82f6' },
                                { offset: 1, color: 'rgba(59, 130, 246, 0)' },
                            ]),
                        },
                        emphasis: { focus: 'series' },
                        data: [1, 2, 3, 4, 5, 6, 7, 8, 9],
                    },
                ],
            };
            chart.setOption(option);
        }

        if (!this._resizeListener) {
            this._resizeListener = () => {
                this._generalCharts.forEach((c) => c.resize());
            };
            window.addEventListener('resize', this._resizeListener);
        }
    }

    ngOnDestroy(): void {
        this._generalCharts.forEach((c) => c.dispose());
        if (this._resizeListener) {
            window.removeEventListener('resize', this._resizeListener);
        }
    }
}
