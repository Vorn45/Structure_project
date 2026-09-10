// ===========================================================================>> Core Library
import { Injectable } from '@nestjs/common';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { PlanService } from '../../4-plan/plan.service';
import { CreateHomeProjectDto } from './project.dto';

@Injectable()
export class ProjectService {
    constructor(private readonly planService: PlanService) {}

    async getActiveProjects(user: UserPayload) {
        return await this.planService.getPlans(user, {});
    }

    async createProject(user: UserPayload, dto: CreateHomeProjectDto) {
        return await this.planService.createPlan(user, {
            ...dto,
            name: dto.name,
            code: dto.code || `PMS-${Math.floor(100 + Math.random() * 900)}`,
            description: dto.description || '',
            status: dto.status || 'active',
            priority: dto.priority || 'medium',
            category: dto.category || 'it',
            budget: dto.budget || dto.budget_allocated || 5000,
            budget_allocated: dto.budget || dto.budget_allocated || 5000,
            lead: dto.lead || dto.team_lead,
            team_lead: dto.team_lead || dto.lead,
            reporter: dto.reporter || (dto.lead?.name || ''),
            members: dto.members || [],
            attachments: dto.attachments || [],
            start_date: dto.start_date || new Date().toISOString(),
            end_date: dto.end_date || new Date(Date.now() + 86400000 * 30).toISOString(),
        });
    }
}
