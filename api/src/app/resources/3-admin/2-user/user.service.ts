// ===========================================================================>> Core Library
import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { User } from 'src/app/model/user/users.entity';
import { Role } from 'src/app/model/user/role.entity';
import { UserRole } from 'src/app/model/user/user_role.entity';
import { UserInvitation, InvitationStatus } from 'src/app/model/user/user-invitation.entity';
import { AuthProvider } from 'src/app/enum/pms.enum';
import { PlanService } from '../../2-user/4-plan/plan.service';
import { FileService } from 'src/app/shared/file/file.service';
import { SesService } from 'src/app/shared/mail/ses.service';
import { getDigitechLogo } from 'src/app/shared/mail/templates/mail-assets';
import { appConfig } from 'src/app.config';
import { AcceptInviteDto, CreateAdminUserDto, InviteUserDto, QueryAdminUserDto, QueryInvitationsDto, UpdateAdminUserDto } from './user.dto';

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
    telegram_username?: string | null;
    gender?: string | null;
    date_of_birth?: string | null;
    address?: string | null;
    join_date?: string | null;
    note?: string | null;
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
        telegram_username: '@piseth_p',
        gender: 'male',
        date_of_birth: '1996-05-12',
        address: 'រាជធានីភ្នំពេញ',
        join_date: '2024-01-10',
        note: 'ប្រធានផ្នែកបច្ចេកទេស និងស្ថាបត្យកម្មប្រព័ន្ធ',
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
        telegram_username: '@brusmuny',
        gender: 'male',
        date_of_birth: '1994-08-20',
        address: 'រាជធានីភ្នំពេញ',
        join_date: '2024-01-15',
        note: 'ដឹកនាំគម្រោង និងការគ្រប់គ្រងទូទៅ',
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
        telegram_username: '@thawinner',
        gender: 'male',
        date_of_birth: '1998-11-03',
        address: 'រាជធានីភ្នំពេញ',
        join_date: '2024-02-01',
        note: 'ឯកទេសខាង Angular, Web Architecture',
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
        telegram_username: '@sovannara_devops',
        gender: 'male',
        date_of_birth: '1997-03-15',
        address: 'ខេត្តកណ្ដាល',
        join_date: '2024-02-15',
        note: 'មើលការខុសត្រូវ CI/CD និង Cloud Security',
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
        telegram_username: '@ly_menghour',
        gender: 'male',
        date_of_birth: '1995-09-28',
        address: 'រាជធានីភ្នំពេញ',
        join_date: '2024-03-01',
        note: 'មើលការខុសត្រូវ API & Database Performance',
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
        telegram_username: '@thida_keo',
        gender: 'female',
        date_of_birth: '1999-07-19',
        address: 'ខេត្តសៀមរាប',
        join_date: '2024-03-10',
        note: 'រចនា Design System និងបទពិសោធន៍អ្នកប្រើប្រាស់',
    },
];

@Injectable()
export class AdminUserService implements OnModuleInit {
    private localUsers: AdminUserItem[] = [...DEFAULT_USERS];
    private userMeta: Record<string, {
        department?: string;
        position?: string;
        role?: string;
        projects_count?: number;
        telegram_username?: string;
        gender?: string;
        date_of_birth?: string;
        address?: string;
        join_date?: string;
        note?: string;
        avatar?: string;
    }> = {};
    private readonly metaFilePath = path.join(process.cwd(), 'storage', 'admin_users_meta.json');
    private readonly storeFilePath = path.join(process.cwd(), 'storage', 'admin_users_store.json');

    constructor(
        @InjectRepository(User)
        private readonly _userRepo: Repository<User>,
        @InjectRepository(Role)
        private readonly _roleRepo: Repository<Role>,
        @InjectRepository(UserRole)
        private readonly _userRoleRepo: Repository<UserRole>,
        @InjectRepository(UserInvitation)
        private readonly _invitationRepo: Repository<UserInvitation>,
        private readonly _planService: PlanService,
        private readonly _fileService: FileService,
        private readonly _sesService: SesService,
        private readonly _dataSource: DataSource,
    ) {
        this.loadFromDisk();
    }

    async onModuleInit(): Promise<void> {
        // Initialization without overriding real database roles
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

    getRawUsers(): AdminUserItem[] {
        return this.localUsers;
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

    private sanitizeAvatarUrl(url?: string | null): string | null {
        if (!url) return null;
        const trimmed = url.trim();
        if (!trimmed) return null;
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/(uploads|storage)\//i.test(trimmed)) {
            const stripped = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i, '');
            return `/${stripped.replace(/^\/+/, '')}`;
        }
        return trimmed;
    }

    private formatAvatarUrl(file?: { uri?: string | null; file_domain?: string | null } | null): string | null {
        if (!file || !file.uri) return null;
        const rawUri = file.uri.trim();
        if (!rawUri) return null;

        if (/^https?:\/\//i.test(rawUri)) {
            if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/(uploads|storage)\//i.test(rawUri)) {
                const stripped = rawUri.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i, '');
                return `/${stripped.replace(/^\/+/, '')}`;
            }
            return rawUri;
        }

        let domain = (file.file_domain || '').trim().replace(/\/+$/, '');
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(domain)) {
            domain = '';
        }

        const uri = rawUri.replace(/^\/+/, '');
        return domain ? `${domain}/${uri}` : `/${uri}`;
    }

    private getUserMeta(id: number, email?: string, phone?: string) {
        const key = String(id);
        const normPhone = (phone || '').replace(/\D/g, '');
        const normEmail = (email || '').toLowerCase().trim();

        if (this.userMeta[key]) return this.userMeta[key];
        this.loadFromDisk();
        if (this.userMeta[key]) return this.userMeta[key];
        if (normPhone && this.userMeta[normPhone]) return this.userMeta[normPhone];
        if (normEmail && normEmail !== 'pisethpanhavorn544@gmail.com' && normEmail !== 'pumprusmuny@example.com' && this.userMeta[normEmail]) return this.userMeta[normEmail];

        // Sensible initial mappings for known seed accounts (strictly by phone or ID)
        if (normPhone === '010843612' || id === 5) {
            return {
                role: 'Super Admin',
                department: 'ព័ត៌មានវិទ្យា (IT)',
                position: 'Super Admin Architect',
                projects_count: 2,
                avatar: null,
            };
        }
        if (normPhone === '087280875' || id === 6) {
            return {
                role: 'Super Admin',
                department: 'គ្រប់គ្រងគម្រោង (PMO)',
                position: 'Project Director & Lead',
                projects_count: 2,
                avatar: null,
            };
        }
        if (normPhone === '067776682' || normPhone === '078776682' || id === 7 || id === 8) {
            return {
                role: 'Team Lead',
                department: 'ព័ត៌មានវិទ្យា (IT)',
                position: 'Senior Frontend Architect',
                projects_count: 2,
                avatar: null,
            };
        }
        if (normPhone === '011242425' || id === 9) {
            return {
                role: 'Member',
                department: 'ហេដ្ឋារចនាសម្ព័ន្ធ (DevOps)',
                position: 'Cloud & Security Specialist',
                projects_count: 1,
                avatar: null,
            };
        }

        return {
            role: 'Member',
            department: 'ព័ត៌មានវិទ្យា (IT)',
            position: 'Software Engineer',
            projects_count: 0,
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

                    const projectsCount = assignedProjects.length > 0 ? assignedProjects.length : (meta.projects_count ?? 0);

                    let userAvatarUrl: string | null = null;
                    if (u.avatar_file?.uri) {
                        userAvatarUrl = this.formatAvatarUrl(u.avatar_file);
                    } else if (u.telegram_photo_url) {
                        userAvatarUrl = u.telegram_photo_url;
                    } else if (meta.avatar && !meta.avatar.includes('portrait')) {
                        userAvatarUrl = this.sanitizeAvatarUrl(meta.avatar);
                    }

                    return {
                        id: u.id,
                        name_kh: u.name_kh || u.name_en || 'បុគ្គលិក',
                        name_en: u.name_en || u.name_kh || 'Staff Member',
                        email: u.email || '',
                        phone: u.phone || '',
                        role: detectedRole,
                        department: meta.department || 'ព័ត៌មានវិទ្យា (IT)',
                        position: meta.position || 'Software Engineer',
                        avatar: userAvatarUrl,
                        is_active: u.is_active !== undefined ? u.is_active : 1,
                        projects_count: projectsCount,
                        created_at: u.created_at ? u.created_at.toISOString() : new Date().toISOString(),
                        telegram_username: u.telegram_username || meta.telegram_username || null,
                        gender: meta.gender || (u.sex_id === 2 ? 'female' : 'male'),
                        date_of_birth: meta.date_of_birth || (u.date_of_birth ? new Date(u.date_of_birth).toISOString().split('T')[0] : null),
                        address: meta.address || null,
                        join_date: meta.join_date || (u.created_at ? u.created_at.toISOString().split('T')[0] : null),
                        note: meta.note || null,
                    };
                });
            }
        } catch (err: any) {
            console.warn('[AdminUserService] DB users query failed, using local store:', err?.message || err);
        }

        // Fallback to local store if DB returns empty
        if (list.length === 0) {
            list = [...this.localUsers].map((u) => ({
                ...u,
                avatar: this.sanitizeAvatarUrl(u.avatar),
            }));
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
        let avatarDisplayUrl: string | null = dto.avatar?.trim() || '/images/placeholder/avatar.jpg';

        try {
            const salt = await bcrypt.genSalt(10);
            const plainPassword = dto.password?.trim() || 'wms@1234';
            const passwordHash = await bcrypt.hash(plainPassword, salt);

            const cleanPhone = dto.phone?.trim() || '012 000 000';
            const cleanEmail = (dto.email?.trim() || `${dto.name_en.toLowerCase().replace(/\s+/g, '.')}@wfm.kh`).toLowerCase();

            let storedAvatarId: number | undefined;

            if (dto.avatar && dto.avatar.startsWith('data:image/')) {
                try {
                    const uploaded = await this._fileService.uploadBase64Image('user', dto.avatar);
                    const savedFile = await this._dataSource.transaction(async (manager) => {
                        return await this._fileService.storeFile(manager, uploaded, {
                            ref_table: 'users',
                            fallback_title: `${dto.name_en || 'user'}-avatar`,
                        });
                    });
                    if (savedFile) {
                        storedAvatarId = savedFile.id;
                        avatarDisplayUrl = this.formatAvatarUrl(savedFile);
                    }
                } catch (e) {
                    console.warn('[AdminUserService] Failed to process avatar base64 on create:', e);
                }
            }

            const newUser = this._userRepo.create({
                name_kh: dto.name_kh.trim(),
                name_en: dto.name_en.trim(),
                email: cleanEmail,
                phone: cleanPhone,
                sex_id: dto.gender === 'female' || dto.gender === 'ស្រី' ? 2 : 1,
                date_of_birth: dto.date_of_birth ? new Date(dto.date_of_birth) : undefined,
                telegram_username: dto.telegram_username ? dto.telegram_username.trim() : undefined,
                password: passwordHash,
                is_active: dto.is_active !== undefined ? dto.is_active : 1,
                auth_provider: AuthProvider.LOCAL,
                avatar_id: storedAvatarId,
            });

            const savedUser = await this._userRepo.save(newUser);
            createdId = savedUser.id;

            // Associate Role with is_default: true so the user can immediately log in
            const availableRoles = await this._roleRepo.find();
            let matchedRole: Role | undefined;

            if (dto.role) {
                const targetSlug = dto.role.toLowerCase().replace(/[\s_-]+/g, '');
                matchedRole = availableRoles.find(
                    (r) =>
                        r.slug === targetSlug ||
                        r.slug.replace(/[\s_-]+/g, '') === targetSlug ||
                        r.name_en?.toLowerCase() === dto.role!.toLowerCase() ||
                        r.name_kh === dto.role,
                );

                if (!matchedRole) {
                    if (targetSlug.includes('superadmin') || targetSlug.includes('super')) {
                        matchedRole = availableRoles.find((r) => r.slug === 'superadmin');
                    } else if (targetSlug.includes('admin') || targetSlug === 'administrator') {
                        matchedRole = availableRoles.find((r) => r.slug === 'org_admin' || r.slug === 'admin' || r.slug === 'superadmin');
                    } else {
                        matchedRole = availableRoles.find((r) => r.slug === 'user') || availableRoles.find((r) => r.slug === 'org_user');
                    }
                }
            }

            if (!matchedRole) {
                matchedRole = availableRoles.find((r) => r.slug === 'user') || availableRoles.find((r) => r.slug !== 'superadmin');
            }

            if (matchedRole) {
                await this._userRoleRepo.save(
                    this._userRoleRepo.create({
                        user_id: savedUser.id,
                        role_id: matchedRole.id,
                        is_default: true,
                    }),
                );
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
                avatar: avatarDisplayUrl || dto.avatar || '/images/placeholder/avatar.jpg',
                is_active: savedUser.is_active,
                projects_count: 0,
                created_at: savedUser.created_at ? savedUser.created_at.toISOString() : new Date().toISOString(),
                telegram_username: dto.telegram_username || null,
                gender: dto.gender || 'male',
                date_of_birth: dto.date_of_birth || null,
                address: dto.address || null,
                join_date: dto.join_date || null,
                note: dto.note || null,
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
                avatar: avatarDisplayUrl || dto.avatar || '/images/placeholder/avatar.jpg',
                is_active: dto.is_active !== undefined ? dto.is_active : 1,
                projects_count: 0,
                created_at: new Date().toISOString(),
                telegram_username: dto.telegram_username || null,
                gender: dto.gender || 'male',
                date_of_birth: dto.date_of_birth || null,
                address: dto.address || null,
                join_date: dto.join_date || null,
                note: dto.note || null,
            };
        }

        // Store meta
        this.userMeta[String(createdItem.id)] = {
            role: createdItem.role,
            department: createdItem.department,
            position: createdItem.position,
            projects_count: 0,
            telegram_username: createdItem.telegram_username || undefined,
            gender: createdItem.gender || undefined,
            date_of_birth: createdItem.date_of_birth || undefined,
            address: createdItem.address || undefined,
            join_date: createdItem.join_date || undefined,
            note: createdItem.note || undefined,
            avatar: createdItem.avatar || undefined,
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
                    if (dto.telegram_username !== undefined) dbUser.telegram_username = dto.telegram_username;
                    if (dto.gender !== undefined) dbUser.sex_id = dto.gender === 'female' || dto.gender === 'ស្រី' ? 2 : 1;
                    if (dto.date_of_birth !== undefined) dbUser.date_of_birth = dto.date_of_birth ? new Date(dto.date_of_birth) : null;
                    if (dto.password && dto.password.trim()) {
                        const salt = await bcrypt.genSalt(10);
                        dbUser.password = await bcrypt.hash(dto.password.trim(), salt);
                        dbUser.password_changed_at = new Date();
                    }

                    if (dto.avatar && dto.avatar.startsWith('data:image/')) {
                        try {
                            const uploaded = await this._fileService.uploadBase64Image('user', dto.avatar);
                            const savedFile = await this._dataSource.transaction(async (manager) => {
                                return await this._fileService.storeFile(manager, uploaded, {
                                    ref_table: 'users',
                                    ref_id: String(dbUser.id),
                                    fallback_title: `${dbUser.name_en || 'user'}-avatar`,
                                });
                            });
                            if (savedFile) {
                                dbUser.avatar_id = savedFile.id;
                                dto.avatar = this.formatAvatarUrl(savedFile) || undefined;
                            }
                        } catch (e) {
                            console.warn('[AdminUserService] Failed to process avatar base64 on update:', e);
                        }
                    } else if (dto.avatar === '') {
                        dbUser.avatar_id = null as any;
                        dbUser.avatar_file = null as any;
                    }

                    await this._userRepo.save(dbUser);

                    if (dto.role) {
                        const targetSlug = dto.role.toLowerCase().replace(/[\s_-]+/g, '');
                        const availableRoles = await this._roleRepo.find();
                        let matchedRole = availableRoles.find(
                            (r) =>
                                r.slug === targetSlug ||
                                r.slug.replace(/[\s_-]+/g, '') === targetSlug ||
                                r.name_en?.toLowerCase() === dto.role!.toLowerCase() ||
                                r.name_kh === dto.role,
                        );

                        if (!matchedRole) {
                            if (targetSlug.includes('superadmin') || targetSlug.includes('super')) {
                                matchedRole = availableRoles.find((r) => r.slug === 'superadmin');
                            } else if (targetSlug.includes('admin') || targetSlug === 'administrator') {
                                matchedRole = availableRoles.find((r) => r.slug === 'org_admin' || r.slug === 'admin' || r.slug === 'superadmin');
                            } else {
                                matchedRole = availableRoles.find((r) => r.slug === 'user') || availableRoles.find((r) => r.slug === 'org_user');
                            }
                        }

                        if (!matchedRole) {
                            matchedRole = availableRoles.find((r) => r.slug === 'user') || availableRoles.find((r) => r.slug !== 'superadmin');
                        }

                        if (matchedRole) {
                            const existingUr = await this._userRoleRepo.findOne({
                                where: { user_id: dbUser.id },
                            });
                            if (existingUr) {
                                existingUr.role_id = matchedRole.id;
                                existingUr.is_default = true;
                                await this._userRoleRepo.save(existingUr);
                            } else {
                                await this._userRoleRepo.save(
                                    this._userRoleRepo.create({
                                        user_id: dbUser.id,
                                        role_id: matchedRole.id,
                                        is_default: true,
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
                telegram_username: dto.telegram_username ?? existingMeta.telegram_username,
                gender: dto.gender ?? existingMeta.gender,
                date_of_birth: dto.date_of_birth ?? existingMeta.date_of_birth,
                address: dto.address ?? existingMeta.address,
                join_date: dto.join_date ?? existingMeta.join_date,
                note: dto.note ?? existingMeta.note,
                avatar: dto.avatar ?? existingMeta.avatar,
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
                    avatar: dto.avatar || null,
                    is_active: dto.is_active ?? 1,
                    projects_count: existingMeta.projects_count ?? 0,
                    created_at: new Date().toISOString(),
                    telegram_username: dto.telegram_username || existingMeta.telegram_username || null,
                    gender: dto.gender || existingMeta.gender || 'male',
                    date_of_birth: dto.date_of_birth || existingMeta.date_of_birth || null,
                    address: dto.address || existingMeta.address || null,
                    join_date: dto.join_date || existingMeta.join_date || null,
                    note: dto.note || existingMeta.note || null,
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

    async uploadAvatar(user: UserPayload, id: number, file: any) {
        if (!file?.buffer?.length) {
            throw new BadRequestException('Avatar file is required');
        }

        const dbUser = await this._userRepo.findOne({ where: { id: Number(id) } });
        if (!dbUser) {
            throw new NotFoundException('User not found');
        }

        const uploaded = await this._fileService.uploadMultipartFile('user', file, undefined, 'image');
        const savedFile = await this._dataSource.transaction(async (manager) => {
            return await this._fileService.storeFile(manager, uploaded, {
                ref_table: 'users',
                ref_id: String(id),
                fallback_title: `${dbUser.name_en || 'user'}-avatar`,
            });
        });

        if (savedFile) {
            dbUser.avatar_id = savedFile.id;
            await this._userRepo.save(dbUser);

            const avatarUrl = this.formatAvatarUrl(savedFile) || `/${savedFile.uri.replace(/^\/+/, '')}`;

            // Update local metadata & cache
            this.userMeta[String(id)] = {
                ...this.getUserMeta(id),
                avatar: avatarUrl,
            };
            const localIdx = this.localUsers.findIndex((u) => u.id === Number(id));
            if (localIdx > -1) {
                this.localUsers[localIdx].avatar = avatarUrl;
            }
            this.saveToDisk();

            return {
                status_code: 200,
                message: 'Avatar uploaded successfully',
                data: {
                    id: dbUser.id,
                    avatar: avatarUrl,
                    avatar_id: savedFile.id,
                },
            };
        }

        throw new BadRequestException('Failed to upload avatar');
    }

    // =========================================================================
    // INVITATION MANAGEMENT METHODS
    // =========================================================================

    private buildInviteEmailHtml(params: {
        recipientName: string;
        recipientEmail: string;
        roleName: string;
        department: string;
        inviteLink: string;
        inviterName: string;
    }): string {
        return `
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WMS Digitech - Invitation</title>
    <style>
        * {
            font-family: 'Kantumruy Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
        }
        body {
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            font-family: 'Kantumruy Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
        }
        .container {
            max-width: 580px;
            margin: 36px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
            border: 1px solid #e2e8f0;
            font-family: 'Kantumruy Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        .header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            padding: 36px 32px 30px 32px;
            text-align: center;
        }
        .logo-wrap {
            margin-bottom: 12px;
            text-align: center;
        }
        .logo-img {
            display: inline-block;
            width: 70px;
            height: 70px;
            object-fit: contain;
            vertical-align: middle;
            border-radius: 14px;
        }
        .header h1 {
            color: #ffffff;
            font-size: 23px;
            margin: 10px 0 4px 0;
            font-weight: 700;
            letter-spacing: -0.3px;
            font-family: 'Kantumruy Pro', sans-serif;
        }
        .header p {
            color: #94a3b8;
            font-size: 12px;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1.6px;
            font-weight: 500;
            font-family: 'Kantumruy Pro', sans-serif;
        }
        .content {
            padding: 32px 30px;
            font-family: 'Kantumruy Pro', sans-serif;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 12px;
            font-family: 'Kantumruy Pro', sans-serif;
        }
        .desc {
            font-size: 14.5px;
            line-height: 1.7;
            color: #475569;
            margin-bottom: 24px;
            font-family: 'Kantumruy Pro', sans-serif;
        }
        .invite-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 28px;
            font-family: 'Kantumruy Pro', sans-serif;
        }
        .invite-row {
            display: flex;
            justify-content: space-between;
            padding: 8.5px 0;
            border-bottom: 1px dashed #e2e8f0;
            font-size: 13.5px;
            font-family: 'Kantumruy Pro', sans-serif;
        }
        .invite-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }
        .invite-label {
            color: #64748b;
            font-weight: 500;
            font-family: 'Kantumruy Pro', sans-serif;
        }
        .invite-value {
            color: #0f172a;
            font-weight: 600;
            font-family: 'Kantumruy Pro', sans-serif;
        }
        .btn-wrapper {
            text-align: center;
            margin: 32px 0 24px 0;
        }
        .btn {
            display: inline-block;
            background: #2563eb;
            color: #ffffff !important;
            padding: 14px 36px;
            font-size: 14.5px;
            font-weight: 600;
            text-decoration: none;
            border-radius: 10px;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28);
            font-family: 'Kantumruy Pro', sans-serif;
        }
        .note {
            font-size: 12px;
            color: #94a3b8;
            line-height: 1.6;
            text-align: center;
            margin-top: 16px;
            font-family: 'Kantumruy Pro', sans-serif;
        }
        .footer {
            background: #f8fafc;
            padding: 22px 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #94a3b8;
            font-family: 'Kantumruy Pro', sans-serif;
        }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Kantumruy Pro', sans-serif;">
    <div class="container" style="font-family:'Kantumruy Pro', sans-serif;">
        <div class="header">
            <div class="logo-wrap">
                <img class="logo-img" src="cid:digitech-logo" alt="DIGITECH KH" width="70" height="70" style="display:inline-block; width:70px; height:70px; object-fit:contain; border-radius:14px; vertical-align:middle;" />
            </div>
            <h1 style="font-family:'Kantumruy Pro', sans-serif;">ការអញ្ជើញចូលរួមប្រព័ន្ធ</h1>
            <p style="font-family:'Kantumruy Pro', sans-serif;">WORKFORCE & TASK MANAGEMENT • DIGITECH KH</p>
        </div>
        <div class="content" style="font-family:'Kantumruy Pro', sans-serif;">
            <div class="greeting" style="font-family:'Kantumruy Pro', sans-serif;">សួស្តី ${params.recipientName},</div>
            <div class="desc" style="font-family:'Kantumruy Pro', sans-serif;">
                លោកអ្នកត្រូវបានអញ្ជើញដោយ <strong>${params.inviterName}</strong> ឱ្យចូលរួមក្នុងប្រព័ន្ធ <strong>WMS Digitech Platform</strong>។ សូមចុចប៊ូតុងខាងក្រោមដើម្បីបង្កើតពាក្យសម្ងាត់ និងចូលប្រើប្រាស់គណនីរបស់អ្នក៖
            </div>

            <div class="invite-box" style="font-family:'Kantumruy Pro', sans-serif;">
                <div class="invite-row" style="font-family:'Kantumruy Pro', sans-serif;">
                    <span class="invite-label" style="font-family:'Kantumruy Pro', sans-serif;">អ៊ីមែលអ្នកទទួល (Email):</span>
                    <span class="invite-value" style="font-family:'Kantumruy Pro', sans-serif;">${params.recipientEmail}</span>
                </div>
                <div class="invite-row" style="font-family:'Kantumruy Pro', sans-serif;">
                    <span class="invite-label" style="font-family:'Kantumruy Pro', sans-serif;">តួនាទីដែលបានចាត់តាំង (Role):</span>
                    <span class="invite-value" style="font-family:'Kantumruy Pro', sans-serif;">${params.roleName}</span>
                </div>
                <div class="invite-row" style="font-family:'Kantumruy Pro', sans-serif;">
                    <span class="invite-label" style="font-family:'Kantumruy Pro', sans-serif;">នាយកដ្ឋាន (Department):</span>
                    <span class="invite-value" style="font-family:'Kantumruy Pro', sans-serif;">${params.department}</span>
                </div>
                <div class="invite-row" style="font-family:'Kantumruy Pro', sans-serif;">
                    <span class="invite-label" style="font-family:'Kantumruy Pro', sans-serif;">សុពលភាពតំណភ្ជាប់ (Expires in):</span>
                    <span class="invite-value" style="font-family:'Kantumruy Pro', sans-serif;">7 ថ្ងៃ (7 Days)</span>
                </div>
            </div>

            <div class="btn-wrapper">
                <a href="${params.inviteLink}" class="btn" target="_blank" style="font-family:'Kantumruy Pro', sans-serif;">
                    ទទួលយកការអញ្ជើញ (Accept Invitation) &rarr;
                </a>
            </div>

            <div class="note" style="font-family:'Kantumruy Pro', sans-serif;">
                ចំណាំ៖ ប្រសិនបើលោកអ្នកមិនឃើញអ៊ីមែលក្នុង Inbox សូមពិនិត្យមើលក្នុងប្រអប់ <strong>Spam</strong> ឬ <strong>Promotions</strong>។<br>
                (Note: If you do not see this email in your Inbox, please check your <strong>Spam</strong> or <strong>Promotions</strong> folder.)<br><br>
                ប្រសិនបើលោកអ្នកមិនបានរំពឹងទុកការអញ្ជើញនេះទេ សូមមិនបាច់អើពើចំពោះអ៊ីមែលនេះ។<br>
                If you were not expecting this invitation, you can safely ignore this email.
            </div>
        </div>
        <div class="footer" style="font-family:'Kantumruy Pro', sans-serif;">
            &copy; 2026 WMS Digitech KH. រក្សាសិទ្ធិគ្រប់យ៉ាង។<br>
            ប្រព័ន្ធគ្រប់គ្រងការងារ និងផែនការសម្រេចយុទ្ធសាស្ត្រ
        </div>
    </div>
</body>
</html>`;
    }

    async inviteUser(user: UserPayload, dto: InviteUserDto) {
        const cleanEmail = (dto.email || '').trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@')) {
            throw new BadRequestException('សូមបញ្ចូលអ៊ីមែលឱ្យបានត្រឹមត្រូវ (Please enter a valid email)');
        }

        // 1. Check if user already exists in DB
        const existingUser = await this._userRepo.findOne({
            where: { email: cleanEmail },
        });
        if (existingUser) {
            throw new BadRequestException('គណនីដែលមានអ៊ីមែលនេះមានរួចហើយនៅក្នុងប្រព័ន្ធ (User with this email already exists)');
        }

        // 2. Generate secure token & expiration (7 days)
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // 3. Check for existing pending invitation to update or create new
        let invitation = await this._invitationRepo.findOne({
            where: { email: cleanEmail, status: InvitationStatus.PENDING },
        });

        if (invitation) {
            invitation.token = token;
            invitation.role = dto.role || invitation.role || 'Member';
            invitation.department = dto.department !== undefined ? dto.department : invitation.department;
            invitation.position = dto.position !== undefined ? dto.position : invitation.position;
            invitation.name = dto.name !== undefined ? dto.name : invitation.name;
            invitation.note = dto.note !== undefined ? dto.note : invitation.note;
            invitation.expires_at = expiresAt;
            invitation.invited_by_id = user?.id ? Number(user.id) : null;
        } else {
            invitation = this._invitationRepo.create({
                email: cleanEmail,
                name: dto.name?.trim() || null,
                role: dto.role?.trim() || 'Member',
                department: dto.department?.trim() || null,
                position: dto.position?.trim() || null,
                note: dto.note?.trim() || null,
                token,
                status: InvitationStatus.PENDING,
                invited_by_id: user?.id ? Number(user.id) : null,
                expires_at: expiresAt,
            });
        }

        const savedInvitation = await this._invitationRepo.save(invitation);

        // 4. Construct invite link & email template
        let frontendUrl = (appConfig.APP.FRONTEND_URL || 'https://wms.digitechkh.site').replace(/\/+$/, '');
        if (appConfig.APP.ENV === 'production' || !frontendUrl || frontendUrl.includes('localhost')) {
            frontendUrl = 'https://wms.digitechkh.site';
        }
        const inviteLink = `${frontendUrl}/#/auth/accept-invite?token=${token}`;

        const roleDisplay = savedInvitation.role || 'Member';
        const nameDisplay = savedInvitation.name || cleanEmail.split('@')[0];

        const html = this.buildInviteEmailHtml({
            recipientName: nameDisplay,
            recipientEmail: cleanEmail,
            roleName: roleDisplay,
            department: savedInvitation.department || 'ព័ត៌មានវិទ្យា (IT)',
            inviteLink,
            inviterName: user?.name_kh || user?.name_en || 'អ្នកគ្រប់គ្រងប្រព័ន្ធ',
        });

        const subject = `WMS Digitech - ការអញ្ជើញចូលរួមប្រព័ន្ធ`;
        const text = [
            `WMS Digitech - ការអញ្ជើញចូលរួមប្រព័ន្ធ`,
            `-------------------------------------------`,
            `សួស្តី ${nameDisplay},`,
            `លោកអ្នកត្រូវបានអញ្ជើញដោយ ${user?.name_kh || user?.name_en || 'អ្នកគ្រប់គ្រងប្រព័ន្ធ'} ឱ្យចូលរួមក្នុងប្រព័ន្ធ WMS Digitech Platform ក្នុងតួនាទី ${roleDisplay} (${savedInvitation.department || 'ព័ត៌មានវិទ្យា (IT)'})។`,
            ``,
            `សូមចុចតំណភ្ជាប់ខាងក្រោមដើម្បីទទួលយកការអញ្ជើញ និងកំណត់ពាក្យសម្ងាត់៖`,
            inviteLink,
            ``,
            `សុពលភាពតំណភ្ជាប់៖ 7 ថ្ងៃ`,
            ``,
            `ចំណាំ៖ ប្រសិនបើលោកអ្នកមិនឃើញអ៊ីមែលក្នុង Inbox សូមពិនិត្យមើលក្នុងប្រអប់ Spam ឬ Promotions។`,
            `(Note: If you do not see this email in your Inbox, please check your Spam or Promotions folder.)`,
            ``,
            `ប្រសិនបើលោកអ្នកមិនបានរំពឹងទុកការអញ្ជើញនេះទេ សូមមិនបាច់អើពើចំពោះអ៊ីមែលនេះ។`,
            `-------------------------------------------`,
            `© 2026 WMS Digitech KH`,
        ].join('\n');

        // Send via SMTP
        const sendResult = await this._sesService.send({
            to: cleanEmail,
            subject,
            html,
            text,
            inline_images: [getDigitechLogo()],
        });

        return {
            status_code: 201,
            message: sendResult.success 
                ? 'បានផ្ញើការអញ្ជើញដោយជោគជ័យ (Invitation sent successfully)'
                : `បានរក្សាទុកការអញ្ជើញ ប៉ុន្តែការផ្ញើអ៊ីមែលមិនបានជោគជ័យ: ${sendResult.error}`,
            data: {
                id: savedInvitation.id,
                email: savedInvitation.email,
                name: savedInvitation.name,
                role: savedInvitation.role,
                department: savedInvitation.department,
                status: savedInvitation.status,
                expires_at: savedInvitation.expires_at,
                invite_link: inviteLink,
                email_sent: sendResult.success,
            },
        };
    }

    async getInvitations(query?: QueryInvitationsDto) {
        const where: any = {};
        if (query?.status) {
            where.status = query.status;
        }

        const list = await this._invitationRepo.find({
            where,
            order: { created_at: 'DESC' },
        });

        let frontendUrl = (appConfig.APP.FRONTEND_URL || 'https://wms.digitechkh.site').replace(/\/+$/, '');
        if (appConfig.APP.ENV === 'production' || !frontendUrl || frontendUrl.includes('localhost')) {
            frontendUrl = 'https://wms.digitechkh.site';
        }

        const dataWithLinks = list.map((inv) => ({
            ...inv,
            invite_link: `${frontendUrl}/#/auth/accept-invite?token=${inv.token}`,
        }));

        return {
            status_code: 200,
            data: dataWithLinks,
        };
    }

    async resendInvitation(user: UserPayload, id: string) {
        const invitation = await this._invitationRepo.findOne({ where: { id } });
        if (!invitation) {
            throw new NotFoundException('រកមិនឃើញទិន្នន័យការអញ្ជើញនេះទេ (Invitation not found)');
        }
        if (invitation.status !== InvitationStatus.PENDING) {
            throw new BadRequestException('ការអញ្ជើញនេះមិនស្ថិតក្នុងស្ថានភាពរង់ចាំទេ (Invitation is not pending)');
        }

        invitation.token = crypto.randomBytes(32).toString('hex');
        invitation.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const saved = await this._invitationRepo.save(invitation);

        let frontendUrl = (appConfig.APP.FRONTEND_URL || 'https://wms.digitechkh.site').replace(/\/+$/, '');
        if (appConfig.APP.ENV === 'production' || !frontendUrl || frontendUrl.includes('localhost')) {
            frontendUrl = 'https://wms.digitechkh.site';
        }
        const inviteLink = `${frontendUrl}/#/auth/accept-invite?token=${saved.token}`;

        const html = this.buildInviteEmailHtml({
            recipientName: saved.name || saved.email.split('@')[0],
            recipientEmail: saved.email,
            roleName: saved.role || 'Member',
            department: saved.department || 'ព័ត៌មានវិទ្យា (IT)',
            inviteLink,
            inviterName: user?.name_kh || user?.name_en || 'អ្នកគ្រប់គ្រងប្រព័ន្ធ',
        });

        const text = [
            `WMS Digitech - ការអញ្ជើញចូលរួមប្រព័ន្ធ`,
            `-------------------------------------------`,
            `សួស្តី ${saved.name || saved.email.split('@')[0]},`,
            `លោកអ្នកត្រូវបានអញ្ជើញដោយ ${user?.name_kh || user?.name_en || 'អ្នកគ្រប់គ្រងប្រព័ន្ធ'} ឱ្យចូលរួមក្នុងប្រព័ន្ធ WMS Digitech Platform ក្នុងតួនាទី ${saved.role || 'Member'} (${saved.department || 'ព័ត៌មានវិទ្យា (IT)'})។`,
            ``,
            `សូមចុចតំណភ្ជាប់ខាងក្រោមដើម្បីទទួលយកការអញ្ជើញ និងកំណត់ពាក្យសម្ងាត់៖`,
            inviteLink,
            ``,
            `សុពលភាពតំណភ្ជាប់៖ 7 ថ្ងៃ`,
            ``,
            `ចំណាំ៖ ប្រសិនបើលោកអ្នកមិនឃើញអ៊ីមែលក្នុង Inbox សូមពិនិត្យមើលក្នុងប្រអប់ Spam ឬ Promotions។`,
            `(Note: If you do not see this email in your Inbox, please check your Spam or Promotions folder.)`,
            ``,
            `ប្រសិនបើលោកអ្នកមិនបានរំពឹងទុកការអញ្ជើញនេះទេ សូមមិនបាច់អើពើចំពោះអ៊ីមែលនេះ។`,
            `-------------------------------------------`,
            `© 2026 WMS Digitech KH`,
        ].join('\n');

        const sendResult = await this._sesService.send({
            to: saved.email,
            subject: `WMS Digitech - ការអញ្ជើញចូលរួមប្រព័ន្ធ`,
            html,
            text,
            inline_images: [getDigitechLogo()],
        });

        if (!sendResult.success) {
            throw new BadRequestException(`មិនអាចផ្ញើអ៊ីមែលតាមរយៈ Gmail បានទេ (${sendResult.error})`);
        }

        return {
            status_code: 200,
            message: 'បានផ្ញើការអញ្ជើញសារជាថ្មីដោយជោគជ័យ (Invitation resent successfully)',
            data: {
                ...saved,
                invite_link: inviteLink,
                email_sent: sendResult.success,
            },
        };
    }

    async revokeInvitation(user: UserPayload, id: string) {
        const invitation = await this._invitationRepo.findOne({ where: { id } });
        if (!invitation) {
            throw new NotFoundException('រកមិនឃើញទិន្នន័យការអញ្ជើញនេះទេ (Invitation not found)');
        }

        invitation.status = InvitationStatus.REVOKED;
        await this._invitationRepo.save(invitation);

        return {
            status_code: 200,
            message: 'បានលុបចោលការអញ្ជើញដោយជោគជ័យ (Invitation revoked successfully)',
        };
    }

    async verifyInvitation(token: string) {
        if (!token) {
            throw new BadRequestException('Token មិនត្រឹមត្រូវ');
        }

        const invitation = await this._invitationRepo.findOne({ where: { token } });
        if (!invitation) {
            throw new NotFoundException('តំណភ្ជាប់ការអញ្ជើញមិនត្រឹមត្រូវ ឬត្រូវបានលុបចោល (Invalid invitation link)');
        }

        if (invitation.status === InvitationStatus.REVOKED) {
            throw new BadRequestException('ការអញ្ជើញនេះត្រូវបានលុបចោលដោយអ្នកគ្រប់គ្រង (Invitation was revoked)');
        }

        if (invitation.status === InvitationStatus.ACCEPTED) {
            throw new BadRequestException('ការអញ្ជើញនេះត្រូវបានទទួលរួចរាល់ហើយ (Invitation already accepted)');
        }

        if (new Date() > new Date(invitation.expires_at)) {
            invitation.status = InvitationStatus.EXPIRED;
            await this._invitationRepo.save(invitation);
            throw new BadRequestException('តំណភ្ជាប់ការអញ្ជើញនេះបានផុតកំណត់ហើយ (Invitation link has expired)');
        }

        return {
            status_code: 200,
            data: {
                id: invitation.id,
                email: invitation.email,
                name: invitation.name,
                role: invitation.role,
                department: invitation.department,
                position: invitation.position,
                expires_at: invitation.expires_at,
            },
        };
    }

    async acceptInvitation(dto: AcceptInviteDto) {
        const { token, password, name_kh, name_en, phone } = dto;
        const verification = await this.verifyInvitation(token);
        const invData = verification.data;

        const invitation = await this._invitationRepo.findOne({ where: { token } });
        if (!invitation) {
            throw new NotFoundException('Invitation not found');
        }

        const cleanEmail = invData.email.toLowerCase().trim();

        // Check if user already exists
        const existing = await this._userRepo.findOne({ where: { email: cleanEmail } });
        if (existing) {
            throw new BadRequestException('គណនីដែលមានអ៊ីមែលនេះមានរួចហើយ (User with this email already exists)');
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = this._userRepo.create({
            name_kh: name_kh?.trim() || invData.name || 'បុគ្គលិក',
            name_en: name_en?.trim() || invData.name || 'Staff Member',
            email: cleanEmail,
            phone: phone?.trim() || '012 000 000',
            password: passwordHash,
            is_active: 1,
            auth_provider: AuthProvider.LOCAL,
        });

        const savedUser = await this._userRepo.save(newUser);

        // Assign default role matching invitation.role
        const availableRoles = await this._roleRepo.find();
        let matchedRole: Role | undefined;
        if (invData.role) {
            const targetSlug = invData.role.toLowerCase().replace(/[\s_-]+/g, '');
            matchedRole = availableRoles.find(
                (r) =>
                    r.slug === targetSlug ||
                    r.slug.replace(/[\s_-]+/g, '') === targetSlug ||
                    r.name_en?.toLowerCase().replace(/[\s_-]+/g, '') === targetSlug,
            );
        }
        if (!matchedRole) {
            matchedRole = availableRoles.find((r) => r.slug === 'user' || r.slug === 'member') || availableRoles[0];
        }

        if (matchedRole) {
            const userRole = this._userRoleRepo.create({
                user_id: savedUser.id,
                role_id: matchedRole.id,
                is_default: true,
            });
            await this._userRoleRepo.save(userRole);
        }

        // Mark invitation accepted
        invitation.status = InvitationStatus.ACCEPTED;
        invitation.accepted_at = new Date();
        await this._invitationRepo.save(invitation);

        // Store metadata
        this.userMeta[String(savedUser.id)] = {
            role: invData.role || 'Member',
            department: invData.department || 'ព័ត៌មានវិទ្យា (IT)',
            position: invData.position || 'Staff Member',
            projects_count: 0,
        };
        this.saveToDisk();

        return {
            status_code: 200,
            message: 'គណនីរបស់អ្នកត្រូវបានបង្កើតដោយជោគជ័យ (Account created successfully)',
            data: {
                id: savedUser.id,
                email: savedUser.email,
                name_kh: savedUser.name_kh,
                name_en: savedUser.name_en,
            },
        };
    }
}
