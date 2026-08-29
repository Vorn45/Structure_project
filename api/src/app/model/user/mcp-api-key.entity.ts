// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { User } from './users.entity';

// ======================================= >> Code Starts Here << ========================== //
/**
 * A long-lived credential letting an external MCP client (Claude Code, Claude
 * Desktop, …) act on behalf of one user. The raw key is shown once at creation
 * and never stored — only its SHA-256 digest, which is what lookups match on.
 *
 * `active_role_id` / `active_organization_id` snapshot the role and organization
 * the user held when minting the key, because every shared service downstream
 * expects the same UserPayload shape the JWT carries.
 */
@Entity({ name: 'mcp_api_keys', schema: 'user' })
@Index(['key_hash'], { unique: true })
export class McpApiKey {
    @PrimaryGeneratedColumn('uuid') id: string;

    @Column({ type: 'int' }) user_id: number;
    /** User-supplied label, so several agents can be told apart when revoking. */
    @Column({ type: 'varchar', length: 100 }) name: string;
    @Column({ type: 'varchar', length: 64 }) key_hash: string;
    /** First few characters of the raw key — display only, so the list view is identifiable. */
    @Column({ type: 'varchar', length: 20 }) key_prefix: string;
    @Column({ type: 'int', nullable: true }) active_role_id: number | null;
    @Column({ type: 'uuid', nullable: true }) active_organization_id: string | null;
    @Column({
        type: 'text',
        array: true,
        default: () => "ARRAY['setup:read', 'tasks:read']::text[]",
    })
    scopes: string[];
    @Column({ type: 'timestamp' }) expires_at: Date;
    @Column({ type: 'timestamp', nullable: true }) last_used_at: Date | null;
    @Column({ type: 'timestamp', nullable: true }) revoked_at: Date | null;
    /** Who minted the key — null for a self-service key, the acting admin's id for one created on a user's behalf. */
    @Column({ type: 'int', nullable: true }) created_by: number | null;

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) user: User;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by' }) creator: User | null;
}
