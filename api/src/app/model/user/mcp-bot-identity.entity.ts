// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { User } from './users.entity';

// ======================================= >> Code Starts Here << ========================== //
/**
 * One bot `User` per (MCP client, human owner) pair — e.g. "claude-code" used by user 79
 * gets its own "Claude Code · KREN SELA" account — used to attribute messages an agent
 * posts into chat so they render as a distinct incoming sender rather than as the human
 * who owns the API key, while still making clear whose agent it is. The bot user never
 * joins any project, organization, or chat room — it is only ever referenced as a
 * message's `sender_id` — so it cannot leak into member directories or another
 * organization's data.
 */
@Entity({ name: 'mcp_bot_identities', schema: 'user' })
@Index(['client_key', 'owner_user_id'], { unique: true })
export class McpBotIdentity {
    @PrimaryGeneratedColumn() id: number;

    /** The MCP client's self-reported name, lower-cased. */
    @Column({ type: 'varchar', length: 100 }) client_key: string;

    /** The real human whose API key connected — whose name appears after the "·". */
    @Column({ type: 'int' }) owner_user_id: number;

    /** The bot's own synthetic account, referenced by `chat_message.sender_id`. */
    @Column({ type: 'int' }) user_id: number;

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'owner_user_id' }) owner: User;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) user: User;
}
