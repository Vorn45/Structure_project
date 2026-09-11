// ===========================================================================>> Core Library
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { TaskService } from '../../2-user/2-task/task.service';
import { PlanService } from '../../2-user/4-plan/plan.service';
import { PlannerService } from '../../2-user/6-planner/planner.service';
import { AdminUserService } from '../2-user/user.service';
import { AdminAttendanceService } from '../4-attendance/attendance.service';

@Injectable()
export class DashboardService {
    constructor(
        private readonly _planService: PlanService,
        private readonly _taskService: TaskService,
        private readonly _plannerService: PlannerService,
        private readonly _adminUserService: AdminUserService,
        private readonly _attendanceService: AdminAttendanceService,
    ) {}

    async getStats(user: UserPayload) {
        // 1. PROJECTS (Dynamic from PlanService)
        const rawProjects = this._planService.getRawProjects() || [];
        const totalProjects = rawProjects.length;
        const activeProjects = rawProjects.filter((p) => p.status === 'active').length;
        const completedProjects = rawProjects.filter((p) => p.status === 'completed').length;
        const planningProjects = rawProjects.filter((p) => p.status === 'planning' || p.status === 'on_hold').length;

        // 2. REAL TASKS (Dynamic from TaskService)
        const rawTasks = this._taskService.getRawTasks() || [];
        let totalTasks = rawTasks.length;
        let completedTasks = 0;
        let inProgressTasks = 0;
        let pendingTasks = 0;

        rawTasks.forEach((t: any) => {
            const status = (t.status || '').toLowerCase();
            const progress = Number(t.progress || 0);

            if (status === 'completed' || status === 'done' || status === 'confirmed' || progress === 100) {
                completedTasks++;
            } else if (status === 'in_progress' || status === 'doing' || status === 'review' || status === 'reopened') {
                inProgressTasks++;
            } else {
                pendingTasks++;
            }
        });

        // If tasks store was empty, fallback to project-level task counters
        if (totalTasks === 0) {
            rawProjects.forEach((p) => {
                const tasks = p.tasks || [];
                totalTasks += p.total_tasks || tasks.length || 0;
                completedTasks += p.completed_tasks || tasks.filter((t: any) => t.status === 'done' || t.status === 'completed').length || 0;
                inProgressTasks += tasks.filter((t: any) => t.status === 'in_progress' || t.status === 'doing').length || 0;
                pendingTasks += tasks.filter((t: any) => t.status === 'todo' || t.status === 'pending').length || 0;
            });
        }

        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // 3. USERS (Dynamic from AdminUserService)
        const allUsers = this._adminUserService.getRawUsers() || [];
        const totalUsers = allUsers.length;
        const activeUsers = allUsers.filter((u) => u.is_active === 1).length;

        // 4. LEAVES (Dynamic from AdminAttendanceService)
        const allLeaves = this._attendanceService.getRawLeaves() || [];
        const pendingLeaves = allLeaves.filter((l) => l.status === 'pending').length;

        // 5. SCHEDULED MEETINGS (Dynamic from PlannerService)
        let scheduledMeetings: any[] = [];
        try {
            const schedulesResult = await this._plannerService.getSchedules(user, { scope: 'all' } as any);
            const rawSchedules = Array.isArray(schedulesResult?.data?.results)
                ? schedulesResult.data.results
                : Array.isArray(schedulesResult?.data)
                ? schedulesResult.data
                : [];

            scheduledMeetings = rawSchedules.slice(0, 6).map((sch: any, idx: number) => {
                const isToday = sch.day_index === 0 || sch.day_index === new Date().getDay();
                return {
                    id: sch.id,
                    title: sch.title,
                    time: sch.time || `${sch.start_time || ''} - ${sch.end_time || ''}`,
                    dateGroup: isToday ? 'today' : 'upcoming',
                    dateLabel: isToday ? 'ថ្ងៃនេះ' : `ថ្ងៃទី ${sch.day_index + 1}`,
                    badgeColor: sch.category === 'work' ? '#0f766e' : sch.category === 'breaks' ? '#f43f5e' : '#6366f1',
                    borderClass: sch.category === 'work' ? 'border-l-4 border-teal-600' : sch.category === 'breaks' ? 'border-l-4 border-rose-500' : 'border-l-4 border-indigo-500',
                    members: Array.isArray(sch.members)
                        ? sch.members.map((m: any) => m.initials || m.name?.slice(0, 2)?.toUpperCase() || 'MB')
                        : ['PP', 'PB'],
                    extraCount: Math.max(0, (sch.members?.length || 0) - 2),
                };
            });
        } catch (e) {
            console.warn('Could not load planner schedules for dashboard:', e);
        }

        // 6. TOP PERFORMERS (Dynamic from real tasks assigned to users)
        const avatarBgColors = [
            'bg-slate-700 text-white',
            'bg-blue-700 text-white',
            'bg-teal-700 text-white',
            'bg-indigo-700 text-white',
            'bg-purple-700 text-white',
            'bg-rose-600 text-white',
        ];

        const now = Date.now();
        const oneDayMs = 86400000;
        const sevenDaysMs = 7 * oneDayMs;
        const thirtyDaysMs = 30 * oneDayMs;
        const oneYearMs = 365 * oneDayMs;

        const performers = allUsers.map((u, idx) => {
            const userTasks = rawTasks.filter((t: any) => {
                const assigneeId = t.assignee?.id;
                const reporterId = t.reporter?.id;
                const hasAssignee = Array.isArray(t.assignees) && t.assignees.some((a: any) => a.id === u.id);
                return assigneeId === u.id || reporterId === u.id || hasAssignee;
            });

            const completedTasksAll = userTasks.filter((t: any) => {
                const status = (t.status || '').toLowerCase();
                return status === 'completed' || status === 'done' || status === 'confirmed' || Number(t.progress || 0) === 100;
            });

            const countInPeriod = (periodMs: number) => {
                return completedTasksAll.filter((t: any) => {
                    const taskTime = new Date(t.updated_at || t.created_at || 0).getTime();
                    return now - taskTime <= periodMs;
                }).length;
            };

            const tasksAll = completedTasksAll.length;
            const tasks1d = countInPeriod(oneDayMs);
            const tasks7d = countInPeriod(sevenDaysMs);
            const tasks1m = countInPeriod(thirtyDaysMs);
            const tasks1y = countInPeriod(oneYearMs);

            const initials = u.name_en
                ? u.name_en
                      .trim()
                      .split(' ')
                      .filter(Boolean)
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                : (u.name_kh || '').slice(0, 2);

            return {
                id: String(u.id),
                name: `${u.name_kh} (${u.name_en})`,
                name_kh: u.name_kh,
                name_en: u.name_en,
                email: u.email,
                role: u.role || 'Member',
                avatar: u.avatar || '',
                initials: initials || 'MB',
                avatarBg: avatarBgColors[idx % avatarBgColors.length],
                tasks_completed: tasksAll,
                tasks_1d: tasks1d,
                tasks_7d: tasks7d,
                tasks_1m: tasks1m,
                tasks_1y: tasks1y,
                tasks_all: tasksAll,
            };
        });

        // Sort descending by completed tasks count
        performers.sort((a, b) => b.tasks_completed - a.tasks_completed);

        // 7. REAL DYNAMIC TREND SERIES (Weekly, Monthly, Yearly)
        const weeklyDays = ['ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍', 'អាទិត្យ'];
        const weeklyInProgress = [0, 0, 0, 0, 0, 0, 0];
        const weeklyCompleted = [0, 0, 0, 0, 0, 0, 0];

        rawTasks.forEach((t: any) => {
            const taskDate = new Date(t.updated_at || t.created_at || now);
            const dayOfWeek = (taskDate.getDay() + 6) % 7; // Mon = 0, Sun = 6
            const status = (t.status || '').toLowerCase();
            const progress = Number(t.progress || 0);

            if (status === 'completed' || status === 'done' || status === 'confirmed' || progress === 100) {
                weeklyCompleted[dayOfWeek]++;
            } else {
                weeklyInProgress[dayOfWeek]++;
            }
        });

        const monthlyNames = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
        const currentMonthIdx = new Date().getMonth();
        // Show 6 months window around current month
        const visibleMonthIndices = [
            (currentMonthIdx - 3 + 12) % 12,
            (currentMonthIdx - 2 + 12) % 12,
            (currentMonthIdx - 1 + 12) % 12,
            currentMonthIdx,
            (currentMonthIdx + 1) % 12,
            (currentMonthIdx + 2) % 12,
        ];
        const monthlyMonths = visibleMonthIndices.map((i) => monthlyNames[i]);
        const monthlyInProgress = visibleMonthIndices.map((mIdx) => {
            return rawTasks.filter((t: any) => {
                const date = new Date(t.created_at || now);
                return date.getMonth() === mIdx;
            }).length;
        });
        const monthlyCompleted = visibleMonthIndices.map((mIdx) => {
            return rawTasks.filter((t: any) => {
                const date = new Date(t.updated_at || now);
                const status = (t.status || '').toLowerCase();
                return date.getMonth() === mIdx && (status === 'completed' || status === 'done' || status === 'confirmed');
            }).length;
        });

        const yearlyYears = ['2024', '2025', '2026', '2027'];
        const yearlyInProgress = yearlyYears.map((yr) => {
            return rawTasks.filter((t: any) => new Date(t.created_at || now).getFullYear() === Number(yr)).length;
        });
        const yearlyCompleted = yearlyYears.map((yr) => {
            return rawTasks.filter((t: any) => {
                const status = (t.status || '').toLowerCase();
                return new Date(t.updated_at || now).getFullYear() === Number(yr) && (status === 'completed' || status === 'done' || status === 'confirmed');
            }).length;
        });

        // 8. KPI SPARKLINE ARRAYS
        const membersSparkline = [
            Math.max(1, totalUsers - 3),
            Math.max(2, totalUsers - 2),
            Math.max(3, totalUsers - 1),
            totalUsers,
            totalUsers,
            totalUsers,
        ];
        const projectsSparkline = [
            Math.max(0, activeProjects - 1),
            Math.max(1, activeProjects),
            activeProjects,
            activeProjects,
            activeProjects,
        ];
        const leavesSparkline = [
            Math.max(0, pendingLeaves - 1),
            pendingLeaves,
            Math.max(0, pendingLeaves),
            pendingLeaves,
        ];

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
                    in_progress_tasks: inProgressTasks,
                    pending_tasks: pendingTasks,
                    task_completion_rate: completionRate,
                    active_users: activeUsers,
                    total_users: totalUsers,
                    pending_leaves: pendingLeaves,
                },
                kpi_badges: {
                    members: `+${Math.round((activeUsers / Math.max(1, totalUsers)) * 100)}%`,
                    projects: `+${totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0}%`,
                    leaves: pendingLeaves > 0 ? `+${pendingLeaves}` : '0',
                },
                sparklines: {
                    members: membersSparkline,
                    projects: projectsSparkline,
                    leaves: leavesSparkline,
                },
                task_distribution: {
                    completed: completedTasks,
                    in_progress: inProgressTasks,
                    pending: pendingTasks,
                    completion_percentage: completionRate,
                },
                trend: {
                    weekly: {
                        days: weeklyDays,
                        in_progress: weeklyInProgress,
                        completed: weeklyCompleted,
                    },
                    monthly: {
                        months: monthlyMonths,
                        in_progress: monthlyInProgress,
                        completed: monthlyCompleted,
                    },
                    yearly: {
                        years: yearlyYears,
                        in_progress: yearlyInProgress,
                        completed: yearlyCompleted,
                    },
                },
                scheduled_meetings: scheduledMeetings,
                top_performers: performers,
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
                    { id: 'act-1', text: 'បានបង្កើតគម្រោងថ្មី WFM-V2 ជោគជ័យ', user: 'សុខ សុភា', time: '១០ នាទីមុន' },
                    { id: 'act-2', text: 'បានអនុម័តច្បាប់ឈប់សម្រាករបស់ រ័ត្ន វិចិត្រ', user: 'Admin', time: '១ ម៉ោងមុន' },
                    { id: 'act-3', text: 'បានបញ្ចប់ Task #WMS-0001 នៅក្នុងប្រព័ន្ធ WMS', user: 'ចេង ច័ន្ទបញ្ញា', time: '៣ ម៉ោងមុន' },
                ],
            },
        };
    }
}
