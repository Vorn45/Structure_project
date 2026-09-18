// ===========================================================================>> Core Library
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { Organization } from 'src/app/model/organization/organization.entity';
import { UpdateSettingsDto } from './setting.dto';

@Injectable()
export class AdminSettingService {
    constructor(
        @InjectRepository(Organization)
        private readonly _orgRepo: Repository<Organization>,
    ) {}

    private async resolveOrganization(user: UserPayload): Promise<Organization | null> {
        if (user?.organization_id) {
            const org = await this._orgRepo.findOne({
                where: { id: user.organization_id },
                relations: ['organization_positions'],
            });
            if (org) return org;
        }

        return await this._orgRepo.findOne({
            order: { created_at: 'ASC' },
            relations: ['organization_positions'],
        });
    }

    async getSettings(user: UserPayload) {
        const org = await this.resolveOrganization(user);

        const defaultDepartments = [
            { id: 'dept-1', name_kh: 'ព័ត៌មានវិទ្យា និងអភិវឌ្ឍន៍សូហ្វវែរ (IT)', name_en: 'Information Technology', head: 'លី ម៉េងហួរ', member_count: 14 },
            { id: 'dept-2', name_kh: 'គ្រប់គ្រងគម្រោង និងផែនការ (PMO)', name_en: 'Project Management Office', head: 'សុខ សុភា', member_count: 6 },
            { id: 'dept-3', name_kh: 'រចនា និងបទពិសោធន៍អ្នកប្រើប្រាស់ (UI/UX)', name_en: 'UI/UX & Product Design', head: 'កែវ ធីតា', member_count: 5 },
            { id: 'dept-4', name_kh: 'ហេដ្ឋារចនាសម្ព័ន្ធ និងសន្តិសុខ (DevOps)', name_en: 'Infrastructure & Security', head: 'រ័ត្ន វិចិត្រ', member_count: 4 },
        ];

        const workCategories = ['អភិវឌ្ឍន៍បច្ចេកវិទ្យា', 'ហេដ្ឋារចនាសម្ព័ន្ធ Cloud', 'សន្តិសុខព័ត៌មាន', 'រចនាផលិតផល', 'ការងាររដ្ឋបាល'];

        if (!org) {
            return {
                status_code: 200,
                data: {
                    organization_name_kh: 'ប្រព័ន្ធគ្រប់គ្រងការងារ និងគម្រោងឌីជីថល',
                    organization_name_en: 'Digital Workforce & Project Management System',
                    code: 'WFM-HQ',
                    domain: 'wfm.internal.gov.kh',
                    departments: defaultDepartments,
                    work_categories: workCategories,
                    logo: null,
                },
            };
        }

        const positions = (org.organization_positions || []).map((p, idx) => ({
            id: String(p.id || `dept-${idx + 1}`),
            name_kh: p.name_kh || 'ផ្នែកទូទៅ',
            name_en: p.name_en || 'Department',
            head: 'ប្រធានផ្នែក',
            member_count: 5,
        }));

        return {
            status_code: 200,
            data: {
                id: org.id,
                organization_name_kh: org.name_kh,
                organization_name_en: org.name_en,
                code: org.abbreviation || org.slug || 'WFM-HQ',
                domain: org.domain || 'wfm.internal.gov.kh',
                departments: positions.length ? positions : defaultDepartments,
                work_categories: workCategories,
                logo: null,
            },
        };
    }

    async updateSettings(user: UserPayload, dto: UpdateSettingsDto) {
        let org = await this.resolveOrganization(user);

        if (!org) {
            org = this._orgRepo.create({
                name_kh: dto.organization_name_kh || 'ប្រព័ន្ធគ្រប់គ្រងការងារ',
                name_en: dto.organization_name_en || 'Workforce Management System',
                slug: 'wfm-org',
                owner_id: user?.id || 1,
            });
        }

        if (dto.organization_name_kh) org.name_kh = dto.organization_name_kh;
        if (dto.organization_name_en) org.name_en = dto.organization_name_en;

        const saved = await this._orgRepo.save(org);

        return {
            status_code: 200,
            message: 'Organization settings updated successfully',
            data: {
                id: saved.id,
                organization_name_kh: saved.name_kh,
                organization_name_en: saved.name_en,
                code: saved.abbreviation || saved.slug,
                domain: saved.domain || 'wfm.internal.gov.kh',
                departments: dto.departments || [],
                work_categories: dto.work_categories || [],
                logo: dto.logo || null,
            },
        };
    }
}
