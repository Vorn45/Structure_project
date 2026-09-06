// ===========================================================================>> Core Library
import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { CreateAdminUserDto, QueryAdminUserDto, UpdateAdminUserDto } from './user.dto';

export interface AdminUserItem {
    id: number;
    name_kh: string;
    name_en: string;
    email: string;
    phone: string;
    role: string;
    department: string;
    position: string;
    avatar?: string | null;
    is_active: number;
    projects_count: number;
    created_at: string;
}

const DEFAULT_USERS: AdminUserItem[] = [
    {
        id: 1,
        name_kh: 'ចេង ច័ន្ទបញ្ញា',
        name_en: 'Chanpanha Cheng',
        email: 'Chanpanhacheng@gmail.com',
        phone: '012 345 678',
        role: 'Admin',
        department: 'ព័ត៌មានវិទ្យា (IT)',
        position: 'Senior Fullstack Engineer',
        avatar: null,
        is_active: 1,
        projects_count: 3,
        created_at: '2026-01-10T08:00:00.000Z',
    },
    {
        id: 2,
        name_kh: 'សុខ សុភា',
        name_en: 'Sok Sopheak',
        email: 'sok.sopheak@gmail.com',
        phone: '089 765 432',
        role: 'Manager',
        department: 'គ្រប់គ្រងគម្រោង (PMO)',
        position: 'Lead Project Manager',
        avatar: null,
        is_active: 1,
        projects_count: 2,
        created_at: '2026-02-01T08:00:00.000Z',
    },
    {
        id: 3,
        name_kh: 'រ័ត្ន វិចិត្រ',
        name_en: 'Rath Vichet',
        email: 'rath.vichet@gmail.com',
        phone: '098 112 233',
        role: 'Member',
        department: 'ហេដ្ឋារចនាសម្ព័ន្ធ (DevOps)',
        position: 'Cloud & Security Specialist',
        avatar: null,
        is_active: 1,
        projects_count: 1,
        created_at: '2026-02-15T08:00:00.000Z',
    },
    {
        id: 4,
        name_kh: 'លី ម៉េងហួរ',
        name_en: 'Ly Menghour',
        email: 'menghour.ly@gmail.com',
        phone: '077 889 900',
        role: 'Team Lead',
        department: 'ព័ត៌មានវិទ្យា (IT)',
        position: 'Backend Lead Architect',
        avatar: null,
        is_active: 1,
        projects_count: 1,
        created_at: '2026-03-01T08:00:00.000Z',
    },
    {
        id: 5,
        name_kh: 'កែវ ធីតា',
        name_en: 'Keo Thida',
        email: 'thida.keo@gmail.com',
        phone: '010 445 566',
        role: 'Member',
        department: 'រចនា និងបទពិសោធន៍ (UI/UX)',
        position: 'Lead UI/UX Designer',
        avatar: null,
        is_active: 1,
        projects_count: 2,
        created_at: '2026-03-10T08:00:00.000Z',
    },
];

@Injectable()
export class AdminUserService {
    private users: AdminUserItem[] = [...DEFAULT_USERS];
    private readonly storeFilePath = path.join(process.cwd(), 'storage', 'admin_users_store.json');

    constructor() {
        this.loadFromDisk();
    }

    private loadFromDisk(): void {
        try {
            if (fs.existsSync(this.storeFilePath)) {
                const raw = fs.readFileSync(this.storeFilePath, 'utf8');
                const data = JSON.parse(raw);
                if (data && Array.isArray(data)) this.users = data;
            }
        } catch (e) {
            console.warn('Failed to load admin users from disk:', e);
        }
    }

    private saveToDisk(): void {
        try {
            const dir = path.dirname(this.storeFilePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.storeFilePath, JSON.stringify(this.users, null, 2), 'utf8');
        } catch (e) {
            console.warn('Failed to save admin users to disk:', e);
        }
    }

    async getUsers(user: UserPayload, query: QueryAdminUserDto) {
        let list = [...this.users];

        if (query.search) {
            const s = query.search.toLowerCase();
            list = list.filter(
                (u) =>
                    u.name_kh.toLowerCase().includes(s) ||
                    u.name_en.toLowerCase().includes(s) ||
                    u.email.toLowerCase().includes(s) ||
                    u.phone.includes(s) ||
                    u.position.toLowerCase().includes(s),
            );
        }

        if (query.role && query.role !== 'all') {
            list = list.filter((u) => u.role.toLowerCase() === query.role!.toLowerCase());
        }

        if (query.department && query.department !== 'all') {
            list = list.filter((u) => u.department.includes(query.department!));
        }

        if (query.status && query.status !== 'all') {
            const val = query.status === 'active' ? 1 : 0;
            list = list.filter((u) => u.is_active === val);
        }

        return {
            status_code: 200,
            message: 'Users retrieved successfully',
            data: {
                results: list,
                total: list.length,
            },
        };
    }

    async createUser(user: UserPayload, dto: CreateAdminUserDto) {
        const newUser: AdminUserItem = {
            id: Date.now(),
            name_kh: dto.name_kh,
            name_en: dto.name_en,
            email: dto.email || `${dto.name_en.toLowerCase().replace(/\s+/g, '.')}@wfm.kh`,
            phone: dto.phone || '012 000 000',
            role: dto.role || 'Member',
            department: dto.department || 'ព័ត៌មានវិទ្យា (IT)',
            position: dto.position || 'Software Engineer',
            avatar: null,
            is_active: 1,
            projects_count: 0,
            created_at: new Date().toISOString(),
        };

        this.users.unshift(newUser);
        this.saveToDisk();

        return {
            status_code: 201,
            message: 'User created successfully',
            data: newUser,
        };
    }

    async updateUser(user: UserPayload, id: number, dto: UpdateAdminUserDto) {
        const index = this.users.findIndex((u) => u.id === Number(id));
        if (index === -1) throw new NotFoundException(`User with ID ${id} not found`);

        this.users[index] = {
            ...this.users[index],
            ...dto,
            name_kh: dto.name_kh ?? this.users[index].name_kh,
            name_en: dto.name_en ?? this.users[index].name_en,
            email: dto.email ?? this.users[index].email,
            phone: dto.phone ?? this.users[index].phone,
            role: dto.role ?? this.users[index].role,
            department: dto.department ?? this.users[index].department,
            position: dto.position ?? this.users[index].position,
            is_active: dto.is_active !== undefined ? dto.is_active : this.users[index].is_active,
        };

        this.saveToDisk();

        return {
            status_code: 200,
            message: 'User updated successfully',
            data: this.users[index],
        };
    }

    async toggleStatus(user: UserPayload, id: number) {
        const index = this.users.findIndex((u) => u.id === Number(id));
        if (index === -1) throw new NotFoundException(`User with ID ${id} not found`);

        this.users[index].is_active = this.users[index].is_active === 1 ? 0 : 1;
        this.saveToDisk();

        return {
            status_code: 200,
            message: 'Status toggled successfully',
            data: this.users[index],
        };
    }

    async deleteUser(user: UserPayload, id: number) {
        const index = this.users.findIndex((u) => u.id === Number(id));
        if (index === -1) throw new NotFoundException(`User with ID ${id} not found`);

        this.users.splice(index, 1);
        this.saveToDisk();

        return {
            status_code: 200,
            message: 'User deleted successfully',
        };
    }
}
