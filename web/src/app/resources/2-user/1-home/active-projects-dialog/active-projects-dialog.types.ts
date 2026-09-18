export interface ActiveProjectItem {
    id: string;
    title: string;
    code: string;
    progress: number;
    tasksCount: number;
    completedTasks: number;
    status: 'on_track' | 'in_progress' | 'delayed';
    dueDate: string;
    members: { name: string; avatar?: string }[];
}
