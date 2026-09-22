import { PlannerScheduleEvent } from '../component';

export interface ScheduleDetailDialogData {
    schedule: PlannerScheduleEvent;
    /** Creator or admin — anyone else sees the schedule read-only. */
    canModify?: boolean;
}
