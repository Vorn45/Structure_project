// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

// ===========================================================================>> Custom Library
import { Organization } from './organization.entity';
import { User } from '../user/users.entity';
import { OrganizationPositionEntity } from './organization-position.entity';
import { OrganizationOfficeEntity } from './organization-office.entity';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'organization_invite_link', schema: 'organization' })
export class OrganizationInviteLink {
    @PrimaryGeneratedColumn('uuid') id: string;

    @Column({ type: 'uuid' }) organization_id: string;
    @Column({ type: 'varchar', length: 255, unique: true }) code: string;
    @Column({ type: 'varchar', length: 150, nullable: true }) label: string | null;
    @Column({ type: 'int', nullable: true }) position_id: number | null;
    @Column({ type: 'int', nullable: true }) office_id: number | null;
    @Column({ type: 'boolean', default: false }) is_admin: boolean;
    @Column({ type: 'int', nullable: true }) max_uses: number | null;
    @Column({ type: 'int', default: 0 }) used_count: number;
    @Column({ type: 'timestamptz', nullable: true }) expires_at: Date | null;
    @Column({ type: 'boolean', default: true }) is_active: boolean;
    @Column({ type: 'int' }) created_by: number;

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;
    @DeleteDateColumn({ name: 'deleted_at' }) deleted_at: Date;

    @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' }) organization: Organization;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'created_by' }) creator: User;

    @ManyToOne(() => OrganizationPositionEntity, { nullable: true, onDelete: 'SET NULL', createForeignKeyConstraints: false })
    @JoinColumn({ name: 'position_id' }) organization_position: OrganizationPositionEntity | null;

    @ManyToOne(() => OrganizationOfficeEntity, { nullable: true, onDelete: 'SET NULL', createForeignKeyConstraints: false })
    @JoinColumn({ name: 'office_id' }) organization_office: OrganizationOfficeEntity | null;
}
