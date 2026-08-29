// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

// ===========================================================================>> Custom Library
import { User } from './users.entity';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'telegram_thread', schema: 'user' })
@Index(['user_id', 'project_id'], { unique: true })
export class TelegramThread {
    @PrimaryGeneratedColumn('uuid') id: string;

    @Column({ type: 'int' }) user_id: number;
    @Column({ type: 'uuid', nullable: true }) project_id: string;
    @Column({ type: 'int', nullable: true }) header_message_id: number | null;
    @Column({ type: 'int', nullable: true }) message_thread_id: number | null;

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) user: User;
}
