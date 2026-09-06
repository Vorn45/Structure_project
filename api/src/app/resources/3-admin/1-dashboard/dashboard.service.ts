// ===========================================================================>> Core Library
import { Injectable } from '@nestjs/common';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { PlanService } from '../../2-user/4-plan/plan.service';

@Injectable()
export class DashboardService {
    constructor(private readonly _planService: PlanService) {}

    async getStats(user: UserPayload) {
        const rawProjects = this._planService.getRawProjects();
        const totalProjects = rawProjects.length;
        const activeProjects = rawProjects.filter((p) => p.status === 'active').length;
        const completedProjects = rawProjects.filter((p) => p.status === 'completed').length;
        const planningProjects = rawProjects.filter((p) => p.status === 'planning' || p.status === 'on_hold').length;

        let totalTasks = 0;
        let completedTasks = 0;
        rawProjects.forEach((p) => {
            totalTasks += p.total_tasks || p.tasks?.length || 0;
            completedTasks += p.completed_tasks || p.tasks?.filter((t: any) => t.status === 'done' || t.status === 'completed')?.length || 0;
        });

        return {
            status_code: 200,
            message: 'Dashboard stats retrieved successfully',
            data: {
                kpi: {
                    total_projects: totalProjects,
                    active_projects: activeProjects,
                    completed_projects: completedProjects,
                    planning_projects: planningProjects,
                    total_tasks: totalTasks,
                    completed_tasks: completedTasks,
                    task_completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                    active_users: 5,
                    total_users: 5,
                    pending_leaves: 1,
                },
                projects_summary: rawProjects.map((p) => ({
                    id: p.id,
                    code: p.code,
                    name: p.name,
                    status: p.status,
                    progress: p.progress,
                    total_tasks: p.total_tasks || p.tasks?.length || 0,
                    completed_tasks: p.completed_tasks || 0,
                    lead: p.members?.[0]?.name || 'Project Lead',
                })),
                department_stats: [
                    { name: 'ព័ត៌មានវិទ្យា (IT)', name_en: 'Information Technology', members: 14, progress: 85 },
                    { name: 'គ្រប់គ្រងគម្រោង (PMO)', name_en: 'Project Management', members: 6, progress: 75 },
                    { name: 'រចនា UI/UX', name_en: 'Product Design', members: 5, progress: 90 },
                    { name: 'ហេដ្ឋារចនាសម្ព័ន្ធ (DevOps)', name_en: 'DevOps & Security', members: 4, progress: 70 },
                ],
                recent_activity: [
                    { id: 'act-1', text: 'បានបង្កើតគម្រោងថ្មី PMS-V2 ជោគជ័យ', user: 'សុខ សុភា', time: '១០ នាទីមុន' },
                    { id: 'act-2', text: 'បានអនុម័តច្បាប់ឈប់សម្រាករបស់ រ័ត្ន វិចិត្រ', user: 'Admin', time: '១ ម៉ោងមុន' },
                    { id: 'act-3', text: 'បានបញ្ចប់ Task #PMS-104 នៅក្នុងប្រព័ន្ធ WMS', user: 'ចេង ច័ន្ទបញ្ញា', time: '៣ ម៉ោងមុន' },
                ],
            },
        };
    }
}
