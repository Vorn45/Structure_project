// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, Index, } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { User }            from './users.entity';
import { UserSessions }    from './user_sessions.entity';
import { UserSessionLogs } from './user_session_logs.entity';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'user_devices', schema: 'user' })
@Index(['user_id', 'device_id'], {
    unique: true,
    where: '"deleted_at" IS NULL AND "device_id" IS NOT NULL',
})
export class UserDevice {
    @PrimaryGeneratedColumn() declare id: number;

    @Column({ name: 'user_id', type: 'int', nullable: false })
    declare user_id: number;
    @Column({ type: 'varchar', length: 255, nullable: true })
    declare device_id: string | null;
    @Column({ type: 'varchar', length: 255, nullable: false })
    declare device_name: string;
    @Column({ type: 'varchar', length: 50, nullable: false })
    declare platform: string;
    @Column({ type: 'varchar', length: 50, nullable: false })
    declare os: string;
    @Column({ type: 'varchar', length: 100, nullable: false })
    declare browser: string;
    @Column({ type: 'text', nullable: true }) declare user_agent: string;
    @Column({ type: 'varchar', length: 50, nullable: true })
    declare device_type: string;
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
    @Column({ type: 'timestamp', nullable: true })
    declare last_activity_at: Date | null;

    @CreateDateColumn({ name: 'created_at' }) declare created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) declare updated_at: Date;
    @DeleteDateColumn({ name: 'deleted_at' }) declare deleted_at: Date;

    @ManyToOne(() => User, (user) => user.user_devices, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    declare user: User;

    @OneToMany(() => UserSessions, (session) => session.device)
    declare sessions: UserSessions[];
    @OneToMany(() => UserSessionLogs, (log) => log.device)
    declare logs: UserSessionLogs[];
}
export default UserDevice;
