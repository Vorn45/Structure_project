import { AgilePlanTask } from '../component';
export { AgilePlanTask };

export interface AddPlanProjectOption {
    id: string;
    code: string;
    name: string;
}

export interface AddPlanDialogData {
    currentWeek?: number;
    startWeek?: number;
    totalWeeks?: number;
    weeks?: number[];
    projects?: AddPlanProjectOption[];
    selectedProjectId?: string;
    selectedProjectName?: string;
    task?: AgilePlanTask;
    isEditing?: boolean;
}
