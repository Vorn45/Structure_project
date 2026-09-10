// ===========================================================================>> Core Library
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { User } from 'src/app/model/user/users.entity';
import { Role } from 'src/app/model/user/role.entity';
import { UserRole } from 'src/app/model/user/user_role.entity';
import { AuthProvider } from 'src/app/enum/pms.enum';
import { PlanService } from '../../2-user/4-plan/plan.service';
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
        name_kh: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត',
        name_en: 'Piseth Panhavorn',
        email: 'pisethpanhavorn544@gmail.com',
        phone: '010 843 612',
        role: 'Super Admin',
        department: 'ព័ត៌មានវិទ្យា (IT)',
        position: 'Super Admin Architect',
        avatar: null,
        is_active: 1,
        projects_count: 2,
        created_at: '2026-01-10T08:00:00.000Z',
    },
    {
        id: 2,
        name_kh: 'ពុំ ប្រុសមុន្នី',
        name_en: 'Pum Brusmuny',
        email: 'pumprusmuny@example.com',
        phone: '087 280 875',
        role: 'Super Admin',
        department: 'គ្រប់គ្រងគម្រោង (PMO)',
        position: 'Project Director & Lead',
        avatar: null,
        is_active: 1,
        projects_count: 2,
        created_at: '2026-01-15T08:00:00.000Z',
    },
    {
        id: 3,
        name_kh: 'ថា វីនណឺរ',
        name_en: 'Tha Winner',
        email: 'thawinner@example.com',
        phone: '067 776 682',
        role: 'Team Lead',
        department: 'ព័ត៌មានវិទ្យា (IT)',
        position: 'Senior Frontend Architect',
        avatar: null,
        is_active: 1,
        projects_count: 2,
        created_at: '2026-02-01T08:00:00.000Z',
    },
    {
        id: 4,
        name_kh: 'ភួង សុវណ្ណារ៉ា',
        name_en: 'Phuong Sovannara',
        email: 'phuongsovannara@gmail.com',
        phone: '011 242 425',
        role: 'Member',
        department: 'ហេដ្ឋារចនាសម្ព័ន្ធ (DevOps)',
        position: 'Cloud & Security Specialist',
        avatar: null,
        is_active: 1,
        projects_count: 1,
        created_at: '2026-02-15T08:00:00.000Z',
    },
    {
        id: 5,
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
        id: 6,
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
    private localUsers: AdminUserItem[] = [...DEFAULT_USERS];
    private userMeta: Record<string, { department?: string; position?: string; role?: string; projects_count?: number }> = {};
    private readonly metaFilePath = path.join(process.cwd(), 'storage', 'admin_users_meta.json');
    private readonly storeFilePath = path.join(process.cwd(), 'storage', 'admin_users_store.json');

    constructor(
        @InjectRepository(User)
        private readonly _userRepo: Repository<User>,
        @InjectRepository(Role)
        private readonly _roleRepo: Repository<Role>,
        @InjectRepository(UserRole)
        private readonly _userRoleRepo: Repository<UserRole>,
        private readonly _planService: PlanService,
    ) {
        this.loadFromDisk();
    }

    private loadFromDisk(): void {
        try {
            if (fs.existsSync(this.metaFilePath)) {
                const rawMeta = fs.readFileSync(this.metaFilePath, 'utf8');
                this.userMeta = JSON.parse(rawMeta);
            }
        } catch (e) {
            console.warn('Failed to load admin user meta:', e);
        }

        try {
            if (fs.existsSync(this.storeFilePath)) {
                const raw = fs.readFileSync(this.storeFilePath, 'utf8');
                const data = JSON.parse(raw);
                if (data && Array.isArray(data) && data.length > 0) this.localUsers = data;
            }
        } catch (e) {
            console.warn('Failed to load admin users from disk:', e);
        }
    }

    private saveToDisk(): void {
        try {
            const dir = path.dirname(this.storeFilePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.storeFilePath, JSON.stringify(this.localUsers, null, 2), 'utf8');
            fs.writeFileSync(this.metaFilePath, JSON.stringify(this.userMeta, null, 2), 'utf8');
        } catch (e) {
            console.warn('Failed to save admin users to disk:', e);
        }
    }

    private getUserMeta(id: number, email?: string, phone?: string) {
        const key = String(id);
        const normPhone = (phone || '').replace(/\D/g, '');
        const normEmail = (email || '').toLowerCase().trim();

        if (this.userMeta[key]) return this.userMeta[key];
        if (normPhone && this.userMeta[normPhone]) return this.userMeta[normPhone];
        if (normEmail && this.userMeta[normEmail]) return this.userMeta[normEmail];

        // Sensible initial mappings for known seed accounts
        if (normPhone === '010843612' || normEmail === 'pisethpanhavorn544@gmail.com') {
            return {
                role: 'Super Admin',
                department: 'ព័ត៌មានវិទ្យា (IT)',
                position: 'Super Admin Architect',
                projects_count: 2,
            };
        }
        if (normPhone === '087280875' || normEmail === 'pumprusmuny@example.com') {
            return {
                role: 'Super Admin',
                department: 'គ្រប់គ្រងគម្រោង (PMO)',
                position: 'Project Director & Lead',
                projects_count: 2,
            };
        }
        if (normPhone === '067776682' || normEmail === 'thawinner@example.com') {
            return {
                role: 'Team Lead',
                department: 'ព័ត៌មានវិទ្យា (IT)',
                position: 'Senior Frontend Architect',
                projects_count: 2,
            };
        }
        if (normPhone === '011242425' || normEmail === 'phuongsovannara@gmail.com') {
            return {
                role: 'Member',
                department: 'ហេដ្ឋារចនាសម្ព័ន្ធ (DevOps)',
                position: 'Cloud & Security Specialist',
                projects_count: 1,
            };
        }

        return {
            role: 'Member',
            department: 'ព័ត៌មានវិទ្យា (IT)',
            position: 'Software Engineer',
            projects_count: 1,
        };
    }

    async getUsers(user: UserPayload, query: QueryAdminUserDto) {
        let list: AdminUserItem[] = [];

        try {
            const dbUsers = await this._userRepo.find({
                relations: {
                    avatar_file: true,
                    user_roles: {
                        role: true,
                    },
                },
                order: { id: 'ASC' },
            });

            if (dbUsers && dbUsers.length > 0) {
                const rawProjects = this._planService?.getRawProjects?.() || [];

                list = dbUsers.map((u) => {
                    // Derive role
                    const meta = this.getUserMeta(u.id, u.email, u.phone);
                    let detectedRole = meta.role || 'Member';

                    const roleSlugs = (u.user_roles || []).map((ur) => ur.role?.slug?.toLowerCase() || '');
                    if (roleSlugs.includes('superadmin') || roleSlugs.includes('super_admin')) {
                        detectedRole = 'Super Admin';
                    } else if (roleSlugs.includes('manager') || roleSlugs.includes('admin')) {
                        detectedRole = 'Manager';
                    } else if (roleSlugs.includes('lead') || roleSlugs.includes('team_lead')) {
                        detectedRole = 'Team Lead';
                    }

                    // Calculate real project assignments
                    const userPhoneNorm = (u.phone || '').replace(/\D/g, '');
                    const userEmailNorm = (u.email || '').toLowerCase().trim();

                    const assignedProjects = rawProjects.filter((p) => {
                        return (p.members || []).some((m: any) => {
                            if (m.id && String(m.id) === String(u.id)) return true;
                            if (m.email && userEmailNorm && m.email.toLowerCase().trim() === userEmailNorm) return true;
                            if (m.phone && userPhoneNorm && m.phone.replace(/\D/g, '') === userPhoneNorm) return true;
                            if (m.name && (m.name === u.name_kh || m.name === u.name_en)) return true;
                            return false;
                        });
                    });

                    const projectsCount = assignedProjects.length > 0 ? assignedProjects.length : (meta.projects_count ?? 1);

                    return {
                        id: u.id,
                        name_kh: u.name_kh || u.name_en || 'បុគ្គលិក',
                        name_en: u.name_en || u.name_kh || 'Staff Member',
                        email: u.email || '',
                        phone: u.phone || '',
                        role: detectedRole,
                        department: meta.department || 'ព័ត៌មានវិទ្យា (IT)',
                        position: meta.position || 'Software Engineer',
                        avatar: u.avatar_file?.uri || u.telegram_photo_url || null,
                        is_active: u.is_active !== undefined ? u.is_active : 1,
                        projects_count: projectsCount,
                        created_at: u.created_at ? u.created_at.toISOString() : new Date().toISOString(),
                    };
                });
            }
        } catch (err: any) {
            console.warn('[AdminUserService] DB users query failed, using local store:', err?.message || err);
        }

        // Fallback to local store if DB returns empty
        if (list.length === 0) {
            list = [...this.localUsers];
        }

        // Apply filters
        if (query.search) {
            const s = query.search.toLowerCase().trim();
            list = list.filter(
                (u) =>
                    u.name_kh.toLowerCase().includes(s) ||
                    u.name_en.toLowerCase().includes(s) ||
                    u.email.toLowerCase().includes(s) ||
                    u.phone.includes(s) ||
                    u.position.toLowerCase().includes(s) ||
                    u.department.toLowerCase().includes(s),
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
        let createdId = Date.now();
        let createdItem: AdminUserItem | null = null;

        try {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('wms@1234', salt);

            const newUser = this._userRepo.create({
                name_kh: dto.name_kh,
                name_en: dto.name_en,
                email: dto.email || `${dto.name_en.toLowerCase().replace(/\s+/g, '.')}@wfm.kh`,
                phone: dto.phone || '012 000 000',
                sex_id: 1,
                password: passwordHash,
                is_active: dto.is_active !== undefined ? dto.is_active : 1,
                auth_provider: AuthProvider.LOCAL,
            });

            const savedUser = await this._userRepo.save(newUser);
            createdId = savedUser.id;

            // Associate Role
            if (dto.role) {
                const targetSlug = dto.role.toLowerCase().replace(/\s+/g, '');
                const availableRoles = await this._roleRepo.find();
                const matchedRole = availableRoles.find(
                    (r) => r.slug === targetSlug || r.name_en?.toLowerCase() === dto.role.toLowerCase(),
                );
                if (matchedRole) {
                    await this._userRoleRepo.save(
                        this._userRoleRepo.create({
                            user_id: savedUser.id,
                            role_id: matchedRole.id,
                        }),
                    );
                }
            }

            createdItem = {
                id: savedUser.id,
                name_kh: savedUser.name_kh,
                name_en: savedUser.name_en,
                email: savedUser.email || '',
                phone: savedUser.phone || '',
                role: dto.role || 'Member',
                department: dto.department || 'ព័ត៌មានវិទ្យា (IT)',
                position: dto.position || 'Software Engineer',
                avatar: null,
                is_active: savedUser.is_active,
                projects_count: 0,
                created_at: savedUser.created_at ? savedUser.created_at.toISOString() : new Date().toISOString(),
            };
        } catch (err: any) {
            console.warn('[AdminUserService] DB user creation failed, saving to local store:', err?.message || err);
        }

        if (!createdItem) {
            createdItem = {
                id: createdId,
                name_kh: dto.name_kh,
                name_en: dto.name_en,
                email: dto.email || `${dto.name_en.toLowerCase().replace(/\s+/g, '.')}@wfm.kh`,
                phone: dto.phone || '012 000 000',
                role: dto.role || 'Member',
                department: dto.department || 'ព័ត៌មានវិទ្យា (IT)',
                position: dto.position || 'Software Engineer',
                avatar: null,
                is_active: dto.is_active !== undefined ? dto.is_active : 1,
                projects_count: 0,
                created_at: new Date().toISOString(),
            };
        }

        // Store meta
        this.userMeta[String(createdItem.id)] = {
            role: createdItem.role,
            department: createdItem.department,
            position: createdItem.position,
            projects_count: 0,
        };

        this.localUsers.unshift(createdItem);
        this.saveToDisk();

        return {
            status_code: 201,
            message: 'User created successfully',
            data: createdItem,
        };
    }

    async updateUser(user: UserPayload, id: number, dto: UpdateAdminUserDto) {
        let updatedItem: AdminUserItem | null = null;

        try {
            const dbUser = await this._userRepo.findOne({
                where: { id: Number(id) },
                relations: { user_roles: { role: true } },
            });

            if (dbUser) {
                if (dto.name_kh !== undefined) dbUser.name_kh = dto.name_kh;
                if (dto.name_en !== undefined) dbUser.name_en = dto.name_en;
                if (dto.email !== undefined) dbUser.email = dto.email;
                if (dto.phone !== undefined) dbUser.phone = dto.phone;
                if (dto.is_active !== undefined) dbUser.is_active = dto.is_active;

                await this._userRepo.save(dbUser);

                if (dto.role) {
                    const targetSlug = dto.role.toLowerCase().replace(/\s+/g, '');
                    const availableRoles = await this._roleRepo.find();
                    const matchedRole = availableRoles.find(
                        (r) => r.slug === targetSlug || r.name_en?.toLowerCase() === dto.role!.toLowerCase(),
                    );
                    if (matchedRole) {
                        const existingUr = await this._userRoleRepo.findOne({
                            where: { user_id: dbUser.id },
                        });
                        if (existingUr) {
                            existingUr.role_id = matchedRole.id;
                            await this._userRoleRepo.save(existingUr);
                        } else {
                            await this._userRoleRepo.save(
                                this._userRoleRepo.create({
                                    user_id: dbUser.id,
                                    role_id: matchedRole.id,
                                }),
                            );
                        }
                    }
                }
            }
        } catch (err: any) {
            console.warn('[AdminUserService] DB user update failed:', err?.message || err);
        }

        // Update local metadata
        const existingMeta = this.getUserMeta(id);
        this.userMeta[String(id)] = {
            ...existingMeta,
            department: dto.department ?? existingMeta.department,
            position: dto.position ?? existingMeta.position,
            role: dto.role ?? existingMeta.role,
        };

        const localIdx = this.localUsers.findIndex((u) => u.id === Number(id));
        if (localIdx > -1) {
            this.localUsers[localIdx] = {
                ...this.localUsers[localIdx],
                ...dto,
                department: dto.department ?? this.localUsers[localIdx].department,
                position: dto.position ?? this.localUsers[localIdx].position,
                role: dto.role ?? this.localUsers[localIdx].role,
            };
            updatedItem = this.localUsers[localIdx];
        } else {
            updatedItem = {
                id: Number(id),
                name_kh: dto.name_kh || '',
                name_en: dto.name_en || '',
                email: dto.email || '',
                phone: dto.phone || '',
                role: dto.role || existingMeta.role || 'Member',
                department: dto.department || existingMeta.department || 'ព័ត៌មានវិទ្យា (IT)',
                position: dto.position || existingMeta.position || 'Software Engineer',
                avatar: null,
                is_active: dto.is_active ?? 1,
                projects_count: existingMeta.projects_count ?? 1,
                created_at: new Date().toISOString(),
            };
            this.localUsers.unshift(updatedItem);
        }

        this.saveToDisk();

        return {
            status_code: 200,
            message: 'User updated successfully',
            data: updatedItem,
        };
    }

    async toggleStatus(user: UserPayload, id: number) {
        let newStatus = 1;

        try {
            const dbUser = await this._userRepo.findOne({ where: { id: Number(id) } });
            if (dbUser) {
                dbUser.is_active = dbUser.is_active === 1 ? 0 : 1;
                await this._userRepo.save(dbUser);
                newStatus = dbUser.is_active;
            }
        } catch (err: any) {
            console.warn('[AdminUserService] DB toggle status failed:', err?.message || err);
        }

        const localIdx = this.localUsers.findIndex((u) => u.id === Number(id));
        if (localIdx > -1) {
            this.localUsers[localIdx].is_active = this.localUsers[localIdx].is_active === 1 ? 0 : 1;
            newStatus = this.localUsers[localIdx].is_active;
            this.saveToDisk();
            return {
                status_code: 200,
                message: `Status changed to ${newStatus === 1 ? 'Active' : 'Suspended'}`,
                data: this.localUsers[localIdx],
            };
        }

        return {
            status_code: 200,
            message: `Status changed to ${newStatus === 1 ? 'Active' : 'Suspended'}`,
            data: { id: Number(id), is_active: newStatus },
        };
    }

    async deleteUser(user: UserPayload, id: number) {
        try {
            await this._userRoleRepo.delete({ user_id: Number(id) });
            await this._userRepo.delete(Number(id));
        } catch (err: any) {
            console.warn('[AdminUserService] DB user deletion failed:', err?.message || err);
        }

        const localIdx = this.localUsers.findIndex((u) => u.id === Number(id));
        if (localIdx > -1) {
            this.localUsers.splice(localIdx, 1);
        }
        delete this.userMeta[String(id)];
        this.saveToDisk();

        return {
            status_code: 200,
            message: 'User deleted successfully',
        };
    }
}
