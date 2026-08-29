// ===========================================================================>> Third Party Library
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';
import * as bcrypt from 'bcrypt';

// ===========================================================================>> Custom Library
// > Local
import { User } from './users.entity';

// ======================================= >> Code Starts Here << ========================== //
/**
 * Server-side source of truth for the local (device-lock) passcode feature.
 * Deliberately not a client-storage secret — `locked`/`hash` here are what a
 * fresh page load asks the server for, so clearing localStorage on the
 * client can't silently disable the lock.
 */
@Entity({ name: 'user_passcode', schema: 'user' })
export class UserPasscode {
    @PrimaryGeneratedColumn() id: number;

    @Column({ name: 'user_id', type: 'int', unique: true }) user_id: number;
    @Column({ type: 'boolean', default: false }) enabled: boolean;
    @Column({ type: 'varchar', length: 100, nullable: true }) passcode_hash: string | null;
    @Column({ type: 'int', default: 5 }) idle_timeout_minutes: number;

    @Column({ type: 'int', default: 0 }) failed_attempts: number;
    @Column({ type: 'timestamp', nullable: true }) locked_until: Date | null;

    // Short-lived, single-use proof that the forgot-passcode email-OTP step
    // just succeeded — redeemed by the following `setPasscode` call so a new
    // passcode can be set without re-proving the account password. Not the
    // OTP itself (that's already consumed by the OTP service); a separate
    // opaque ticket minted right after OTP verification succeeds.
    @Column({ type: 'varchar', length: 64, nullable: true }) reset_ticket: string | null;
    @Column({ type: 'timestamp', nullable: true }) reset_ticket_expires_at: Date | null;

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) user: User;

    async setPasscode(value: string): Promise<void> {
        const salt = await bcrypt.genSalt(10);
        this.passcode_hash = await bcrypt.hash(value, salt);
    }
}
