// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';

// ===========================================================================>> Custom Library
import { User } from '../user/users.entity';
import { OrganizationStatus } from 'src/app/enum/pms.enum';
import { OrganizationMember } from './organization-member.entity';
import { OrganizationPositionEntity } from './organization-position.entity';
import { OrganizationOfficeEntity } from './organization-office.entity';
import { OrganizationInvitation } from './organization-invitation.entity';
import { OrganizationTypeEntity } from './organization-type.entity';
import { OrganizationPurposeEntity } from './organization-purpose.entity';
import { File } from '../file/file.entity';
import { OrganizationTelegramGroup } from './organization-telegram-group.entity';
import { OrganizationTelegramChannel } from './organization-telegram-channel.entity';
import { OrganizationTelegramMember } from './organization-telegram-member.entity';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'organization', schema: 'organization' })
export class Organization {
    @PrimaryGeneratedColumn('uuid') id: string;

    @Column({ type: 'varchar', length: 150 }) name_en: string;
    @Column({ type: 'varchar', length: 150 }) name_kh: string;
    @Column({ type: 'varchar', length: 30, nullable: true }) abbreviation: string;
    @Column({ type: 'varchar', length: 150, unique: true }) slug: string;
    @Column({ type: 'varchar', length: 255, nullable: true }) domain: string;
    @Column({ type: 'text', nullable: true }) description: string;
    @Column({ type: 'int', nullable: true }) logo_id: number;
    @Column({ type: 'int', nullable: true }) background_logo_id: number;
    @Column({ type: 'int', nullable: true }) mobile_logo_id: number;
    @Column({ type: 'varchar', length: 20, nullable: true }) primary_color: string;
    @Column({ type: 'int' }) owner_id: number;
    @Column({ type: 'int', nullable: true }) type_id: number;
    @Column({ type: 'int', nullable: true }) purpose_id: number;
    @Column({ type: 'enum', enum: OrganizationStatus, default: OrganizationStatus.ACTIVE }) status: OrganizationStatus;
    @Column({ type: 'int', default: 0 }) sort: number;

    @Column({ type: 'varchar', length: 150, nullable: true }) telegram_bot_name: string;
    @Column({ type: 'varchar', length: 100, nullable: true }) telegram_bot_username: string;
    @Column({ type: 'varchar', length: 100, nullable: true }) telegram_bot_token: string;
    @Column({ type: 'int', nullable: true }) telegram_bot_avatar_id: number;
    @Column({ type: 'varchar', length: 100, nullable: true }) telegram_webhook_secret: string;
    @Column({ type: 'timestamptz', nullable: true }) telegram_bot_updated_at: Date;
    @Column({ type: 'int', nullable: true }) telegram_bot_updated_by: number;

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;
    @DeleteDateColumn({ name: 'deleted_at' }) deleted_at: Date;

    @ManyToOne(() => User, (user) => user.owned_organizations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'owner_id' }) owner: User;

    @ManyToOne(() => OrganizationTypeEntity, (type) => type.organizations, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'type_id' }) type?: OrganizationTypeEntity;

    @ManyToOne(() => OrganizationPurposeEntity, (purpose) => purpose.organizations, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'purpose_id' }) purpose?: OrganizationPurposeEntity;

    @ManyToOne(() => File, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'logo_id' }) logo_file?: File;

    @ManyToOne(() => File, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'background_logo_id' }) background_logo_file?: File;

    @ManyToOne(() => File, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'mobile_logo_id' }) mobile_logo_file?: File;

    @ManyToOne(() => File, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'telegram_bot_avatar_id' }) telegram_bot_avatar_file?: File;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'telegram_bot_updated_by' }) telegram_bot_updater?: User;

    @OneToMany(() => OrganizationMember, (member) => member.organization) members: OrganizationMember[];
    @OneToMany(() => OrganizationPositionEntity, (position) => position.organization) organization_positions: OrganizationPositionEntity[];
    @OneToMany(() => OrganizationOfficeEntity, (office) => office.organization) organization_offices: OrganizationOfficeEntity[];
    @OneToMany(() => OrganizationInvitation, (invitation) => invitation.organization) organization_invitations: OrganizationInvitation[];
    @OneToMany(() => OrganizationTelegramGroup, (group) => group.organization) telegram_groups: OrganizationTelegramGroup[];
    @OneToMany(() => OrganizationTelegramChannel, (channel) => channel.organization) telegram_channels: OrganizationTelegramChannel[];
    @OneToMany(() => OrganizationTelegramMember, (member) => member.organization) telegram_members: OrganizationTelegramMember[];
}
