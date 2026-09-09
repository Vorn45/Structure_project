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
import { CreateTaskDialogComponent } from 'app/resources/3-admin/3-projects/dialogs/create-task-dialog.component';
import { CreatePhaseDialogComponent } from 'app/resources/3-admin/3-projects/dialogs/create-phase-dialog.component';
import { CreateMemberDialogComponent } from 'app/resources/3-admin/3-projects/dialogs/create-member-dialog.component';
import { CreateLinkDialogComponent } from 'app/resources/3-admin/3-projects/dialogs/create-link-dialog.component';
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
        id: '4',
        code: 'BMS-DIGI',
        name: 'BMS Digitech',
        description: 'Business Management System - Digitech Project Management, Sales & Invoicing Workflow.',
        status: 'active',
        priority: 'high',
        category: 'Development',
        budget_allocated: 65000,
        budget_spent: 28000,
        total_tasks: 6,
        completed_tasks: 3,
        progress: 55,
        start_date: new Date(Date.now() - 86400000 * 15).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 60).toISOString(),
        team_lead: { id: 101, name: 'PISETH PANHAVORN', role: 'Lead Developer' },
        members: [
            { id: 101, name: 'PISETH PANHAVORN', role: 'Lead Developer', initial: 'P', bgClass: 'bg-indigo-600', email: 'pisethpanhavorn544@gmail.com' },
            { id: 102, name: 'PUM BRUSMUNY', role: 'Developer', initial: 'P', bgClass: 'bg-emerald-600', email: 'pumprusmuny@example.com' },
            { id: 103, name: 'THA WINNER', role: 'Developer', initial: 'T', bgClass: 'bg-amber-600', email: 'thawinner@example.com' },
        ],
        tasks: [
            {
                id: 'bms-t-1',
                code: '#BMS-101',
                title: 'BMS | Dashboard | Sales & Revenue Analytics Overview',
                description: 'រៀបចំផ្ទាំងគ្រប់គ្រងស្ថិតិលក់ ប្រាក់ចំណូល និងរបាយការណ៍ប្រចាំខែសម្រាប់ថ្នាក់ដឹកនាំ។',
                priority: 'high',
                status: 'done',
                due_date: '2026-09-12',
                created_at: '2026-08-25',
                time_ago: '5 ថ្ងៃមុន',
                comments_count: 3,
                attachments_count: 1,
                assignee: { id: 101, name: 'PISETH PANHAVORN', role: 'Lead Developer', initial: 'P', bgClass: 'bg-indigo-600' },
                members: [
                    { id: 101, name: 'PISETH PANHAVORN', role: 'Lead Developer', initial: 'P', bgClass: 'bg-indigo-600' },
                    { id: 102, name: 'PUM BRUSMUNY', role: 'Developer', initial: 'P', bgClass: 'bg-emerald-600' },
                ],
                progress: 100,
                subtasks: [
                    { id: 'bms-st-1', title: 'Design revenue card widgets with Tailwind', completed: true },
                    { id: 'bms-st-2', title: 'Connect analytics chart with ECharts backend API', completed: true },
                ],
                links: [
                    { id: 'bms-l-1', title: 'Figma: BMS Dashboard UI Specs', url: 'https://figma.com', type: 'figma' },
                ],
                documents: [
                    { id: 'bms-d-1', name: 'BMS_Dashboard_Specs.pdf', size: '1.8 MB', type: 'pdf', upload_date: '២៥ សីហា ២០២៦' },
                ],
            },
            {
                id: 'bms-t-2',
                code: '#BMS-102',
                title: 'BMS | Inventory | Stock In & Stock Out Tracking',
                description: 'ប្រព័ន្ធគ្រប់គ្រងទំនិញក្នុងស្តុក ការនាំចូល ការនាំចេញ និងការដាស់តឿននៅពេលទំនិញជិតអស់។',
                priority: 'high',
                status: 'in_progress',
                due_date: '2026-09-18',
                created_at: '2026-08-28',
                time_ago: '3 ថ្ងៃមុន',
                comments_count: 4,
                attachments_count: 2,
                assignee: { id: 102, name: 'PUM BRUSMUNY', role: 'Developer', initial: 'P', bgClass: 'bg-emerald-600' },
                members: [
                    { id: 102, name: 'PUM BRUSMUNY', role: 'Developer', initial: 'P', bgClass: 'bg-emerald-600' },
                    { id: 103, name: 'THA WINNER', role: 'Developer', initial: 'T', bgClass: 'bg-amber-600' },
                ],
                progress: 65,
                subtasks: [
                    { id: 'bms-st-3', title: 'Create PostgreSQL inventory schema & relations', completed: true },
                    { id: 'bms-st-4', title: 'Barcode scanner input support', completed: false },
                ],
                links: [
                    { id: 'bms-l-2', title: 'GitHub PR #502: Inventory Manager', url: 'https://github.com', type: 'github' },
                ],
                documents: [
                    { id: 'bms-d-2', name: 'Stock_Management_Flow.png', size: '920 KB', type: 'image', upload_date: '២៨ សីហា ២០២៦' },
                ],
            },
            {
                id: 'bms-t-3',
                code: '#BMS-103',
                title: 'BMS | Invoicing | Automated Tax & Receipt Generator',
                description: 'មុខងារចេញវិក្កយបត្រស្វ័យប្រវត្តិ គណនាពន្ធ និងទាញយកជា PDF។',
                priority: 'urgent',
                status: 'review',
                due_date: '2026-09-15',
                created_at: '2026-08-27',
                time_ago: '4 ថ្ងៃមុន',
                comments_count: 2,
                attachments_count: 1,
                assignee: { id: 103, name: 'THA WINNER', role: 'Developer', initial: 'T', bgClass: 'bg-amber-600' },
                members: [
                    { id: 103, name: 'THA WINNER', role: 'Developer', initial: 'T', bgClass: 'bg-amber-600' },
                    { id: 101, name: 'PISETH PANHAVORN', role: 'Lead Developer', initial: 'P', bgClass: 'bg-indigo-600' },
                ],
                progress: 85,
                subtasks: [
                    { id: 'bms-st-5', title: 'Generate PDF receipt template with QR verification', completed: true },
                    { id: 'bms-st-6', title: 'Review tax calculation logic for Cambodia VAT (10%)', completed: true },
                ],
                links: [
                    { id: 'bms-l-3', title: 'Tax Invoice Template Specs', url: 'https://notion.so', type: 'doc' },
                ],
                documents: [
                    { id: 'bms-d-3', name: 'Sample_Invoice_Receipt.pdf', size: '450 KB', type: 'pdf', upload_date: '២៧ សីហា ២០២៦' },
                ],
            },
            {
                id: 'bms-t-4',
                code: '#BMS-104',
                title: 'BMS | Customer Portal | Role Permissions & RBAC',
                description: 'កំណត់សិទ្ធិអតិថិជន និងបុគ្គលិកក្នុងការចូលមើលទិន្នន័យតាមតួនាទី។',
                priority: 'medium',
                status: 'unconfirmed',
                due_date: '2026-09-25',
                created_at: '2026-09-01',
                time_ago: 'ម្សិលមិញ',
                comments_count: 0,
                attachments_count: 0,
                assignee: { id: 101, name: 'Piseth Panhavorn', role: 'Lead Developer', initial: 'P', bgClass: 'bg-indigo-600' },
                members: [
                    { id: 101, name: 'Piseth Panhavorn', role: 'Lead Developer', initial: 'P', bgClass: 'bg-indigo-600' },
                ],
                progress: 20,
                subtasks: [
                    { id: 'bms-st-7', title: 'Implement RBAC middleware in NestJS', completed: false },
                ],
                links: [],
                documents: [],
            },
        ],
        phases: [
            {
                id: 'bms-ph-1',
                number: 1,
                title: 'ដំណាក់កាលទី ១៖ ការរៀបចំស្ថាបត្យកម្មទិន្នន័យ & Dashboard',
                quarter: 'ត្រីមាសទី ២ (Q2)',
                status: 'completed',
                progress: 100,
                startDate: '០១ សីហា ២០២៦',
                endDate: '២៥ សីហា ២០២៦',
                tasksCount: 4,
            },
            {
                id: 'bms-ph-2',
                number: 2,
                title: 'ដំណាក់កាលទី ២៖ ម៉ូឌុល Inventory & ប្រព័ន្ធចេញវិក្កយបត្រ',
                quarter: 'ត្រីមាសទី ៣ (Q3)',
                status: 'in_progress',
                progress: 70,
                startDate: '២៦ សីហា ២០២៦',
                endDate: '២០ កញ្ញា ២០២៦',
                tasksCount: 6,
            },
            {
                id: 'bms-ph-3',
                number: 3,
                title: 'ដំណាក់កាលទី ៣៖ ការតេស្តសមាហរណកម្ម & ដាក់ឱ្យប្រើប្រាស់',
                quarter: 'ត្រីមាសទី ៤ (Q4)',
                status: 'planned',
                progress: 0,
                startDate: '២១ កញ្ញា ២០២៦',
                endDate: '៣០ តុលា ២០២៦',
                tasksCount: 3,
            },
        ],
        meetings: [
            {
                id: 'bms-m-1',
                title: 'BMS Weekly Sprint Sync & Inventory Flow Review',
                description: 'ពិនិត្យមើលវឌ្ឍនភាពការងារប្រចាំសប្តាហ៍នៃគម្រោង BMS Digitech។',
                date: 'ថ្ងៃនេះ (Today)',
                time: 'ម៉ោង ០៣:០០ រសៀល',
                platform: 'Google Meet',
                link: 'https://meet.google.com/bms-sync-2026',
                status: 'upcoming',
                attendees: [
                    { id: 101, name: 'Piseth Panhavorn', role: 'Lead Developer', initial: 'P', bgClass: 'bg-indigo-600' },
                    { id: 102, name: 'Pum Prusmuny', role: 'Developer', initial: 'P', bgClass: 'bg-emerald-600' },
                    { id: 103, name: 'Tha Winner', role: 'Developer', initial: 'T', bgClass: 'bg-amber-600' },
                ],
            },
        ],
        agileTasks: [...DEFAULT_AGILE_TASKS],
        links: [
            { id: 'bms-pl-1', title: 'Figma Design: BMS System', url: 'https://figma.com', type: 'figma' },
            { id: 'bms-pl-2', title: 'GitHub Repository: BMS Digitech', url: 'https://github.com', type: 'github' },
        ],
    },
    {
        id: '5',
        code: 'WMS-DIGI',
        name: 'WMS Digitech',
        description: 'Workforce & Attendance Management System - Digitech Real-time QR & Payroll.',
        status: 'active',
        priority: 'urgent',
        category: 'Workforce',
        budget_allocated: 80000,
        budget_spent: 56000,
        total_tasks: 6,
        completed_tasks: 4,
        progress: 75,
        start_date: new Date(Date.now() - 86400000 * 30).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 45).toISOString(),
        team_lead: { id: 101, name: 'PISETH PANHAVORN', role: 'Project Manager' },
        members: [
            { id: 101, name: 'PISETH PANHAVORN', role: 'Project Manager', initial: 'P', bgClass: 'bg-indigo-600', email: 'pisethpanhavorn544@gmail.com' },
            { id: 102, name: 'PUM BRUSMUNY', role: 'Developer', initial: 'P', bgClass: 'bg-emerald-600', email: 'pumprusmuny@example.com' },
            { id: 103, name: 'THA WINNER', role: 'Developer', initial: 'T', bgClass: 'bg-amber-600', email: 'thawinner@example.com' },
        ],
        tasks: [
            {
                id: 'wms-t-1',
                code: '#WMS-201',
                title: 'WMS | Attendance | Real-time QR Code Check-in System',
                description: 'ប្រព័ន្ធស្កេន QR Code កត់ត្រាវត្តមានចូល-ចេញភ្លាមៗតាមទូរស័ព្ទដៃ។',
                priority: 'urgent',
                status: 'done',
                due_date: '2026-09-05',
                created_at: '2026-08-15',
                time_ago: '1 សប្តាហ៍មុន',
                comments_count: 5,
                attachments_count: 2,
                assignee: { id: 101, name: 'PISETH PANHAVORN', role: 'Project Manager', initial: 'P', bgClass: 'bg-indigo-600' },
                members: [
                    { id: 101, name: 'PISETH PANHAVORN', role: 'Project Manager', initial: 'P', bgClass: 'bg-indigo-600' },
                    { id: 102, name: 'PUM BRUSMUNY', role: 'Developer', initial: 'P', bgClass: 'bg-emerald-600' },
                ],
                progress: 100,
                subtasks: [
                    { id: 'wms-st-1', title: 'Generate dynamic HMAC hashed QR code', completed: true },
                    { id: 'wms-st-2', title: 'Camera QR scanner integration in Angular', completed: true },
                ],
                links: [
                    { id: 'wms-l-1', title: 'QR Attendance Technical Doc', url: 'https://notion.so', type: 'doc' },
                ],
                documents: [
                    { id: 'wms-d-1', name: 'QR_Attendance_Architecture.pdf', size: '2.1 MB', type: 'pdf', upload_date: '១៨ សីហា ២០២៦' },
                ],
            },
            {
                id: 'wms-t-2',
                code: '#WMS-202',
                title: 'WMS | Leave Request | Multi-level Approval Workflow',
                description: 'មុខងារស្នើសុំច្បាប់ឈប់សម្រាក និងការអនុម័តដោយប្រធានផ្នែក។',
                priority: 'high',
                status: 'in_progress',
                due_date: '2026-09-14',
                created_at: '2026-08-20',
                time_ago: '5 ថ្ងៃមុន',
                comments_count: 3,
                attachments_count: 1,
                assignee: { id: 102, name: 'PUM BRUSMUNY', role: 'Developer', initial: 'P', bgClass: 'bg-emerald-600' },
                members: [
                    { id: 102, name: 'PUM BRUSMUNY', role: 'Developer', initial: 'P', bgClass: 'bg-emerald-600' },
                    { id: 103, name: 'THA WINNER', role: 'Developer', initial: 'T', bgClass: 'bg-amber-600' },
                ],
                progress: 70,
                subtasks: [
                    { id: 'wms-st-3', title: 'Build Leave request form with date picker', completed: true },
                    { id: 'wms-st-4', title: 'Email & Telegram alert upon submission', completed: true },
                ],
                links: [],
                documents: [],
            },
            {
                id: 'wms-t-3',
                code: '#WMS-203',
                title: 'WMS | Payroll | Overtime & Salary Deductions Engine',
                description: 'ម៉ាស៊ីនគណនាប្រាក់បៀវត្ស ម៉ោងបន្ថែម (OT) និងការកាត់កងវត្តមានអវត្តមាន។',
                priority: 'high',
                status: 'review',
                due_date: '2026-09-16',
                created_at: '2026-08-26',
                time_ago: '4 ថ្ងៃមុន',
                comments_count: 2,
                attachments_count: 1,
                assignee: { id: 103, name: 'THA WINNER', role: 'Developer', initial: 'T', bgClass: 'bg-amber-600' },
                members: [
                    { id: 103, name: 'THA WINNER', role: 'Developer', initial: 'T', bgClass: 'bg-amber-600' },
                    { id: 101, name: 'PISETH PANHAVORN', role: 'Project Manager', initial: 'P', bgClass: 'bg-indigo-600' },
                ],
                progress: 85,
                subtasks: [
                    { id: 'wms-st-5', title: 'OT formula calculations (1.5x / 2.0x)', completed: true },
                    { id: 'wms-st-6', title: 'Export monthly payroll to Excel format', completed: false },
                ],
                links: [],
                documents: [],
            },
            {
                id: 'wms-t-4',
                code: '#WMS-204',
                title: 'WMS | Telegram Bot | Real-time Notification Alerts',
                description: 'ការបញ្ជូនសារដំណឹងភ្លាមៗទៅ Telegram Group នៅពេលបុគ្គលិក Check-in ឬ ស្នើសុំច្បាប់។',
                priority: 'medium',
                status: 'done',
                due_date: '2026-09-08',
                created_at: '2026-08-22',
                time_ago: '1 សប្តាហ៍មុន',
                comments_count: 1,
                attachments_count: 0,
                assignee: { id: 101, name: 'Piseth Panhavorn', role: 'Project Manager', initial: 'P', bgClass: 'bg-indigo-600' },
                members: [
                    { id: 101, name: 'Piseth Panhavorn', role: 'Project Manager', initial: 'P', bgClass: 'bg-indigo-600' },
                ],
                progress: 100,
                subtasks: [
                    { id: 'wms-st-7', title: 'Telegram Webhook setup in NestJS', completed: true },
                ],
                links: [],
                documents: [],
            },
        ],
        phases: [
            {
                id: 'wms-ph-1',
                number: 1,
                title: 'ដំណាក់កាលទី ១៖ ប្រព័ន្ធកត់ត្រាវត្តមានតាម QR Code',
                quarter: 'ត្រីមាសទី ២ (Q2)',
                status: 'completed',
                progress: 100,
                startDate: '០១ សីហា ២០២៦',
                endDate: '២០ សីហា ២០២៦',
                tasksCount: 4,
            },
            {
                id: 'wms-ph-2',
                number: 2,
                title: 'ដំណាក់កាលទី ២៖ ម៉ូឌុលច្បាប់ឈប់សម្រាក & ការបើកប្រាក់បៀវត្ស',
                quarter: 'ត្រីមាសទី ៣ (Q3)',
                status: 'in_progress',
                progress: 80,
                startDate: '២១ សីហា ២០២៦',
                endDate: '១៥ កញ្ញា ២០២៦',
                tasksCount: 5,
            },
            {
                id: 'wms-ph-3',
                number: 3,
                title: 'ដំណាក់កាលទី ៣៖ Telegram Bot Automation & Security Hardening',
                quarter: 'ត្រីមាសទី ៤ (Q4)',
                status: 'planned',
                progress: 0,
                startDate: '១៦ កញ្ញា ២០២៦',
                endDate: '២០ តុលា ២០២៦',
                tasksCount: 3,
            },
        ],
        meetings: [
            {
                id: 'wms-m-1',
                title: 'WMS Attendance Deployment & Telegram Bot Sync',
                description: 'កិច្ចប្រជុំត្រួតពិនិត្យការដាក់ឱ្យដំណើរការប្រព័ន្ធវត្តមាន WMS Digitech។',
                date: 'ថ្ងៃស្អែក (Tomorrow)',
                time: 'ម៉ោង ០២:០០ រសៀល',
                platform: 'Google Meet',
                link: 'https://meet.google.com/wms-sync-2026',
                status: 'upcoming',
                attendees: [
                    { id: 101, name: 'Piseth Panhavorn', role: 'Project Manager', initial: 'P', bgClass: 'bg-indigo-600' },
                    { id: 102, name: 'Pum Prusmuny', role: 'Developer', initial: 'P', bgClass: 'bg-emerald-600' },
                    { id: 103, name: 'Tha Winner', role: 'Developer', initial: 'T', bgClass: 'bg-amber-600' },
                ],
            },
        ],
        agileTasks: [...DEFAULT_AGILE_TASKS],
        links: [
            { id: 'wms-pl-1', title: 'Figma Design: WMS Mobile & Web', url: 'https://figma.com', type: 'figma' },
        ],
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
                    const projCode = created.code || `WFM-${Math.floor(100 + Math.random() * 900)}`;
                    const projName = created.name || result.name || 'គម្រោងថ្មី';
                    const projMembers = (result.assignees || []).map((a: any, idx: number) => ({
                        id: Number(a.id) || idx + 1,
                        name: a.name,
                        role: a.role || 'Member',
                        initial: a.name ? a.name.charAt(0) : 'M',
                        bgClass: 'bg-blue-600',
                    }));

                    const starterTasks: IndividualTaskItem[] = [
                        {
                            id: `task-${Date.now()}-1`,
                            code: `#${projCode}-001`,
                            title: `${projName} | ការរៀបចំស្ថាបត្យកម្ម & ផែនការអនុវត្ត`,
                            description: `រៀបចំផែនការអនុវត្តគម្រោង ${projName} បែងចែកភារកិច្ច និងកំណត់កាលវិភាគ Sprint។`,
                            priority: 'high',
                            status: 'in_progress',
                            due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
                            created_at: new Date().toISOString().split('T')[0],
                            time_ago: 'ទើបបង្កើត',
                            comments_count: 0,
                            attachments_count: 0,
                            assignee: projMembers[0] || { id: 1, name: 'Project Lead', role: 'Leader' },
                            members: projMembers.length ? projMembers : [{ id: 1, name: 'Project Lead', role: 'Leader', initial: 'L', bgClass: 'bg-blue-600' }],
                            progress: 50,
                            subtasks: [
                                { id: `st-${Date.now()}-1`, title: 'កំណត់គោលដៅ និងតម្រូវការប្រព័ន្ធ (SRS)', completed: true },
                                { id: `st-${Date.now()}-2`, title: 'បែងចែកការងារជូនសមាជិកក្រុម', completed: false },
                            ],
                            links: [],
                            documents: [],
                        },
                        {
                            id: `task-${Date.now()}-2`,
                            code: `#${projCode}-002`,
                            title: `${projName} | ការរចនា UI/UX & Prototypes`,
                            description: `រចនាទម្រង់ផ្ទៃមុខងារប្រព័ន្ធ (UI Components) ក្នុង Figma សម្រាប់គម្រោង ${projName}។`,
                            priority: 'medium',
                            status: 'new',
                            due_date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
                            created_at: new Date().toISOString().split('T')[0],
                            time_ago: 'ទើបបង្កើត',
                            comments_count: 0,
                            attachments_count: 0,
                            assignee: projMembers[1] || projMembers[0] || { id: 1, name: 'Developer', role: 'Member' },
                            members: projMembers.length ? projMembers : [{ id: 1, name: 'Developer', role: 'Member', initial: 'D', bgClass: 'bg-indigo-600' }],
                            progress: 0,
                            subtasks: [
                                { id: `st-${Date.now()}-3`, title: 'Design Layout & Mobile responsive mockups', completed: false },
                            ],
                            links: [],
                            documents: [],
                        },
                    ];

                    const starterPhases: ProjectPhaseItem[] = [
                        {
                            id: `ph-${Date.now()}-1`,
                            number: 1,
                            title: 'ដំណាក់កាលទី ១៖ ការរៀបចំ និងរចនាប្លង់ប្រព័ន្ធ (Design & Planning)',
                            quarter: 'ត្រីមាសទី ២ (Q2)',
                            status: 'in_progress',
                            progress: 50,
                            startDate: new Date().toISOString().split('T')[0],
                            endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
                            tasksCount: 2,
                        },
                        {
                            id: `ph-${Date.now()}-2`,
                            number: 2,
                            title: 'ដំណាក់កាលទី ២៖ ការអភិវឌ្ឍមុខងារស្នូល (Core Development)',
                            quarter: 'ត្រីមាសទី ៣ (Q3)',
                            status: 'planned',
                            progress: 0,
                            startDate: new Date(Date.now() + 86400000 * 31).toISOString().split('T')[0],
                            endDate: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0],
                            tasksCount: 0,
                        },
                    ];

                    const starterMeetings: ProjectMeetingItem[] = [
                        {
                            id: `m-${Date.now()}-1`,
                            title: `${projName} Kickoff & Sprint Planning Sync`,
                            description: `កិច្ចប្រជុំបើកដំណើរការគម្រោង ${projName} និងតម្រង់ទិសក្រុមការងារ។`,
                            date: 'ថ្ងៃស្អែក (Tomorrow)',
                            time: 'ម៉ោង ១០:០០ ព្រឹក - ១១:០០ ព្រឹក',
                            platform: 'Google Meet',
                            link: 'https://meet.google.com/new-project-sync',
                            status: 'upcoming',
                            attendees: projMembers.length ? projMembers : [{ id: 1, name: 'Project Lead', role: 'Leader' }],
                        },
                    ];

                    const newProj: ExtendedProjectItem = {
                        id: String(created.id || `proj-${Date.now()}`),
                        code: projCode,
                        name: projName,
                        description: created.description || '',
                        status: created.status || result.status || 'active',
                        priority: 'high',
                        category: 'Development',
                        budget_allocated: 50000,
                        budget_spent: 0,
                        total_tasks: starterTasks.length,
                        completed_tasks: 0,
                        progress: 25,
                        start_date: created.start_date || new Date().toISOString(),
                        end_date: created.end_date || new Date(Date.now() + 86400000 * 30).toISOString(),
                        team_lead: { id: 1, name: result.reporter || 'Project Lead', role: 'Leader' },
                        members: projMembers,
                        tasks: starterTasks,
                        phases: starterPhases,
                        meetings: starterMeetings,
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

    // Overview tab task search and filter signals
    overviewTaskSearchQuery = signal<string>('');
    overviewTaskStatusFilter = signal<string>('all');

    // Filter for subtasks/tasks within selected project
    subtaskFilter = signal<string>('all');

    // Links search and filtering
    linkSearchQuery = signal<string>('');
    linkTypeFilter = signal<string>('all');
    copiedLinkId = signal<string | null>(null);

    // Filtered overview tasks for currently selected project in General Overview tab
    filteredOverviewTasks = computed(() => {
        const proj = this.selectedProject();
        if (!proj || !proj.tasks) return [];
        let list = proj.tasks;

        const q = this.overviewTaskSearchQuery().toLowerCase().trim();
        if (q) {
            list = list.filter(
                (t) =>
                    t.title.toLowerCase().includes(q) ||
                    t.code.toLowerCase().includes(q) ||
                    t.description.toLowerCase().includes(q) ||
                    (t.assignee && t.assignee.name.toLowerCase().includes(q)),
            );
        }

        const filter = this.overviewTaskStatusFilter();
        if (filter !== 'all') {
            if (filter === 'done') {
                list = list.filter((t) => t.status === 'done' || t.status === 'completed');
            } else if (filter === 'in_progress') {
                list = list.filter((t) => t.status === 'in_progress');
            } else if (filter === 'review') {
                list = list.filter((t) => t.status === 'review' || t.status === 'in_review');
            } else if (filter === 'new') {
                list = list.filter((t) => t.status === 'new' || t.status === 'unconfirmed' || t.status === 'todo');
            } else {
                list = list.filter((t) => t.status === filter);
            }
        }
        return list;
    });

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
                        taskCode: `#${proj.code || 'WFM'}-001`,
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
                                taskCode: t.code || `#${proj.code || 'WFM'}-001`,
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
                    sender_name: 'ពុំ ប្រុសមុន្នី',
                    sender_initial: 'PB',
                    sender_bg: 'bg-blue-600',
                    text: 'បានទទួលហើយបង! ខ្ញុំកំពុងត្រៀមអនុវត្ត និងធ្វើតេស្តតាមដំណាក់កាល។',
                    time: '៥ នាទីមុន',
                    is_self: false,
                    is_system: false,
                },
            ];

            if (task.code === '#PMS-513' || task.code === '#BMS-0003') {
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
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            currentPhasesCount: proj?.phases?.length || 0,
            projectName: proj?.name,
        });
        const dialogRef = this._matDialog.open(CreatePhaseDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.title && proj) {
                if (!proj.phases) proj.phases = [];
                const newPhase: ProjectPhaseItem = {
                    id: `ph-${Date.now()}`,
                    title: result.title,
                    quarter: result.quarter || 'ត្រីមាស',
                    startDate: result.startDate || '01/10/2026',
                    endDate: result.endDate || '31/12/2026',
                    tasksCount: 0,
                    status: result.status || 'planned',
                };
                proj.phases.push(newPhase);
                this.saveProjectChanges(proj);
            }
        });
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

    deleteMeeting(meetingId: string, event: Event): void {
        event.stopPropagation();
        const proj = this.selectedProject();
        if (!proj || !proj.meetings) return;
        proj.meetings = proj.meetings.filter((m) => m.id !== meetingId);
        this.saveProjectChanges(proj);
    }

    openCreateMemberModal(): void {
        const proj = this.selectedProject();
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            projectName: proj?.name,
        });
        const dialogRef = this._matDialog.open(CreateMemberDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.name && proj) {
                if (!proj.members) proj.members = [];
                const newM: TaskMember = {
                    id: Date.now(),
                    name: result.name,
                    role: result.role || 'Developer',
                    email: result.email || undefined,
                    initial: result.name.charAt(0).toUpperCase(),
                    bgClass: 'bg-indigo-600',
                };
                proj.members.push(newM);
                this.saveProjectChanges(proj);
            }
        });
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
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            taskCode: proj ? `#${proj.code}-001` : '#WMS-001',
            projectName: proj?.name,
        });
        const dialogRef = this._matDialog.open(CreateLinkDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.title && proj) {
                if (!proj.links) proj.links = [];
                const newLink: TaskLink = {
                    id: `lnk-${Date.now()}`,
                    title: result.title,
                    url: result.url,
                    type: result.type || 'figma',
                    createdAt: 'ថ្ងៃនេះ',
                };
                proj.links.unshift(newLink);
                if (proj.tasks && proj.tasks.length > 0) {
                    const task = proj.tasks[0];
                    if (!task.links) task.links = [];
                    task.links.unshift(newLink);
                }
                this.saveProjectChanges(proj);
            }
        });
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
        const proj = this.selectedProject();
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            projectCode: proj?.code,
            projectName: proj?.name,
            members: proj?.members || [],
            existingTasks: proj?.tasks || [],
        });
        const dialogRef = this._matDialog.open(CreateTaskDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.title && proj) {
                if (!proj.tasks) proj.tasks = [];
                const codeFormatted = result.code ? (result.code.startsWith('#') ? result.code : `#${result.code}`) : `#${proj.code || 'BMS'}-${String(proj.tasks.length).padStart(4, '0')}`;
                
                const selectedMembers: TaskMember[] = result.assignees && result.assignees.length > 0
                    ? result.assignees.map((a: any, idx: number) => ({
                        id: Number(a.id) || idx + 1,
                        name: a.name,
                        role: a.role || 'Assignee',
                        initial: (a.name || 'M').charAt(0).toUpperCase(),
                        bgClass: 'bg-indigo-600',
                        avatar: a.avatar || null,
                    }))
                    : (result.assignee?.name ? [{
                        id: Number(result.assignee.id) || 1,
                        name: result.assignee.name,
                        role: result.assignee.role || 'Assignee',
                        initial: (result.assignee.name || 'M').charAt(0).toUpperCase(),
                        bgClass: 'bg-indigo-600',
                        avatar: result.assignee.avatar || null,
                    }] : []);

                const primaryAssignee: TaskMember | null = selectedMembers.length > 0 ? selectedMembers[0] : null;

                const reporterName = typeof result.reporter === 'string'
                    ? result.reporter
                    : (result.reporter?.name || result.reporterName || '');

                const newTask: IndividualTaskItem = {
                    id: `tsk-${Date.now()}`,
                    code: codeFormatted,
                    title: result.title,
                    description: result.description || result.title,
                    status: result.status || 'new',
                    priority: result.priority || 'medium',
                    due_date: result.due_date || '15/09/2026',
                    due_days_left: 7,
                    comments_count: 0,
                    attachments_count: 0,
                    reporter: {
                        id: 1,
                        name: reporterName,
                        role: result.reporter?.role || 'Super Admin',
                        initial: reporterName.charAt(0).toUpperCase(),
                        bgClass: 'bg-blue-600',
                    },
                    assignee: primaryAssignee,
                    subtasks: [
                        { id: 'st-1', title: 'រៀបចំលក្ខខណ្ឌតម្រូវការដំបូង', completed: false },
                    ],
                    members: selectedMembers,
                    links: [],
                    documents: [],
                };
                proj.tasks.unshift(newTask);
                this.saveProjectChanges(proj);
            }
        });
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
