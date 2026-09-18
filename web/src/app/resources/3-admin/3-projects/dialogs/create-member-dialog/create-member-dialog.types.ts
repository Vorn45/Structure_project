import { AdminUser } from '../../../admin.service';

export interface CreateMemberDialogData {
    projectName?: string;
    users?: AdminUser[];
    existingMemberIds?: (number | string)[];
    existingMemberNames?: string[];
}
