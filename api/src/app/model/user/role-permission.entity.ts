// ===========================================================================>> Third Party Library
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { Role }       from './role.entity';
import { Permission } from './permission.entity';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'role_permission', schema: 'user' })
export class RolePermission {
    @PrimaryColumn({ type: 'int' }) role_id: number;
    @PrimaryColumn({ type: 'uuid' }) permission_id: string;

    @ManyToOne(() => Role, (role) => role.role_permissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'role_id' }) role: Role;

    @ManyToOne(() => Permission, (permission) => permission.role_permissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'permission_id' }) permission: Permission;
}
