import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { typeOrmConfig } from 'src/config/database.config';

const AppDataSource = new DataSource({
    ...(typeOrmConfig as DataSourceOptions),
    synchronize: false,
    migrations: [],
});

export default AppDataSource;
