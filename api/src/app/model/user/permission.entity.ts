// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToMany, OneToMany, } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { Role }           from './role.entity';
import { RolePermission } from './role-permission.entity';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'permission', schema: 'user' })
export class Permission {
    @PrimaryGeneratedColumn('uuid') id: string;

    @Column({ type: 'varchar', length: 100 }) module: string;
    @Column({ type: 'varchar', length: 100 }) action: string;
    @Column({ type: 'varchar', length: 150, unique: true }) code: string;
    @Column({ type: 'text', nullable: true }) description: string;
    @CreateDateColumn({ name: 'created_at' }) created_at: Date;

    @ManyToMany(() => Role, (role) => role.permissions) roles: Role[];
    @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission) role_permissions: RolePermission[];
}
