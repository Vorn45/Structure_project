// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Unique, } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { Organization }                 from './organization.entity';
import { User }                         from '../user/users.entity';
import { OrganizationPositionEntity }   from './organization-position.entity';
import { OrganizationOfficeEntity }     from './organization-office.entity';
import { OrganizationMemberStatus }     from 'src/app/enum/pms.enum';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'organization_member', schema: 'organization' })
@Unique(['organization_id', 'user_id'])
export class OrganizationMember {
    @PrimaryGeneratedColumn('uuid') id: string;

    @Column({ type: 'uuid' }) organization_id: string;
    @Column({ type: 'int' }) user_id: number;
    @Column({ type: 'int', nullable: true }) position_id: number | null;
    @Column({ type: 'int', nullable: true }) office_id: number | null;
    @Column({ type: 'int', nullable: true }) manager_id: number | null;
    @Column({ type: 'int', nullable: true }) creator_id: number;
    @Column({ type: 'int', default: 2147483647 }) sort: number;
    @Column({ type: 'enum', enum: OrganizationMemberStatus, default: OrganizationMemberStatus.ACTIVE, }) status: OrganizationMemberStatus;
    @CreateDateColumn({ name: 'joined_at' }) joined_at: Date;
    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;
    @DeleteDateColumn({ name: 'deleted_at' }) deleted_at: Date;

    @ManyToOne(() => Organization, (organization) => organization.members, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' }) organization: Organization;

    @ManyToOne(() => User, (user) => user.organization_members, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) user: User;

    @ManyToOne(() => OrganizationPositionEntity, (position) => position.organization_members, { nullable: true, onDelete: 'RESTRICT', createForeignKeyConstraints: false })
    @JoinColumn({ name: 'position_id' }) organization_position: OrganizationPositionEntity | null;

    @ManyToOne(() => OrganizationOfficeEntity, { nullable: true, onDelete: 'RESTRICT', createForeignKeyConstraints: false })
    @JoinColumn({ name: 'office_id' }) organization_office: OrganizationOfficeEntity | null;
}
