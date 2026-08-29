// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { Organization } from './organization.entity';

// ======================================= >> Code Starts Here << ========================== //
/** A Telegram broadcast channel the org admin created and added their own bot to. Settings-only for now — not yet wired into notification routing. */
@Entity({ name: 'organization_telegram_channel', schema: 'organization' })
export class OrganizationTelegramChannel {
    @PrimaryGeneratedColumn('uuid') id: string;

    @Column({ type: 'uuid' }) organization_id: string;
    @Column({ type: 'varchar', length: 150 }) name: string;
    @Column({ type: 'varchar', length: 50 }) chat_id: string;
    @Column({ type: 'varchar', length: 100 }) bot_token: string;

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;
    @DeleteDateColumn({ name: 'deleted_at' }) deleted_at: Date;

    @ManyToOne(() => Organization, (organization) => organization.telegram_channels, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' }) organization: Organization;
}
