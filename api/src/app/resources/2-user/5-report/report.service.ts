// ===========================================================================>> Core Library
import { Injectable } from '@nestjs/common';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { QueryReportDto, ReportPeriodEnum } from './report.dto';

export interface ReportProjectItem {
    id: string;
    code: string;
    name: string;
}

export interface PeriodMetrics {
    velocity: number;
    completedTasks: number;
    activeTasks: number;
    pendingTasks: number;
    velocityNote: string;
    completedNote: string;
    activeNote: string;
    pendingNote: string;
    columnCategories: string[];
    columnData: number[];
    columnLabel: string;
    polarData: number[];
    teamCompleted: number[];
    teamActive: number[];
}

const REPORT_PROJECTS: ReportProjectItem[] = [
    { id: '1', code: 'PMS-V2', name: 'ប្រព័ន្ធគ្រប់គ្រងគម្រោងបច្ចេកវិទ្យា (PMS)' },
    { id: '2', code: 'WMS-HR', name: 'ប្រព័ន្ធគ្រប់គ្រងវត្តមាន និងបុគ្គលិក (WMS)' },
    { id: '3', code: 'E-GOV', name: 'ប្រព័ន្ធច្រកចេញចូលតែមួយ (E-Gov Portal)' },
];

const PERIOD_METRICS_DATA: Record<string, Record<ReportPeriodEnum, PeriodMetrics>> = {
    '1': {
        [ReportPeriodEnum.WEEK]: {
            velocity: 85,
            completedTasks: 4,
            activeTasks: 3,
            pendingTasks: 1,
            velocityNote: 'ដំណើរការលឿនតាម Sprint',
            completedNote: 'ក្នុងសប្តាហ៍នេះ',
            activeNote: 'ស្ថិតក្នុង Sprint 36',
            pendingNote: 'ត្រៀមធ្វើ Code Review',
            columnLabel: 'កិច្ចការសម្រេចតាមថ្ងៃនៃសប្តាហ៍នេះ',
            columnCategories: ['ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'],
            columnData: [1, 2, 0, 1, 0, 0],
            polarData: [4, 3, 1, 2],
            teamCompleted: [3, 2, 1, 4],
            teamActive: [1, 2, 0, 1],
        },
        [ReportPeriodEnum.MONTH]: {
            velocity: 78,
            completedTasks: 18,
            activeTasks: 7,
            pendingTasks: 3,
            velocityNote: 'ស្ថេរភាពល្អក្នុងខែនេះ',
            completedNote: 'ក្នុងខែនេះសរុប',
            activeNote: 'Sprint 34-36',
            pendingNote: 'កំពុងរង់ចាំ Deploy',
            columnLabel: 'កិច្ចការសម្រេចតាមសប្តាហ៍នៃខែនេះ',
            columnCategories: ['សប្តាហ៍ទី១', 'សប្តាហ៍ទី២', 'សប្តាហ៍ទី៣', 'សប្តាហ៍ទី៤'],
            columnData: [5, 4, 6, 3],
            polarData: [18, 7, 3, 5],
            teamCompleted: [12, 10, 8, 14],
            teamActive: [3, 2, 1, 4],
        },
        [ReportPeriodEnum.QUARTER]: {
            velocity: 92,
            completedTasks: 54,
            activeTasks: 12,
            pendingTasks: 5,
            velocityNote: 'លើសគោលដៅត្រីមាស Q1',
            completedNote: 'ត្រីមាស Q1 ឆ្នាំ២០២៦',
            activeNote: 'Sprint 28-36',
            pendingNote: 'ស្ថិតក្នុងផែនការ Q2',
            columnLabel: 'កិច្ចការសម្រេចតាមខែនីមួយៗក្នុងត្រីមាស',
            columnCategories: ['មករា', 'កុម្ភៈ', 'មីនា'],
            columnData: [16, 20, 18],
            polarData: [54, 12, 5, 8],
            teamCompleted: [35, 28, 22, 40],
            teamActive: [5, 4, 2, 6],
        },
    },
    '2': {
        [ReportPeriodEnum.WEEK]: {
            velocity: 72,
            completedTasks: 2,
            activeTasks: 4,
            pendingTasks: 2,
            velocityNote: 'វឌ្ឍនភាពធម្មតា',
            completedNote: 'ក្នុងសប្តាហ៍នេះ',
            activeNote: 'សាកល្បងម៉ូឌុលស្កេនម្រាមដៃ',
            pendingNote: 'រង់ចាំ Device API',
            columnLabel: 'កិច្ចការសម្រេចតាមថ្ងៃ',
            columnCategories: ['ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'],
            columnData: [0, 1, 0, 1, 0, 0],
            polarData: [2, 4, 2, 1],
            teamCompleted: [2, 1, 1, 2],
            teamActive: [2, 1, 1, 2],
        },
        [ReportPeriodEnum.MONTH]: {
            velocity: 80,
            completedTasks: 12,
            activeTasks: 5,
            pendingTasks: 2,
            velocityNote: 'ស្របតាមផែនការប្រចាំខែ',
            completedNote: 'ក្នុងខែនេះសរុប',
            activeNote: 'HR Core Modules',
            pendingNote: 'តេស្ត UAT',
            columnLabel: 'កិច្ចការសម្រេចតាមសប្តាហ៍',
            columnCategories: ['សប្តាហ៍ទី១', 'សប្តាហ៍ទី២', 'សប្តាហ៍ទី៣', 'សប្តាហ៍ទី៤'],
            columnData: [3, 4, 3, 2],
            polarData: [12, 5, 2, 3],
            teamCompleted: [8, 6, 5, 9],
            teamActive: [2, 1, 1, 2],
        },
        [ReportPeriodEnum.QUARTER]: {
            velocity: 86,
            completedTasks: 38,
            activeTasks: 9,
            pendingTasks: 4,
            velocityNote: 'សម្រេចបាន ៨៦% នៃផែនការ',
            completedNote: 'ត្រីមាស Q1',
            activeNote: 'Rollout ដំណាក់កាលទី១',
            pendingNote: 'ត្រៀមសម្រាប់ Q2',
            columnLabel: 'កិច្ចការសម្រេចប្រចាំខែ',
            columnCategories: ['មករា', 'កុម្ភៈ', 'មីនា'],
            columnData: [11, 14, 13],
            polarData: [38, 9, 4, 6],
            teamCompleted: [22, 18, 16, 26],
            teamActive: [4, 3, 2, 4],
        },
    },
    '3': {
        [ReportPeriodEnum.WEEK]: {
            velocity: 90,
            completedTasks: 5,
            activeTasks: 2,
            pendingTasks: 1,
            velocityNote: 'ល្បឿនលឿនល្អបំផុត',
            completedNote: 'ក្នុងសប្តាហ៍នេះ',
            activeNote: 'E-Payment Gateway',
            pendingNote: 'រង់ចាំ Approval ធនាគារ',
            columnLabel: 'កិច្ចការសម្រេចតាមថ្ងៃ',
            columnCategories: ['ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'],
            columnData: [2, 1, 1, 1, 0, 0],
            polarData: [5, 2, 1, 1],
            teamCompleted: [4, 3, 2, 5],
            teamActive: [1, 1, 0, 1],
        },
        [ReportPeriodEnum.MONTH]: {
            velocity: 88,
            completedTasks: 22,
            activeTasks: 6,
            pendingTasks: 2,
            velocityNote: 'លទ្ធផលឆ្នើមប្រចាំខែ',
            completedNote: 'ក្នុងខែនេះសរុប',
            activeNote: 'Portal Service API',
            pendingNote: 'ត្រៀម Pilot Launch',
            columnLabel: 'កិច្ចការសម្រេចតាមសប្តាហ៍',
            columnCategories: ['សប្តាហ៍ទី១', 'សប្តាហ៍ទី២', 'សប្តាហ៍ទី៣', 'សប្តាហ៍ទី៤'],
            columnData: [6, 5, 7, 4],
            polarData: [22, 6, 2, 4],
            teamCompleted: [15, 12, 10, 18],
            teamActive: [3, 2, 1, 3],
        },
        [ReportPeriodEnum.QUARTER]: {
            velocity: 95,
            completedTasks: 62,
            activeTasks: 10,
            pendingTasks: 3,
            velocityNote: 'លើសគោលដៅកំណត់យ៉ាងខ្លាំង',
            completedNote: 'ត្រីមាស Q1',
            activeNote: 'Integration Phase',
            pendingNote: 'ត្រៀម Production Go-Live',
            columnLabel: 'កិច្ចការសម្រេចប្រចាំខែ',
            columnCategories: ['មករា', 'កុម្ភៈ', 'មីនា'],
            columnData: [19, 23, 20],
            polarData: [62, 10, 3, 5],
            teamCompleted: [42, 34, 28, 48],
            teamActive: [5, 3, 2, 5],
        },
    },
};

// ======================================= >> Code Starts Here << ========================== //
@Injectable()
export class ReportService {
    async getProjects(currentUser: UserPayload) {
        return {
            status: true,
            data: REPORT_PROJECTS,
        };
    }

    async getReportMetrics(currentUser: UserPayload, query: QueryReportDto) {
        const projectId = query.project_id || '1';
        const period = query.period || ReportPeriodEnum.WEEK;

        const project = REPORT_PROJECTS.find((p) => p.id === projectId) || REPORT_PROJECTS[0];
        const projectMetrics = PERIOD_METRICS_DATA[project.id] || PERIOD_METRICS_DATA['1'];
        const metrics = projectMetrics[period] || projectMetrics[ReportPeriodEnum.WEEK];

        return {
            status: true,
            data: {
                project,
                period,
                metrics,
            },
        };
    }

    async getDigest(currentUser: UserPayload, query: QueryReportDto) {
        const projectId = query.project_id || '1';
        const period = query.period || ReportPeriodEnum.WEEK;

        const project = REPORT_PROJECTS.find((p) => p.id === projectId) || REPORT_PROJECTS[0];
        const projectMetrics = PERIOD_METRICS_DATA[project.id] || PERIOD_METRICS_DATA['1'];
        const metrics = projectMetrics[period] || projectMetrics[ReportPeriodEnum.WEEK];

        return {
            status: true,
            data: {
                project,
                period,
                generated_at: new Date().toISOString(),
                reporter: currentUser ? (currentUser.name_en || currentUser.name_kh || 'System User') : 'System User',
                summary: {
                    velocity: metrics.velocity,
                    completed_tasks: metrics.completedTasks,
                    active_tasks: metrics.activeTasks,
                    pending_tasks: metrics.pendingTasks,
                    status_note: metrics.velocityNote,
                },
                deliverables: [
                    { title: 'Core Architecture Optimization', status: 'Completed', progress: 100 },
                    { title: 'RBAC Security & Permission Middleware', status: 'Completed', progress: 100 },
                    { title: 'Real-time WebSocket Push Notification', status: 'In Progress', progress: 85 },
                    { title: 'CI/CD Automated Deployment Pipelines', status: 'Completed', progress: 100 },
                ],
            },
        };
    }
}
