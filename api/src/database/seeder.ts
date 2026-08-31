import * as readline from 'readline';
import { DataSource } from 'typeorm';
import { typeOrmConfig, ENTITY_SCHEMAS } from 'src/config/database.config';
import { DataSourceOptions } from 'typeorm';
import { PermissionSeeder } from './seed/user/permission.seed';
import { RolePermissionSeeder } from './seed/user/role-permission.seed';
import { RoleSeeder } from './seed/user/role.seed';
import { UserOTPSeeder } from './seed/user/user-otp.seed';
import { UserSessionLogSeeder } from './seed/user/user-session-log.seed';
import { UserSessionSeeder } from './seed/user/user-session.seed';
import { UserSeeder } from './seed/user/user.seed';
import { UserRoleSeeder } from './seed/user/user_role.seed';

function confirm(question: string): Promise<boolean> {
    if (process.argv.includes('--yes') || process.argv.includes('-y')) {
        return Promise.resolve(true);
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase() === 'y');
        });
    });
}

class SeederInitializer {
    constructor(private readonly dataSource: DataSource) {}

    private async ensureSchemas() {
        for (const schema of ENTITY_SCHEMAS) {
            await this.dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
        }
    }

    private async ensureSchemaReady() {
        await this.ensureSchemas();

        const tables: Array<{ table_name: string }> = await this.dataSource
            .query(`
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = ANY($1) AND table_type = 'BASE TABLE'
            `, [[...ENTITY_SCHEMAS, 'public']]);

        const hasRoleTable = tables.some(
            (table) => table.table_name === 'role',
        );

        if (hasRoleTable) {
            console.log(
                '\x1b[33mSynchronizing current entity schema before seeding...\x1b[0m',
            );
            await this.dataSource.synchronize();
            console.log('\x1b[32mSchema synchronized successfully.\x1b[0m');
            return;
        }

        if (tables.length === 0) {
            console.log(
                '\x1b[33mNo database tables found. Synchronizing schema before seeding...\x1b[0m',
            );
            await this.dataSource.synchronize();
            console.log('\x1b[32mSchema synchronized successfully.\x1b[0m');
            return;
        }

        throw new Error(
            'Database schema is missing the role table. Run npm run migrate before npm run seeder.',
        );
    }

    async seedData() {
        try {
            if (!this.dataSource.isInitialized) {
                await this.dataSource.initialize();
            }

            await this.ensureSchemaReady();

            await RoleSeeder.seed(this.dataSource);
            await UserSeeder.seed(this.dataSource);
            await PermissionSeeder.seed(this.dataSource);
            await RolePermissionSeeder.seed(this.dataSource);
            await UserRoleSeeder.seed(this.dataSource);
            await UserOTPSeeder.seed(this.dataSource);
            await UserSessionSeeder.seed(this.dataSource);
            await UserSessionLogSeeder.seed(this.dataSource);

            console.log('\x1b[32mAll user security seeders executed successfully.\x1b[0m');
        } catch (error) {
            console.error('\x1b[31mSeeder failed:\x1b[0m', error);
        } finally {
            if (this.dataSource.isInitialized) {
                await this.dataSource.destroy();
            }
        }
    }
}

(async () => {
    const proceed = await confirm(
        '\x1b[33mThis will synchronize the schema and seed the database, which may overwrite/modify existing data. Continue? (y/N): \x1b[0m',
    );

    if (!proceed) {
        console.log('\x1b[31mSeeding cancelled.\x1b[0m');
        process.exit(0);
    }

    const seederInitializer = new SeederInitializer(
        new DataSource({
            ...(typeOrmConfig as DataSourceOptions),
            synchronize: false,
        }),
    );
    await seederInitializer.seedData();
})();
