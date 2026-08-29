// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';
import { OneToMany }                                                     from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { UserRole }        from './user_role.entity';
import { Permission }      from './permission.entity';
import { RolePermission }  from './role-permission.entity';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'role', schema: 'user' })
export class Role {
    @PrimaryGeneratedColumn() id: number;

    @Column({ length: 100 }) name_kh: string;
    @Column({ length: 100 }) name_en: string;
    @Column({ length: 100 }) slug: string;
    @Column({ length: 100, nullable: true }) icon: string;
    @Column({ length: 100, nullable: true }) color: string;

    @OneToMany(() => UserRole, (userRole) => userRole.role) user_roles: UserRole[];

    @ManyToMany(() => Permission, (permission) => permission.roles)
    @JoinTable({ name: 'role_permission', joinColumn: { name: 'role_id', referencedColumnName: 'id' }, inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id', }, }) permissions: Permission[];

    @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role) role_permissions: RolePermission[];
}
