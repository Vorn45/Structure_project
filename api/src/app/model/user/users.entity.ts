// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';

// ===========================================================================>> Custom Library
import { UserRole } from './user_role.entity';
import { UserOTP } from './otp.entity';
import { UserSessions } from './user_sessions.entity';
import { UserSessionLogs } from './user_session_logs.entity';
import { UserDevice } from './user_devices.entity';
import { PasskeyCredential } from './passkey-credential.entity';
import { FcmToken } from './fcm-token.entity';
import { Organization } from '../organization/organization.entity';
import { OrganizationMember } from '../organization/organization-member.entity';
import { OrganizationTelegramMember } from '../organization/organization-telegram-member.entity';
import { AuthProvider } from 'src/app/enum/pms.enum';
import { UserOtpSetting } from './user-otp-setting.entity';
import { File } from '../file/file.entity';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'user', schema: 'user' })
export class User {
    @PrimaryGeneratedColumn() id: number;

    @Column() sex_id: number;
    @Column({ length: 50 }) name_kh: string;
    @Column({ length: 50 }) name_en: string;
    @Column({ length: 225, nullable: true }) phone: string;
    @Column({ length: 225, nullable: true }) email?: string;
    @Column({ length: 100, nullable: true }) password: string;
    @Column({ type: 'timestamp', nullable: true }) password_changed_at: Date;
    @Column({ type: 'timestamp', nullable: true }) last_active_at: Date;
    @Column({ type: 'int', default: 1 }) is_active: number;
    @Column({ type: 'boolean', default: false }) archive: boolean;
    @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL }) auth_provider: AuthProvider;
    @Column({ type: 'varchar', length: 255, nullable: true, unique: true }) google_id?: string;
    @Column({ type: 'varchar', length: 255, nullable: true, unique: true }) sso_id?: string;
    @Column({ type: 'boolean', default: false }) email_verified: boolean;
    @Column({ type: 'varchar', length: 50, nullable: true, unique: true }) telegram_id?: string;
    @Column({ nullable: true }) telegram_username?: string;
    @Column({ type: 'varchar', length: 500, nullable: true }) telegram_photo_url?: string;
    @Column({ type: 'varchar', length: 36, nullable: true }) telegram_session?: string;
    @Column({ type: 'varchar', length: 50, nullable: true }) telegram_pending_chat_id?: string;

    @Column({ type: 'jsonb', nullable: true }) telegram_task_draft?: Record<string, any> | null;

    @Column({ name: 'avatar_id', type: 'int', nullable: true }) avatar_id?: number;
    @Column({ name: 'background_id', type: 'int', nullable: true }) background_id?: number;
    @Column({ type: 'varchar', length: 100, nullable: true }) first_name?: string;
    @Column({ type: 'varchar', length: 100, nullable: true }) last_name?: string;
    @Column({ type: 'date', nullable: true }) date_of_birth?: Date | null;

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;
    @DeleteDateColumn({ name: 'deleted_at' }) deleted_at: Date;

    @OneToMany(() => UserRole, (userRole) => userRole.user) user_roles: UserRole[];

    @OneToMany(() => UserOTP, (otp) => otp.user) otps: UserOTP[];
    @OneToOne(() => UserOtpSetting, (setting) => setting.user) otp_setting: UserOtpSetting;

    @ManyToOne(() => File, (file) => file.user_avatars, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'avatar_id' }) avatar_file?: File;

    @ManyToOne(() => File, (file) => file.user_backgrounds, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'background_id' }) background_file?: File;

    @OneToMany(() => UserDevice, (device) => device.user) user_devices: UserDevice[];
    @OneToMany(() => PasskeyCredential, (credential) => credential.user) passkey_credentials: PasskeyCredential[];
    @OneToMany(() => FcmToken, (fcmToken) => fcmToken.user) fcm_tokens: FcmToken[];
    @OneToMany(() => UserSessions, (session) => session.user) user_sessions: UserSessions[];
    @OneToMany(() => UserSessionLogs, (log) => log.user) user_session_logs: UserSessionLogs[];
    @OneToMany(() => Organization, (organization) => organization.owner) owned_organizations: Organization[];
    @OneToMany(() => OrganizationMember, (member) => member.user) organization_members: OrganizationMember[];
    @OneToMany(() => OrganizationTelegramMember, (member) => member.user) organization_telegram_members: OrganizationTelegramMember[];

    async setPassword(value: string) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(value, salt);
    }
}
