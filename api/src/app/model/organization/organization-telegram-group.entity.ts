// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

// ===========================================================================>> Custom Library
import { Organization } from './organization.entity';
import { User } from '../user/users.entity';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'organization_telegram_group', schema: 'organization' })
export class OrganizationTelegramGroup {
    @PrimaryGeneratedColumn('uuid') id: string;

    @Column({ type: 'uuid' }) organization_id: string;
    @Column({ type: 'varchar', length: 150 }) name: string;
    @Column({ type: 'varchar', length: 50 }) chat_id: string;
    @Column({ type: 'varchar', length: 255, nullable: true }) link: string;
    @Column({ type: 'varchar', length: 100 }) bot_token: string;
    @Column({ type: 'boolean', default: false }) is_default: boolean;
    @Column({ type: 'int', nullable: true }) updated_by: number;

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;
    @DeleteDateColumn({ name: 'deleted_at' }) deleted_at: Date;

    @ManyToOne(() => Organization, (organization) => organization.telegram_groups, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' }) organization: Organization;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'updated_by' }) updater?: User;
}
