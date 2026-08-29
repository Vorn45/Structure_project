import { DataSource } from 'typeorm';
import { Permission } from 'src/app/model/user/permission.entity';

export class PermissionSeeder {
    public static async seed(dataSource: DataSource) {
        const permissionRepo = dataSource.getRepository(Permission);

        const permissions = [
            {
                module: 'organization',
                action: 'create',
                code: 'organization:create',
                description: 'Create organizations',
            },
            {
                module: 'organization',
                action: 'read',
                code: 'organization:read',
                description: 'View organizations',
            },
            {
                module: 'organization',
                action: 'update',
                code: 'organization:update',
                description: 'Update organizations',
            },
            {
                module: 'organization',
                action: 'delete',
                code: 'organization:delete',
                description: 'Delete organizations',
            },
            {
                module: 'project',
                action: 'create',
                code: 'project:create',
                description: 'Create projects',
            },
            {
                module: 'project',
                action: 'read',
                code: 'project:read',
                description: 'View projects',
            },
            {
                module: 'project',
                action: 'update',
                code: 'project:update',
                description: 'Update projects',
            },
            {
                module: 'project',
                action: 'delete',
                code: 'project:delete',
                description: 'Delete projects',
            },
            {
                module: 'task',
                action: 'create',
                code: 'task:create',
                description: 'Create tasks',
            },
            {
                module: 'task',
                action: 'read',
                code: 'task:read',
                description: 'View tasks',
            },
            {
                module: 'task',
                action: 'update',
                code: 'task:update',
                description: 'Update tasks',
            },
            {
                module: 'task',
                action: 'delete',
                code: 'task:delete',
                description: 'Delete tasks',
            },
            {
                module: 'member',
                action: 'invite',
                code: 'member:invite',
                description: 'Invite members',
            },
            {
                module: 'member',
                action: 'remove',
                code: 'member:remove',
                description: 'Remove members',
            },
            {
                module: 'report',
                action: 'read',
                code: 'report:read',
                description: 'View reports',
            },
        ];

        for (const permission of permissions) {
            const exists = await permissionRepo.findOne({
                where: { code: permission.code },
            });

            if (!exists) {
                await permissionRepo.save(permissionRepo.create(permission));
            }
        }

        console.log('\x1b[32mPermission seeded successfully\x1b[0m');
    }
}
