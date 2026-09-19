import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export const BigIntTransformer = {
    to: (value: number | string | null | undefined) => value,
    from: (value: string | number | null | undefined) =>
        value !== null && value !== undefined ? Number(value) : null,
};

@Entity({ name: 'tasks', schema: 'task' })
export class TaskEntity {
    @PrimaryColumn({ type: 'bigint', transformer: BigIntTransformer })
    id: number;

    @Index()
    @Column({ type: 'varchar', length: 50, nullable: true })
    code: string | null;

    @Index()
    @Column({ type: 'varchar', length: 100 })
    project_id: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    project_name: string | null;

    @Column({ type: 'text' })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'varchar', length: 50, default: 'feature' })
    task_type: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    module: string | null;

    @Column({ type: 'varchar', length: 50, default: 'new' })
    status: string;

    @Column({ type: 'varchar', length: 50, default: 'medium' })
    priority: string;

    @Column({ type: 'integer', default: 0 })
    progress: number;

    @Column({ type: 'integer', default: 0 })
    comments_count: number;

    @Column({ type: 'integer', default: 0 })
    attachments_count: number;

    @Column({ type: 'timestamptz', nullable: true })
    due_date: Date | string | null;

    @Column({ type: 'timestamptz', nullable: true })
    start_date: Date | string | null;

    @Column({ type: 'jsonb', nullable: true })
    reporter: any;

    @Column({ type: 'jsonb', nullable: true })
    assignee: any;

    @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
    assignees: any;

    @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
    subtasks: any;

    @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
    links: any;

    @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
    attachments: any;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;
}
