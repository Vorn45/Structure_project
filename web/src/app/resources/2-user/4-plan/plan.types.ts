import { ProjectPlanItem } from './plan.service';

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
    phone?: string;
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

export const BMS_PROJECT_LOGO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><defs><linearGradient id="bmsGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230284c7"/><stop offset="100%" stop-color="%230369a1"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="%230b1329"/><rect x="1.5" y="1.5" width="117" height="117" rx="27" fill="none" stroke="%231e293b" stroke-width="2"/><circle cx="60" cy="60" r="41" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="1.5"/><circle cx="60" cy="60" r="34" fill="url(%23bmsGrad)"/><line x1="39" y1="76" x2="81" y2="76" stroke="%2393c5fd" stroke-width="2.5" stroke-linecap="round"/><rect x="42" y="62" width="7" height="14" rx="2" fill="%23bae6fd"/><rect x="52" y="51" width="7" height="25" rx="2" fill="%23ffffff"/><rect x="62" y="57" width="7" height="19" rx="2" fill="%23bae6fd"/><rect x="72" y="44" width="7" height="32" rx="2" fill="%2338bdf8"/><path d="M 41 65 L 53 49 L 64 55 L 78 39" fill="none" stroke="%2338bdf8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="78" cy="39" r="4" fill="%23ffffff" stroke="%230284c7" stroke-width="2"/><circle cx="53" cy="49" r="2.5" fill="%23ffffff"/><circle cx="64" cy="55" r="2.5" fill="%23ffffff"/></svg>';

export const WMS_PROJECT_LOGO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="28" fill="%230b1329"/><rect x="1.5" y="1.5" width="117" height="117" rx="27" fill="none" stroke="%231e293b" stroke-width="2"/><circle cx="60" cy="60" r="41" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="1.5"/><g transform="translate(60, 60)"><path d="M 0 -25 L 23 -12 L 0 1 L -23 -12 Z" fill="%23fb923c" stroke="%23ea580c" stroke-width="1.5" stroke-linejoin="round"/><path d="M -23 -12 L 0 1 L 0 26 L -23 13 Z" fill="%230284c7" stroke="%230369a1" stroke-width="1.5" stroke-linejoin="round"/><path d="M 0 1 L 23 -12 L 23 13 L 0 26 Z" fill="%23ea580c" stroke="%23c2410c" stroke-width="1.5" stroke-linejoin="round"/><path d="M 0 1 L 0 26 M 0 1 L -23 -12 M 0 1 L 23 -12" stroke="%23ffffff" stroke-width="2.5" stroke-linecap="round"/><path d="M -11.5 -5.5 L 0 -12 L 11.5 -5.5 L 0 1 Z" fill="none" stroke="%23ffffff" stroke-width="1.5" stroke-opacity="0.7"/><path d="M -11.5 7 L -11.5 -5.5 M 11.5 7 L 11.5 -5.5" stroke="%23ffffff" stroke-width="1.5" stroke-opacity="0.7"/></g></svg>';

export const DEFAULT_PROJECT_LOGO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><defs><linearGradient id="defGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e293b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="%230b1329"/><rect x="1.5" y="1.5" width="117" height="117" rx="27" fill="none" stroke="%23334155" stroke-width="2"/><circle cx="60" cy="60" r="38" fill="url(%23defGrad)" stroke="%23475569" stroke-width="1.5"/><g transform="translate(36, 36) scale(3)"><path fill="%2394a3b8" d="M4 1a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V4a3 3 0 0 0-3-3zM2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2zm0 1h12v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/></g></svg>';

export function getProjectFallbackLogo(code?: string, name?: string): string {
    const cleanCode = (code || '').replace(/^#/, '').trim().toUpperCase();
    const cleanName = (name || '').trim().toUpperCase();
    if (cleanCode.includes('BMS') || cleanName.includes('BMS')) return BMS_PROJECT_LOGO;
    if (cleanCode.includes('WMS') || cleanName.includes('WMS')) return WMS_PROJECT_LOGO;

    // Use clean project code prefix (e.g. PRJ, PMS, HR, ACC) or project initials
    const rawPrefix = cleanCode ? cleanCode.split(/[-_]/)[0] : (cleanName ? cleanName.slice(0, 3) : '');
    const initials = rawPrefix.slice(0, 4);

    if (initials && initials.length >= 2 && !/^\d+$/.test(initials)) {
        return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><defs><linearGradient id="pGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e293b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="%230b1329"/><rect x="1.5" y="1.5" width="117" height="117" rx="27" fill="none" stroke="%23334155" stroke-width="2"/><circle cx="60" cy="60" r="38" fill="url(%23pGrad)" stroke="%233b82f6" stroke-width="1.5"/><text x="60" y="${initials.length > 3 ? '66' : '68'}" text-anchor="middle" fill="%2360a5fa" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="${initials.length > 3 ? 20 : 23}" letter-spacing="1">${initials}</text></svg>`;
    }
    return DEFAULT_PROJECT_LOGO;
}

export const DEFAULT_INVITED_PROJECTS: ExtendedProjectItem[] = [
    {
        id: '4',
        code: '0002',
        name: 'BMS Digitech',
        logo: BMS_PROJECT_LOGO,
        image: BMS_PROJECT_LOGO,
        description: 'Business Management System - Digitech Project Management, Sales & Invoicing Workflow.',
        status: 'active',
        priority: 'high',
        category: 'Development',
        budget_allocated: 65000,
        budget_spent: 28000,
        total_tasks: 0,
        completed_tasks: 0,
        progress: 0,
        start_date: new Date(Date.now() - 86400000 * 15).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 60).toISOString(),
        team_lead: { id: 101, name: 'PISETH PANHAVORN', role: 'Lead Developer', avatar: null },
        members: [
            { id: 101, name: 'PISETH PANHAVORN', role: 'Lead Developer', initial: 'P', bgClass: 'bg-indigo-600', email: 'pisethpanhavorn544@gmail.com', avatar: null },
            { id: 102, name: 'PUM BRUSMUNY', role: 'Developer', initial: 'P', bgClass: 'bg-emerald-600', email: 'pumprusmuny@example.com', avatar: null },
            { id: 103, name: 'THA WINNER', role: 'Developer', initial: 'T', bgClass: 'bg-amber-600', email: 'thawinner@example.com', avatar: null },
            { id: 104, name: 'PHUONG SOVANNARA', role: 'Developer', initial: 'P', bgClass: 'bg-purple-600', email: 'phuongsovannara@gmail.com', avatar: null },
        ],
        tasks: [],
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
        code: '0001',
        name: 'WMS Digitech',
        logo: WMS_PROJECT_LOGO,
        image: WMS_PROJECT_LOGO,
        description: 'Workforce & Attendance Management System - Digitech Real-time QR & Payroll.',
        status: 'active',
        priority: 'urgent',
        category: 'Workforce',
        budget_allocated: 80000,
        budget_spent: 56000,
        total_tasks: 0,
        completed_tasks: 0,
        progress: 0,
        start_date: new Date(Date.now() - 86400000 * 30).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 45).toISOString(),
        team_lead: { id: 101, name: 'PISETH PANHAVORN', role: 'Project Manager', avatar: null },
        members: [
            { id: 101, name: 'PISETH PANHAVORN', role: 'Project Manager', initial: 'P', bgClass: 'bg-indigo-600', email: 'pisethpanhavorn544@gmail.com', avatar: null },
            { id: 102, name: 'PUM BRUSMUNY', role: 'Developer', initial: 'P', bgClass: 'bg-emerald-600', email: 'pumprusmuny@example.com', avatar: null },
            { id: 103, name: 'THA WINNER', role: 'Developer', initial: 'T', bgClass: 'bg-amber-600', email: 'thawinner@example.com', avatar: null },
            { id: 104, name: 'PHUONG SOVANNARA', role: 'Developer', initial: 'P', bgClass: 'bg-rose-600', email: 'phuongsovannara@gmail.com', avatar: null },
        ],
        tasks: [],
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

