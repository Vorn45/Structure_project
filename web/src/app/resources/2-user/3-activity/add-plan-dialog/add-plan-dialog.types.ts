import { AgilePlanTask } from '../component';
export { AgilePlanTask };

export interface AddPlanProjectOption {
    id: string;
    code: string;
    name: string;
}

export interface AddPlanLinkOption {
    id: string;
    label: string;
}

export interface AddPlanDialogData {
    /** Visible timeline window (YYYY-MM-DD), used to seed + validate the dates. */
    timelineStart?: string;
    timelineEnd?: string;
    projects?: AddPlanProjectOption[];
    selectedProjectId?: string;
    selectedProjectName?: string;
    task?: AgilePlanTask;
    isEditing?: boolean;
    /** Phases of the selected project, offered as a progress source. */
    phaseOptions?: AddPlanLinkOption[];
    /** Tasks of the selected project, offered as a progress source. */
    taskOptions?: AddPlanLinkOption[];
}
