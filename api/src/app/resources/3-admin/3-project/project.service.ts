// ===========================================================================>> Core Library
import { Injectable, NotFoundException } from '@nestjs/common';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { PlanService } from '../../2-user/4-plan/plan.service';
import { QueryAdminProjectDto, UpdateProjectBudgetDto, UpdateProjectLeadDto } from './project.dto';

@Injectable()
export class AdminProjectService {
    constructor(private readonly _planService: PlanService) {}

    async getProjects(user: UserPayload, query: QueryAdminProjectDto) {
        return this._planService.getPlans(user, query);
    }

    async getProjectById(user: UserPayload, id: string) {
        return this._planService.getPlanById(user, id);
    }

    async createProject(user: UserPayload, dto: any) {
        return this._planService.createPlan(user, dto);
    }

    async updateProject(user: UserPayload, id: string, dto: any) {
        return this._planService.updatePlan(user, id, dto);
    }

    async deleteProject(user: UserPayload, id: string) {
        return this._planService.deletePlan(user, id);
    }

    async updateBudget(user: UserPayload, id: string, dto: UpdateProjectBudgetDto) {
        const raw = this._planService.getRawProjects();
        const target = raw.find((p) => p.id === id || p.code === id);
        if (!target) throw new NotFoundException(`Project ${id} not found`);

        return this._planService.updatePlan(user, id, {
            budget: dto.budget,
            spent: dto.spent || 0,
        });
    }

    async updateLead(user: UserPayload, id: string, dto: UpdateProjectLeadDto) {
        const raw = this._planService.getRawProjects();
        const target = raw.find((p) => p.id === id || p.code === id);
        if (!target) throw new NotFoundException(`Project ${id} not found`);

        const members = target.members ? [...target.members] : [];
        const existingIdx = members.findIndex((m) => m.id === dto.lead_id);
        if (existingIdx > -1) {
            members[existingIdx].role = 'Project Lead';
            const lead = members.splice(existingIdx, 1)[0];
            members.unshift(lead);
        } else {
            members.unshift({
                id: dto.lead_id,
                name: dto.lead_name,
                role: dto.lead_role || 'Project Lead',
                avatar: null,
            });
        }

        return this._planService.updatePlan(user, id, { members });
    }
}
