// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// ===========================================================================>> Custom Library
import { Organization } from './organization.entity';
import { User } from '../user/users.entity';
import { OrganizationPositionEntity } from './organization-position.entity';
import { OrganizationOfficeEntity } from './organization-office.entity';
import { OrganizationInviteLink } from './organization-invite-link.entity';
import { OrganizationInvitationStatus } from 'src/app/enum/pms.enum';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'organization_invitation', schema: 'organization' })
export class OrganizationInvitation {
    @PrimaryGeneratedColumn('uuid') id: string;

    @Column({ type: 'uuid' }) organization_id: string;
    @Column({ type: 'varchar', length: 255 }) email: string;
    @Column({ type: 'varchar', length: 255, unique: true }) token: string;
    @Column({ type: 'int', nullable: true }) position_id: number | null;
    @Column({ type: 'int', nullable: true }) office_id: number | null;
    @Column({ type: 'boolean', default: false }) is_admin: boolean;
    @Column({ type: 'int' }) inviter_id: number;
    @Column({ type: 'enum', enum: OrganizationInvitationStatus, default: OrganizationInvitationStatus.PENDING }) status: OrganizationInvitationStatus;
    @Column({ type: 'timestamptz' }) expires_at: Date;
    @Column({ type: 'timestamptz', nullable: true }) accepted_at: Date | null;
    @Column({ type: 'timestamptz', nullable: true }) declined_at: Date | null;
    @Column({ type: 'uuid', nullable: true }) invite_link_id: string | null;

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;

    @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' }) organization: Organization;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'inviter_id' }) inviter: User;

    @ManyToOne(() => OrganizationPositionEntity, { nullable: true, onDelete: 'SET NULL', createForeignKeyConstraints: false })
    @JoinColumn({ name: 'position_id' }) organization_position: OrganizationPositionEntity | null;

    @ManyToOne(() => OrganizationOfficeEntity, { nullable: true, onDelete: 'SET NULL', createForeignKeyConstraints: false })
    @JoinColumn({ name: 'office_id' }) organization_office: OrganizationOfficeEntity | null;

    @ManyToOne(() => OrganizationInviteLink, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'invite_link_id' }) invite_link: OrganizationInviteLink | null;
}
