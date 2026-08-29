// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique, } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { Organization } from './organization.entity';
import { User }         from '../user/users.entity';

// ======================================= >> Code Starts Here << ========================== //
/**
 * Links a User's Telegram account to one organization's own bot, so the same
 * user can independently link to several organizations' bots (unlike
 * User.telegram_id, which links to the single fixed system-wide PMS_bot).
 */
@Entity({ name: 'organization_telegram_member', schema: 'organization' })
@Unique(['organization_id', 'user_id'])
export class OrganizationTelegramMember {
    @PrimaryGeneratedColumn('uuid') id: string;

    @Column({ type: 'uuid' }) organization_id: string;
    @Column({ type: 'int' }) user_id: number;
    @Column({ type: 'varchar', length: 50, nullable: true }) telegram_id: string;
    @Column({ type: 'varchar', length: 100, nullable: true }) telegram_username: string;
    @Column({ type: 'varchar', length: 36, nullable: true }) telegram_session: string;
    @Column({ type: 'varchar', length: 50, nullable: true }) telegram_pending_chat_id: string;

    /** Legacy: state for the removed Telegram /create_task wizard. Unused — kept only until a migration drops the column. */
    @Column({ type: 'jsonb', nullable: true }) telegram_task_draft: Record<string, any> | null;

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;

    @ManyToOne(() => Organization, (organization) => organization.telegram_members, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' }) organization: Organization;

    @ManyToOne(() => User, (user) => user.organization_telegram_members, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) user: User;
}
