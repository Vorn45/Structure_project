// ===========================================================================>> Core Library
import { Injectable } from '@nestjs/common';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { TaskService } from '../task.service';
import { CreateTaskCommentDto } from './comment.dto';

// ======================================= >> Code Starts Here << ========================== //
@Injectable()
export class TaskCommentService {
    constructor(private readonly _taskService: TaskService) {}

    async getComments(user: UserPayload, taskId: number) {
        return await this._taskService.getTaskComments(user, taskId);
    }

    async createComment(user: UserPayload, taskId: number, dto: CreateTaskCommentDto) {
        return await this._taskService.createTaskComment(user, taskId, dto.text, dto.attachments);
    }
}
