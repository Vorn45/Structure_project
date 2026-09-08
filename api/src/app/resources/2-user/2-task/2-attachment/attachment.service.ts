// ===========================================================================>> Core Library
import { Injectable, NotFoundException } from '@nestjs/common';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { TaskService } from '../task.service';
import { UploadTaskAttachmentDto } from './attachment.dto';

// ======================================= >> Code Starts Here << ========================== //
@Injectable()
export class TaskAttachmentService {
    constructor(private readonly _taskService: TaskService) {}

    async getTaskAttachments(user: UserPayload, taskId: number) {
        const task = await this._taskService.getTaskById(user, taskId);
        if (!task || !task.data) {
            throw new NotFoundException(`Task #${taskId} not found`);
        }

        const commentsRes = await this._taskService.getTaskComments(user, taskId);
        const comments = commentsRes?.data?.comments || [];
        const attachments: any[] = [];

        for (const c of comments) {
            if (c.attachments && Array.isArray(c.attachments)) {
                for (const att of c.attachments) {
                    attachments.push({
                        ...att,
                        uploaded_by: c.sender_name,
                        created_at: c.created_at,
                    });
                }
            }
        }

        return {
            status_code: 200,
            message: 'Task attachments retrieved successfully',
            data: attachments,
        };
    }

    async addAttachment(user: UserPayload, taskId: number, dto: UploadTaskAttachmentDto) {
        return await this._taskService.createTaskComment(
            user,
            taskId,
            `បានភ្ជាប់ឯកសារថ្មី៖ ${dto.name}`,
            [dto],
        );
    }
}
