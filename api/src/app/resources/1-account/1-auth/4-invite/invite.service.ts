import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import type { Request } from 'express';

import { User } from 'src/app/model/user/users.entity';
import { Role } from 'src/app/model/user/role.entity';
import { UserRole } from 'src/app/model/user/user_role.entity';
import { UserInvitation, InvitationStatus } from 'src/app/model/user/user-invitation.entity';
import { AuthProvider } from 'src/app/enum/pms.enum';
import { AuthSessionService } from 'src/app/shared/auth/auth-session.service';
import { AcceptInviteDto } from 'src/app/resources/3-admin/2-user/user.dto';

@Injectable()
export class InviteService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepo: Repository<Role>,
        @InjectRepository(UserRole)
        private readonly userRoleRepo: Repository<UserRole>,
        @InjectRepository(UserInvitation)
        private readonly invitationRepo: Repository<UserInvitation>,
        private readonly authSessionService: AuthSessionService,
    ) {}

    async verify(token: string) {
        if (!token) {
            throw new BadRequestException('Token មិនត្រឹមត្រូវ (Token is required)');
        }

        const invitation = await this.invitationRepo.findOne({ where: { token } });
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
            await this.invitationRepo.save(invitation);
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
                company_name: 'ក្រុមហ៊ុន ឌីជីថេក ខេអេច ឯ.ក',
                company_name_en: 'Digitech KH Co., Ltd.',
            },
        };
    }

    async accept(dto: AcceptInviteDto, req: Request) {
        const { token, password, name_kh, name_en, phone, gender } = dto;
        const verification = await this.verify(token);
        const invData = verification.data;

        const invitation = await this.invitationRepo.findOne({ where: { token } });
        if (!invitation) {
            throw new NotFoundException('Invitation not found');
        }

        const cleanEmail = invData.email.toLowerCase().trim();

        // Check if user already exists
        const existing = await this.userRepo.findOne({ where: { email: cleanEmail } });
        if (existing) {
            throw new BadRequestException('គណនីដែលមានអ៊ីមែលនេះមានរួចហើយនៅក្នុងប្រព័ន្ធ (Account with this email already exists)');
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const sexId = gender === 'female' || gender === 'ស្រី' || gender === '2' ? 2 : 1;

        const newUser = this.userRepo.create({
            name_kh: name_kh?.trim() || invData.name || 'បុគ្គលិក',
            name_en: name_en?.trim() || invData.name || 'Staff Member',
            email: cleanEmail,
            phone: phone?.trim() || '012 000 000',
            password: passwordHash,
            is_active: 1,
            auth_provider: AuthProvider.LOCAL,
            sex_id: sexId,
        });

        const savedUser = await this.userRepo.save(newUser);

        // Assign role
        const availableRoles = await this.roleRepo.find();
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
            const userRole = this.userRoleRepo.create({
                user_id: savedUser.id,
                role_id: matchedRole.id,
                is_default: true,
            });
            await this.userRoleRepo.save(userRole);
        }

        // Mark invitation accepted
        invitation.status = InvitationStatus.ACCEPTED;
        invitation.accepted_at = new Date();
        await this.invitationRepo.save(invitation);

        // Fetch user with relations for auth session
        const fullUser = await this.userRepo.findOne({
            where: { id: savedUser.id },
            relations: ['avatar_file', 'user_roles', 'user_roles.role'],
        });

        // Create auth session so user is logged in immediately
        const session = await this.authSessionService.createLoginResponse(fullUser || savedUser, req, {
            login_method: 1,
            create_history: true,
        });

        return {
            status_code: 200,
            message: 'គណនីរបស់អ្នកត្រូវបានបង្កើតដោយជោគជ័យ (Account created successfully)',
            data: {
                ...session,
                user: {
                    id: savedUser.id,
                    email: savedUser.email,
                    name_kh: savedUser.name_kh,
                    name_en: savedUser.name_en,
                },
            },
        };
    }
}
