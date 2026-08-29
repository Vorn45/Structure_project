// ===========================================================================>> Third Party Library
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, } from 'typeorm';

// ======================================= >> Code Starts Here << ========================== //
// Ephemeral, single-use WebAuthn challenge store. Login challenges have no
// known user yet (user_id null) since the discoverable/resident-key flow
// doesn't ask for a username before the browser's account picker runs;
// registration challenges are tied to the already-authenticated user.
@Entity({ name: 'passkey_challenges', schema: 'user' })
export class PasskeyChallenge {
    @PrimaryGeneratedColumn() id: number;

    @Column({ name: 'user_id', type: 'int', nullable: true })
    user_id: number | null;
    // Opaque token handed to the client to echo back on verify — the actual
    // WebAuthn `challenge` value never leaves the server in identifiable form.
    @Column({ type: 'varchar', length: 64, unique: true, nullable: false })
    challenge_token: string;
    @Column({ type: 'varchar', length: 255, nullable: false }) challenge: string;
    // 'registration' | 'authentication'
    @Column({ type: 'varchar', length: 20, nullable: false }) purpose: string;
    @Column({ type: 'timestamp', nullable: false }) expires_at: Date;

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
}
