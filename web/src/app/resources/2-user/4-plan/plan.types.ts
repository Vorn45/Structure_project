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
    assignee?: TaskMember | null;
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

export const DEFAULT_AGILE_TASKS: AgilePlanTask[] = [];

export const DEFAULT_PROJECT_LOGO = '/images/logo/logo.png';

export function getProjectFallbackLogo(code?: string, name?: string): string {
    const cleanCode = (code || '').replace(/^#/, '').trim().toUpperCase();
    const cleanName = (name || '').trim().toUpperCase();

    // Determine initials
    let initials = '';
    // If code has letters (e.g. BMS, WMS, PRJ, PMS-V2, HR):
    if (cleanCode && !/^\d+$/.test(cleanCode)) {
        initials = cleanCode.split(/[-_]/)[0].slice(0, 4);
    } else if (cleanName) {
        // If code is digits or empty, extract initials from name
        const words = cleanName.split(/[\s\-_]+/).filter(Boolean);
        if (words.length > 1) {
            initials = words.map((w) => w[0]).join('').slice(0, 4);
        } else if (words.length === 1) {
            initials = words[0].slice(0, 4);
        }
    }

    if (initials && initials.length >= 1 && !/^\d+$/.test(initials)) {
        // Color palette based on name/code hash
        const str = cleanName || cleanCode || 'PRJ';
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colors = [
            { from: '%230284c7', to: '%230369a1', stroke: '%2338bdf8', text: '%237dd3fc' }, // Sky/Blue
            { from: '%237c3aed', to: '%235b21b6', stroke: '%23a78bfa', text: '%23c4b5fd' }, // Violet
            { from: '%23059669', to: '%23047857', stroke: '%2334d399', text: '%236ee7b7' }, // Emerald
            { from: '%23ea580c', to: '%23c2410c', stroke: '%23fb923c', text: '%23fdba74' }, // Orange
            { from: '%23e11d48', to: '%23be123c', stroke: '%23fb7185', text: '%23fda4af' }, // Rose
            { from: '%234f46e5', to: '%233730a3', stroke: '%23818cf8', text: '%23a5b4fc' }, // Indigo
        ];
        const color = colors[Math.abs(hash) % colors.length];

        return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><defs><linearGradient id="pGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${color.from}"/><stop offset="100%" stop-color="${color.to}"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="%230b1329"/><rect x="1.5" y="1.5" width="117" height="117" rx="27" fill="none" stroke="%23334155" stroke-width="2"/><circle cx="60" cy="60" r="38" fill="url(%23pGrad)" stroke="${color.stroke}" stroke-width="1.5"/><text x="60" y="${initials.length > 3 ? '66' : '68'}" text-anchor="middle" fill="${color.text}" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="${initials.length > 3 ? 20 : 23}" letter-spacing="1">${initials}</text></svg>`;
    }

    return DEFAULT_PROJECT_LOGO;
}

export const DEFAULT_INVITED_PROJECTS: ExtendedProjectItem[] = [];

