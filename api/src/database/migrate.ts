import * as readline from 'readline';
import { DataSource, DataSourceOptions } from 'typeorm';
import { typeOrmConfig, ENTITY_SCHEMAS } from 'src/config/database.config';
import { appConfig } from 'src/app.config';

const ALLOWED_ENVS = ['development', 'local', 'dev'];

function ask(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) =>
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        }),
    );
}

class MigrationInitializer {
    constructor(private readonly dataSource: DataSource) {}

    private async confirmMigration(): Promise<boolean> {
        if (!this.dataSource.isInitialized) {
            await this.dataSource.initialize();
        }

        const tables: Array<{ table_name: string }> = await this.dataSource.query(`
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = ANY($1) AND table_type = 'BASE TABLE'
        `, [[...ENTITY_SCHEMAS, 'public']]);

        const hasExistingTables = tables.length > 0;

        if (hasExistingTables) {
            const answer = await ask(
                '\x1b[33mThis will synchronize the schema against existing tables. Drop and recreate everything instead? (yes/no): \x1b[0m',
            );
            return answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y';
        }

        return false;
    }

    private async ensureSchemas() {
        for (const schema of ENTITY_SCHEMAS) {
            await this.dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
        }
    }

    async runMigration() {
        const currentEnv = appConfig.APP.ENV.toLowerCase();
        if (!ALLOWED_ENVS.includes(currentEnv)) {
            console.log(
                '\x1b[31mRefusing to run: migrate.ts only runs in local/dev environments (NODE_ENV=%s).\x1b[0m',
                currentEnv,
            );
            return;
        }

        try {
            if (!this.dataSource.isInitialized) {
                await this.dataSource.initialize();
            }

            const shouldDrop = await this.confirmMigration();

            if (shouldDrop) {
                console.log('\x1b[31mDropping all tables...\x1b[0m');
                await this.dataSource.dropDatabase();
                console.log('\x1b[33mCreating schemas...\x1b[0m');
                await this.ensureSchemas();
                console.log('\x1b[33mRecreating tables...\x1b[0m');
                await this.dataSource.synchronize();
                console.log('\x1b[32mTables recreated successfully.\x1b[0m');
            } else {
                console.log('\x1b[33mCreating schemas...\x1b[0m');
                await this.ensureSchemas();
                console.log('\x1b[33mSynchronizing current entity schema...\x1b[0m');
                await this.dataSource.synchronize();
                console.log('\x1b[32mSchema synchronized successfully.\x1b[0m');
            }

            console.log('\x1b[32mMigration completed successfully.\x1b[0m');
        } catch (error) {
            console.log('\x1b[31m%s\x1b[0m', error.message, error);
        } finally {
            if (this.dataSource.isInitialized) {
                await this.dataSource.destroy();
            }
        }
    }
}

const migrationInitializer = new MigrationInitializer(
    new DataSource({
        ...(typeOrmConfig as DataSourceOptions),
        synchronize: false,
    }),
);
migrationInitializer.runMigration();
