// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { User }       from './users.entity';
import { UserDevice } from './user_devices.entity';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'user_session_log', schema: 'user' })
export class UserSessionLogs {
    @PrimaryGeneratedColumn() declare id: number;

    @Column({ name: 'user_id', type: 'int', nullable: false })
    declare user_id: number;
    @Column({ name: 'user_device_id', type: 'int', nullable: false })
    declare user_device_id: number;
    @Column({ type: 'varchar', length: 255, nullable: true })
    declare device_id: string | null;
    @Column({ type: 'varchar', length: 45, nullable: true }) declare ip: string | null;
    @Column({ type: 'varchar', length: 10, nullable: true })
    declare country_code: string | null;
    @Column({ type: 'varchar', length: 100, nullable: true }) declare region: string | null;
    @Column({ type: 'varchar', length: 100, nullable: true }) declare city: string | null;
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    declare latitude: number | null;
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    declare longitude: number | null;
    @Column({ type: 'varchar', length: 100, nullable: true }) declare timezone: string | null;
    @Column({ type: 'varchar', length: 255, nullable: true })
    declare device_name: string | null;
    @Column({ type: 'varchar', length: 50, nullable: true }) declare platform: string | null;
    @Column({ type: 'varchar', length: 50, nullable: true }) declare os: string | null;
    @Column({ type: 'varchar', length: 100, nullable: true }) declare browser: string | null;
    @Column({ type: 'varchar', length: 50, nullable: true })
    declare device_type: string | null;
    @Column({ type: 'text', nullable: true }) declare user_agent: string | null;

    @CreateDateColumn({ name: 'created_at' }) declare created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) declare updated_at: Date;
    @DeleteDateColumn({ name: 'deleted_at' }) declare deleted_at: Date;

    @ManyToOne(() => User, (user) => user.user_session_logs, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    declare user: User;

    @ManyToOne(() => UserDevice, (device) => device.logs, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_device_id' })
    declare device: UserDevice;
}
export default UserSessionLogs;
