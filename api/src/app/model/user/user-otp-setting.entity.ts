// ===========================================================================>> Third Party Library
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { User } from './users.entity';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'user_otp_setting', schema: 'user' })
export class UserOtpSetting {
    @PrimaryGeneratedColumn() id: number;

    @Column({ name: 'user_id', type: 'int', unique: true }) user_id: number;
    @Column({ type: 'boolean', default: false }) phone_enabled: boolean;
    @Column({ type: 'boolean', default: false }) telegram_enabled: boolean;
    @Column({ type: 'boolean', default: false }) email_enabled: boolean;
    @Column({ type: 'boolean', default: false }) authenticator_enabled: boolean;
    @Column({ name: 'security_email', type: 'varchar', length: 255, nullable: true }) security_email: string | null;
    @Column({ name: 'security_phone', type: 'varchar', length: 50, nullable: true }) security_phone: string | null;
    @Column({ type: 'varchar', length: 255, nullable: true }) authenticator_secret: string | null;
    @Column({ type: 'simple-array', nullable: true }) backup_codes: string[] | null;

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;

    @OneToOne(() => User, (user) => user.otp_setting, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) user: User;
}
