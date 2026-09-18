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
        const leadObj = {
            id: dto.lead_id,
            name: dto.lead_name,
            role: dto.lead_role || 'Project Lead',
            avatar: null,
        };
        if (existingIdx > -1) {
            members[existingIdx].role = 'Project Lead';
            const lead = members.splice(existingIdx, 1)[0];
            members.unshift(lead);
        } else {
            members.unshift(leadObj);
        }

        return this._planService.updatePlan(user, id, {
            members,
            lead: leadObj,
            team_lead: leadObj,
        });
    }

    // Sub-resources delegation to PlanService
    async getTasks(user: UserPayload, id: string) {
        return this._planService.getTasks(user, id);
    }

    async createTask(user: UserPayload, id: string, dto: any) {
        return this._planService.createTask(user, id, dto);
    }

    async updateTask(user: UserPayload, id: string, taskId: string, dto: any) {
        return this._planService.updateTask(user, id, taskId, dto);
    }

    async deleteTask(user: UserPayload, id: string, taskId: string) {
        return this._planService.deleteTask(user, id, taskId);
    }

    async createPhase(user: UserPayload, id: string, dto: any) {
        return this._planService.createPhase(user, id, dto);
    }

    async deletePhase(user: UserPayload, id: string, phaseId: string) {
        return this._planService.deletePhase(user, id, phaseId);
    }

    async createMeeting(user: UserPayload, id: string, dto: any) {
        return this._planService.createMeeting(user, id, dto);
    }

    async deleteMeeting(user: UserPayload, id: string, meetingId: string) {
        return this._planService.deleteMeeting(user, id, meetingId);
    }

    async createMember(user: UserPayload, id: string, dto: any) {
        return this._planService.createMember(user, id, dto);
    }

    async deleteMember(user: UserPayload, id: string, memberId: number) {
        return this._planService.deleteMember(user, id, memberId);
    }

    async getAgileTasks(user: UserPayload, id: string) {
        return this._planService.getAgileTasks(user, id);
    }

    async createAgileTask(user: UserPayload, id: string, dto: any) {
        return this._planService.createAgileTask(user, id, dto);
    }

    async updateAgileTask(user: UserPayload, id: string, taskId: string, dto: any) {
        return this._planService.updateAgileTask(user, id, taskId, dto);
    }

    async deleteAgileTask(user: UserPayload, id: string, taskId: string) {
        return this._planService.deleteAgileTask(user, id, taskId);
    }
}
