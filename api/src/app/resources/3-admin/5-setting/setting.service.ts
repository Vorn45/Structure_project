// ===========================================================================>> Core Library
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { UpdateSettingsDto } from './setting.dto';

@Injectable()
export class AdminSettingService {
    private settings = {
        organization_name_kh: 'ប្រព័ន្ធគ្រប់គ្រងការងារ និងគម្រោងឌីជីថល',
        organization_name_en: 'Digital Workforce & Project Management System',
        code: 'WFM-HQ',
        domain: 'wfm.internal.gov.kh',
        departments: [
            { id: 'dept-1', name_kh: 'ព័ត៌មានវិទ្យា និងអភិវឌ្ឍន៍សូហ្វវែរ (IT)', name_en: 'Information Technology', head: 'លី ម៉េងហួរ', member_count: 14 },
            { id: 'dept-2', name_kh: 'គ្រប់គ្រងគម្រោង និងផែនការ (PMO)', name_en: 'Project Management Office', head: 'សុខ សុភា', member_count: 6 },
            { id: 'dept-3', name_kh: 'រចនា និងបទពិសោធន៍អ្នកប្រើប្រាស់ (UI/UX)', name_en: 'UI/UX & Product Design', head: 'កែវ ធីតា', member_count: 5 },
            { id: 'dept-4', name_kh: 'ហេដ្ឋារចនាសម្ព័ន្ធ និងសន្តិសុខ (DevOps)', name_en: 'Infrastructure & Security', head: 'រ័ត្ន វិចិត្រ', member_count: 4 },
        ],
        work_categories: ['អភិវឌ្ឍន៍បច្ចេកវិទ្យា', 'ហេដ្ឋារចនាសម្ព័ន្ធ Cloud', 'សន្តិសុខព័ត៌មាន', 'រចនាផលិតផល', 'ការងាររដ្ឋបាល'],
    };

    private readonly storeFilePath = path.join(process.cwd(), 'storage', 'admin_settings_store.json');

    constructor() {
        this.loadFromDisk();
    }

    private loadFromDisk(): void {
        try {
            if (fs.existsSync(this.storeFilePath)) {
                const raw = fs.readFileSync(this.storeFilePath, 'utf8');
                const data = JSON.parse(raw);
                if (data) this.settings = { ...this.settings, ...data };
            }
        } catch (e) {
            console.warn('Failed to load settings from disk:', e);
        }
    }

    private saveToDisk(): void {
        try {
            const dir = path.dirname(this.storeFilePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.storeFilePath, JSON.stringify(this.settings, null, 2), 'utf8');
        } catch (e) {
            console.warn('Failed to save settings to disk:', e);
        }
    }

    async getSettings(user: UserPayload) {
        return {
            status_code: 200,
            data: this.settings,
        };
    }

    async updateSettings(user: UserPayload, dto: UpdateSettingsDto) {
        this.settings = {
            ...this.settings,
            ...dto,
            organization_name_kh: dto.organization_name_kh ?? this.settings.organization_name_kh,
            organization_name_en: dto.organization_name_en ?? this.settings.organization_name_en,
            departments: dto.departments ?? this.settings.departments,
            work_categories: dto.work_categories ?? this.settings.work_categories,
        };

        this.saveToDisk();

        return {
            status_code: 200,
            message: 'Settings updated successfully',
            data: this.settings,
        };
    }
}
