export interface TaskStatusCounts {
    all: number;
    new: number;
    confirmed: number;
    unconfirmed: number;
    in_progress: number;
    in_review: number;
    reopened: number;
    done: number;
}

export interface HomeOverviewData {
    user: {
        id: number;
        name_en: string;
        name_kh: string;
        email?: string;
        phone?: string;
        avatar?: any;
        active_role_id: number;
        organization_id?: string | null;
    };
    metrics: {
        total_tasks: number;
        pending_tasks: number;
        in_progress_tasks: number;
        completed_tasks: number;
        overdue_tasks: number;
        high_priority: number;
        medium_priority: number;
        low_priority: number;
        completion_rate: number;
    };
    /** Per-status totals for the signed-in user across every project — the same
     *  shape the task list returns in `data.counts`, so the home pills and the
     *  work page's status chips read from identical numbers. */
    my_task_counts: TaskStatusCounts;
    recent_tasks: Array<{
        id: number;
        title: string;
        description?: string;
        status: string;
        priority: string;
        due_date: string;
        progress: number;
        project_name: string;
    }>;
    active_projects: Array<{
        id: string;
        name: string;
        total_tasks: number;
        completed_tasks: number;
        progress: number;
        members_count: number;
        status: string;
    }>;
}

export interface HomeStatsData {
    tasks_summary: {
        todo: number;
        in_progress: number;
        review: number;
        done: number;
    };
    weekly_activity: Array<{
        day: string;
        completed: number;
        created: number;
    }>;
}
