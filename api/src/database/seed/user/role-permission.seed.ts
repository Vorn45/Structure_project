import { DataSource } from 'typeorm';
import { Permission } from 'src/app/model/user/permission.entity';
import { RolePermission } from 'src/app/model/user/role-permission.entity';
import { Role } from 'src/app/model/user/role.entity';

export class RolePermissionSeeder {
    public static async seed(dataSource: DataSource) {
        const roleRepo = dataSource.getRepository(Role);
        const permissionRepo = dataSource.getRepository(Permission);
        const rolePermissionRepo = dataSource.getRepository(RolePermission);

        const roles = await roleRepo.find({
            where: [{ slug: 'org_admin' }, { slug: 'superadmin' }],
        });
        const permissions = await permissionRepo.find();

        if (!roles.length) {
            console.log(
                '\x1b[33mRole permission seed skipped because privileged roles are missing.\x1b[0m',
            );
            return;
        }

        for (const role of roles) {
            for (const permission of permissions) {
                const exists = await rolePermissionRepo.findOne({
                    where: {
                        role_id: role.id,
                        permission_id: permission.id,
                    },
                });

                if (!exists) {
                    await rolePermissionRepo.save(
                        rolePermissionRepo.create({
                            role_id: role.id,
                            permission_id: permission.id,
                        }),
                    );
                }
            }
        }

        console.log('\x1b[32mRole permission seeded successfully\x1b[0m');
    }
}
