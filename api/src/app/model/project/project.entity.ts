import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity({ name: 'projects', schema: 'project' })
export class ProjectEntity {
    @PrimaryColumn({ type: 'varchar', length: 100 })
    id: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 50 })
    code: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 50, default: 'active' })
    status: string;

    @Column({ type: 'varchar', length: 50, default: 'medium' })
    priority: string;

    @Column({ type: 'varchar', length: 100, default: 'it' })
    category: string;

    @Column({ type: 'integer', default: 0 })
    progress: number;

    @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
    budget_allocated: number;

    @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
    budget_spent: number;

    @Column({ type: 'timestamptz', nullable: true })
    start_date: Date | string | null;

    @Column({ type: 'timestamptz', nullable: true })
    end_date: Date | string | null;

    @Column({ type: 'jsonb', nullable: true })
    team_lead: any;

    @Column({ type: 'jsonb', nullable: true })
    lead: any;

    @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
    members: any;

    @Column({ type: 'text', nullable: true })
    logo: string | null;

    @Column({ type: 'text', nullable: true })
    image: string | null;

    @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
    attachments: any;

    @Column({ type: 'integer', default: 0 })
    attachments_count: number;

    @Column({ type: 'integer', default: 0 })
    total_tasks: number;

    @Column({ type: 'integer', default: 0 })
    completed_tasks: number;

    @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
    links: any;

    @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
    meetings: any;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;
}
