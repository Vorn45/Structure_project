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

export const DEFAULT_PROJECT_OPTIONS: AddPlanProjectOption[] = [
    { id: '4', code: '0002', name: 'BMS Digitech' },
    { id: '5', code: '0001', name: 'WMS Digitech' },
];
