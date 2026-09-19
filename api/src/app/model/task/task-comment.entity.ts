import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { BigIntTransformer } from './task.entity';

@Entity({ name: 'task_comments', schema: 'task' })
export class TaskCommentEntity {
    @PrimaryColumn({ type: 'bigint', transformer: BigIntTransformer })
    id: number;

    @Index()
    @Column({ type: 'bigint', transformer: BigIntTransformer })
    task_id: number;

    @Column({ type: 'integer', nullable: true })
    sender_id: number | null;

    @Column({ type: 'varchar', length: 255 })
    sender_name: string;

    @Column({ type: 'text', nullable: true })
    sender_avatar: string | null;

    @Column({ type: 'text', nullable: true })
    text: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    time: string | null;

    @Column({ type: 'boolean', default: false })
    is_self: boolean;

    @Column({ type: 'boolean', default: false })
    is_system: boolean;

    @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
    attachments: any;

    @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
    seen_by: any;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;
}
