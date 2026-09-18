// ===========================================================================>> Core Library
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { Organization } from 'src/app/model/organization/organization.entity';
import { UpdateSettingsDto } from './setting.dto';

export interface AdminSettingsStoreData {
    id?: string;
    organization_name_kh: string;
    organization_name_en: string;
    code: string;
    domain: string;
    departments: Array<{
        id: string;
        name_kh: string;
        name_en: string;
        head: string;
        member_count: number;
    }>;
    work_categories: string[];
    logo?: string | null;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
    currency?: string;
    timezone?: string;
    primary_color?: string;
    preferences?: {
        allow_mobile_checkin?: boolean;
        auto_notify_telegram?: boolean;
    };
}

const DEFAULT_SETTINGS: AdminSettingsStoreData = {
    organization_name_kh: 'ក្រុមហ៊ុន ឌីជីថេក ខេមបូឌា (Digitech Cambodia)',
    organization_name_en: 'Digitech Cambodia Co., Ltd.',
    code: 'DIGITECH-HQ',
    domain: 'pms.digitech.com.kh',
    departments: [
        { id: 'dept-1', name_kh: 'ព័ត៌មានវិទ្យា និងអភិវឌ្ឍន៍សូហ្វវែរ (IT)', name_en: 'Information Technology', head: 'លី ម៉េងហួរ', member_count: 14 },
        { id: 'dept-2', name_kh: 'គ្រប់គ្រងគម្រោង និងផែនការ (PMO)', name_en: 'Project Management Office', head: 'សុខ សុភា', member_count: 6 },
        { id: 'dept-3', name_kh: 'រចនា និងបទពិសោធន៍អ្នកប្រើប្រាស់ (UI/UX)', name_en: 'UI/UX & Product Design', head: 'កែវ ធីតា', member_count: 5 },
        { id: 'dept-4', name_kh: 'ហេដ្ឋារចនាសម្ព័ន្ធ និងសន្តិសុខ (DevOps)', name_en: 'Infrastructure & Security', head: 'រ័ត្ន វិចិត្រ', member_count: 4 },
        { id: 'dept-5', name_kh: 'ធនធានមនុស្ស និងរដ្ឋបាល (HR & Admin)', name_en: 'Human Resources & Admin', head: 'ចាន់ ស្រីមុំ', member_count: 3 },
    ],
    work_categories: [
        'អភិវឌ្ឍន៍បច្ចេកវិទ្យា',
        'ហេដ្ឋារចនាសម្ព័ន្ធ Cloud',
        'សន្តិសុខព័ត៌មាន',
        'រចនាផលិតផល UI/UX',
        'គ្រប់គ្រងគម្រោង',
        'ទីផ្សារ និងទំនាក់ទំនង',
        'ការងាររដ្ឋបាល',
    ],
    logo: null,
    contact_email: 'support@digitech.com.kh',
    contact_phone: '010 843 612',
    address: 'អគារពាណិជ្ជកម្មកោះពេជ្រ រាជធានីភ្នំពេញ កម្ពុជា',
    currency: 'USD ($)',
    timezone: 'Asia/Phnom_Penh (GMT+7)',
    primary_color: '#2563eb',
    preferences: {
        allow_mobile_checkin: true,
        auto_notify_telegram: true,
    },
};

@Injectable()
export class AdminSettingService implements OnModuleInit {
    private readonly settingsFilePath = path.join(process.cwd(), 'storage', 'data', 'admin_settings.json');
    private storedSettings: AdminSettingsStoreData = { ...DEFAULT_SETTINGS };

    constructor(
        @InjectRepository(Organization)
        private readonly _orgRepo: Repository<Organization>,
    ) {
        this.loadFromDisk();
    }

    onModuleInit() {
        this.loadFromDisk();
    }

    private loadFromDisk(): void {
        try {
            if (fs.existsSync(this.settingsFilePath)) {
                const raw = fs.readFileSync(this.settingsFilePath, 'utf8');
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    this.storedSettings = { ...DEFAULT_SETTINGS, ...parsed };
                }
            } else {
                this.saveToDisk();
            }
        } catch (e) {
            console.warn('[AdminSettingService] Failed to read settings from disk:', e);
        }
    }

    private saveToDisk(): void {
        try {
            const dir = path.dirname(this.settingsFilePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.settingsFilePath, JSON.stringify(this.storedSettings, null, 2), 'utf8');
        } catch (e) {
            console.warn('[AdminSettingService] Failed to save settings to disk:', e);
        }
    }

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

        if (org) {
            this.storedSettings.id = org.id;
            if (org.name_kh && !this.storedSettings.organization_name_kh) {
                this.storedSettings.organization_name_kh = org.name_kh;
            }
            if (org.name_en && !this.storedSettings.organization_name_en) {
                this.storedSettings.organization_name_en = org.name_en;
            }
            if (org.abbreviation) {
                this.storedSettings.code = org.abbreviation;
            }
            if (org.domain) {
                this.storedSettings.domain = org.domain;
            }
        }

        return {
            status_code: 200,
            data: this.storedSettings,
        };
    }

    async updateSettings(user: UserPayload, dto: UpdateSettingsDto) {
        let org = await this.resolveOrganization(user);

        if (!org) {
            org = this._orgRepo.create({
                name_kh: dto.organization_name_kh || this.storedSettings.organization_name_kh,
                name_en: dto.organization_name_en || this.storedSettings.organization_name_en,
                slug: 'digitech-org',
                owner_id: user?.id || 1,
            });
        }

        if (dto.organization_name_kh) {
            org.name_kh = dto.organization_name_kh;
            this.storedSettings.organization_name_kh = dto.organization_name_kh;
        }
        if (dto.organization_name_en) {
            org.name_en = dto.organization_name_en;
            this.storedSettings.organization_name_en = dto.organization_name_en;
        }
        if (dto.code) {
            org.abbreviation = dto.code;
            this.storedSettings.code = dto.code;
        }
        if (dto.domain) {
            org.domain = dto.domain;
            this.storedSettings.domain = dto.domain;
        }
        if (dto.departments) {
            this.storedSettings.departments = dto.departments;
        }
        if (dto.work_categories) {
            this.storedSettings.work_categories = dto.work_categories;
        }
        if (dto.logo !== undefined) {
            this.storedSettings.logo = dto.logo;
        }
        if (dto.contact_email !== undefined) {
            this.storedSettings.contact_email = dto.contact_email;
        }
        if (dto.contact_phone !== undefined) {
            this.storedSettings.contact_phone = dto.contact_phone;
        }
        if (dto.address !== undefined) {
            this.storedSettings.address = dto.address;
        }
        if (dto.currency !== undefined) {
            this.storedSettings.currency = dto.currency;
        }
        if (dto.timezone !== undefined) {
            this.storedSettings.timezone = dto.timezone;
        }
        if (dto.primary_color !== undefined) {
            this.storedSettings.primary_color = dto.primary_color;
        }
        if (dto.preferences) {
            this.storedSettings.preferences = {
                ...this.storedSettings.preferences,
                ...dto.preferences,
            };
        }

        try {
            const saved = await this._orgRepo.save(org);
            this.storedSettings.id = saved.id;
        } catch (e) {
            console.warn('[AdminSettingService] DB org save warning (proceeding with disk save):', e);
        }

        this.saveToDisk();

        return {
            status_code: 200,
            message: 'Organization settings updated successfully',
            data: this.storedSettings,
        };
    }
}

