import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { AddPlanDialogComponent } from '../3-activity/add-plan-dialog.component';
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
    number: number;
    title: string;
    quarter: string;
    status: 'completed' | 'in_progress' | 'planned';
    progress: number;
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
    time_ago: string;
    comments_count: number;
    attachments_count: number;
    assignee: TaskMember;
    members: TaskMember[];
    progress: number;
    subtasks: ProjectSubtaskItem[];
    links: TaskLink[];
    documents: TaskDocument[];
}

export interface ExtendedProjectItem extends Omit<ProjectPlanItem, 'members'> {
    members: TaskMember[];
    tasks: IndividualTaskItem[];
    meetings?: ProjectMeetingItem[];
    activities?: ProjectActivityItem[];
    phases?: ProjectPhaseItem[];
    agileTasks?: AgilePlanTask[];
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
export class UserPlanComponent implements OnInit {
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
    ) {}

    // Search input inside selected project tasks
    taskSearchQuery = signal<string>('');

    // Filter for subtasks/tasks within selected project
    subtaskFilter = signal<string>('all');

    // Links search and filtering
    linkSearchQuery = signal<string>('');
    linkTypeFilter = signal<string>('all');
    copiedLinkId = signal<string | null>(null);

    // Active Task for full modal / side detail view (showing members, links, documents)
    activeTaskModal = signal<IndividualTaskItem | null>(null);

    // Active Tab in Task Detail Modal: 'subtasks' | 'members' | 'links' | 'documents'
    activeDetailTab = signal<'subtasks' | 'members' | 'links' | 'documents'>('subtasks');

    // New item inputs
    newSubtaskTitle = signal<string>('');
    newLinkTitle = signal<string>('');
    newLinkUrl = signal<string>('');
    showAddLinkForm = signal<boolean>(false);

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

    // All links flattened across all tasks for the selected project
    allProjectLinks = computed(() => {
        const proj = this.selectedProject();
        if (!proj || !proj.tasks) return [];
        const q = this.linkSearchQuery().toLowerCase().trim();
        const filter = this.linkTypeFilter();

        const list: {
            id: string;
            title: string;
            url: string;
            type: 'figma' | 'github' | 'doc' | 'external';
            taskCode: string;
            taskTitle: string;
            task: IndividualTaskItem;
        }[] = [];

        for (const t of proj.tasks) {
            if (t.links) {
                for (const l of t.links) {
                    list.push({
                        id: l.id,
                        title: l.title,
                        url: l.url,
                        type: l.type,
                        taskCode: t.code,
                        taskTitle: t.title,
                        task: t,
                    });
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
                if (!proj.agileTasks) {
                    proj.agileTasks = [...DEFAULT_AGILE_TASKS];
                }
                proj.agileTasks = [newTask, ...proj.agileTasks];
                this.savePlansToStorage();
            }
        });
    }

    deleteAgileTask(proj: ExtendedProjectItem, taskId: string, event: Event): void {
        event.stopPropagation();
        if (!proj.agileTasks) {
            proj.agileTasks = [...DEFAULT_AGILE_TASKS];
        }
        proj.agileTasks = proj.agileTasks.filter((t) => t.id !== taskId);
        this.savePlansToStorage();
    }

    private savePlansToStorage(): void {
        try {
            localStorage.setItem('wfm_user_plans', JSON.stringify(this.plans()));
        } catch (e) {
            console.error('Failed to save plans to localStorage', e);
        }
    }

    private loadPlansFromStorage(): boolean {
        try {
            const stored = localStorage.getItem('wfm_user_plans');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    this.plans.set(parsed);
                    return true;
                }
            }
        } catch (e) {
            console.error('Failed to load plans from localStorage', e);
        }
        return false;
    }

    ngOnInit(): void {
        this.loadPlans();
    }

    loadPlans(): void {
        this.loading.set(true);
        const hasLocal = this.loadPlansFromStorage();

        this._planService
            .getPlans({
                search: this.searchQuery() || undefined,
                status: this.statusFilter() !== 'all' ? this.statusFilter() : undefined,
            })
            .subscribe({
                next: (res) => {
                    if (!hasLocal) {
                        this.plans.set(DEFAULT_INVITED_PROJECTS);
                        this.savePlansToStorage();
                    } else if (res?.data?.results?.length) {
                        // Merge any new API projects that aren't in local storage yet
                        const current = this.plans();
                        const existingIds = new Set(current.map((p) => String(p.id)));
                        const additions: ExtendedProjectItem[] = res.data.results
                            .filter((ap) => !existingIds.has(String(ap.id)))
                            .map((ap) => ({
                                id: String(ap.id),
                                code: ap.code,
                                name: ap.name,
                                description: ap.description,
                                status: (ap.status as any) || 'active',
                                priority: 'high',
                                category: 'Development',
                                budget_allocated: 50000,
                                budget_spent: 20000,
                                total_tasks: ap.total_tasks || 0,
                                completed_tasks: ap.completed_tasks || 0,
                                progress: ap.progress || 0,
                                start_date: ap.start_date || new Date().toISOString(),
                                end_date: ap.end_date || new Date(Date.now() + 86400000 * 30).toISOString(),
                                team_lead: { id: 1, name: 'Project Lead', role: 'Leader' },
                                members: [],
                                tasks: [],
                                agileTasks: [...DEFAULT_AGILE_TASKS],
                            }));
                        if (additions.length > 0) {
                            this.plans.set([...current, ...additions]);
                            this.savePlansToStorage();
                        }
                    }
                    this.loading.set(false);
                },
                error: () => {
                    if (!hasLocal) {
                        this.plans.set(DEFAULT_INVITED_PROJECTS);
                    }
                    this.loading.set(false);
                },
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

    openTaskModal(task: IndividualTaskItem): void {
        this.activeTaskModal.set(task);
        this.activeDetailTab.set('subtasks');
        this.showAddLinkForm.set(false);
    }

    closeTaskModal(): void {
        this.activeTaskModal.set(null);
        this.showAddLinkForm.set(false);
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
    }

    removeLink(task: IndividualTaskItem, linkId: string): void {
        task.links = task.links.filter((l) => l.id !== linkId);
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
}
