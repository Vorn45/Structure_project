// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { User }       from './users.entity';
import { UserDevice } from './user_devices.entity';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'user_session', schema: 'user' })
export class UserSessions {
    @PrimaryGeneratedColumn() declare id: number;

    @Column({ name: 'user_id', type: 'int', nullable: false })
    declare user_id: number;
    @Column({ name: 'user_device_id', type: 'int', nullable: false })
    declare user_device_id: number;
    @Column({ type: 'varchar', length: 45, nullable: true }) declare ip: string | null;
    @Column({ type: 'varchar', length: 10, nullable: true })
    declare country_code: string | null;
    @Column({ type: 'varchar', length: 100, nullable: true }) declare region: string | null;
    @Column({ type: 'varchar', length: 100, nullable: true }) declare city: string | null;
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    declare latitude: number | null;
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    declare longitude: number | null;
    @Column({ type: 'varchar', length: 50, nullable: true }) declare timezone: string | null;
    @Column({ type: 'int', default: 1 }) declare login_method: number;
    @Column({ type: 'boolean', default: true }) declare is_active: boolean;
    @Column({ type: 'boolean', default: false })
    declare restricted_attempt: boolean;
    @Column({ type: 'timestamp', nullable: true })
    declare last_activity_at: Date;
    @Column({ type: 'timestamp', nullable: true })
    declare logged_out_at: Date | null;

    @CreateDateColumn({ name: 'created_at' }) declare created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) declare updated_at: Date;
    @DeleteDateColumn({ name: 'deleted_at' }) declare deleted_at: Date;

    @ManyToOne(() => User, (user) => user.user_sessions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    declare user: User;

    @ManyToOne(() => UserDevice, (device) => device.sessions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_device_id' })
    declare device: UserDevice;
}
export default UserSessions;
