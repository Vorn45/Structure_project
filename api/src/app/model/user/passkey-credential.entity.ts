// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { User } from './users.entity';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'passkey_credentials', schema: 'user' })
export class PasskeyCredential {
    @PrimaryGeneratedColumn() declare id: number;

    @Column({ name: 'user_id', type: 'int', nullable: false })
    declare user_id: number;
    // Base64url-encoded credential ID from the authenticator — the lookup
    // key for login, before the server knows which user is signing in.
    @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
    declare credential_id: string;
    // Base64-encoded public key bytes (@simplewebauthn/server hands back a
    // raw Uint8Array; this column stores it re-encoded for storage).
    @Column({ type: 'text', nullable: false }) declare public_key: string;
    // Signature counter, used to detect cloned authenticators.
    @Column({ type: 'bigint', default: 0 }) declare counter: number;
    @Column({ type: 'jsonb', nullable: true })
    declare transports: string[] | null;
    // 'singleDevice' | 'multiDevice' per @simplewebauthn/server's CredentialDeviceType.
    @Column({ type: 'varchar', length: 20, nullable: true })
    declare device_type: string | null;
    @Column({ type: 'boolean', default: false }) declare backed_up: boolean;
    @Column({ type: 'varchar', length: 255, nullable: false })
    declare device_name: string;
    @Column({ type: 'timestamp', nullable: true })
    declare last_used_at: Date | null;

    @CreateDateColumn({ name: 'created_at' }) declare created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) declare updated_at: Date;
    @DeleteDateColumn({ name: 'deleted_at' }) declare deleted_at: Date;

    @ManyToOne(() => User, (user) => user.passkey_credentials, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    declare user: User;
}
export default PasskeyCredential;
