export interface ProjectPlanOption {
    id: string;
    code: string;
    name: string;
    description?: string;
    tasksCount?: number;
    progress?: number;
}

export interface SelectProjectPlanDialogData {
    projects: ProjectPlanOption[];
    selectedProjectId?: string;
    activeTab?: 'existing' | 'create';
}
