// ===========================================================================>> Third Party Library
import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { Organization } from '../organization/organization.entity';
import { Role }         from './role.entity';
import { User }          from './users.entity';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'user_role', schema: 'user' })
@Index('UQ_user_role_no_org', ['user_id', 'role_id'], { unique: true, where: '"organization_id" IS NULL' })
@Index('UQ_user_role_with_org', ['user_id', 'role_id', 'organization_id'], { unique: true, where: '"organization_id" IS NOT NULL' })
@Index('UQ_user_role_one_default', ['user_id'], { unique: true, where: '"is_default" IS TRUE' })
export class UserRole {
    @PrimaryGeneratedColumn() id: number;

    @Column({ type: 'int' }) user_id: number;
    @Column({ type: 'int' }) role_id: number;
    @Column({ type: 'uuid', nullable: true }) organization_id: string | null;
    @Column({ type: 'boolean', default: false }) is_default: boolean;
    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;
    @DeleteDateColumn({ name: 'deleted_at' }) deleted_at: Date;

    @ManyToOne(() => User, (user) => user.user_roles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) user: User;

    @ManyToOne(() => Role, (role) => role.user_roles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'role_id' }) role: Role;

    @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' }) organization: Organization | null;
}
