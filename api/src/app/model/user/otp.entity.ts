// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { User }                   from '../user/users.entity';
import { OtpChannel, OtpPurpose } from 'src/app/enum/otp-channel.enum';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'user_otp', schema: 'user' })
export class UserOTP {
    @PrimaryGeneratedColumn() id: number;

    @Column() user_id: number;
    @Column({ length: 6 }) otp: string;
    @Column({ type: 'varchar', length: 100, nullable: true }) otp_token: string | null;
    @Column({ type: 'varchar', length: 30, nullable: true }) purpose: OtpPurpose | null;
    @Column({ type: 'varchar', length: 20, nullable: true }) channel: OtpChannel | null;
    @Column({ type: 'timestamp' }) expires_at: Date;

    @ManyToOne(() => User, (user) => user.otps, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) user: User;
}
