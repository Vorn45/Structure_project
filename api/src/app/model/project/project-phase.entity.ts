import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity({ name: 'project_phases', schema: 'project' })
export class ProjectPhaseEntity {
    @PrimaryColumn({ type: 'varchar', length: 100 })
    id: string;

    @Index()
    @Column({ type: 'varchar', length: 100 })
    project_id: string;

    @Column({ type: 'integer', default: 1 })
    number: number;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    quarter: string;

    @Column({ type: 'varchar', length: 50, default: 'planned' })
    status: string;

    @Column({ type: 'integer', default: 0 })
    progress: number;

    @Column({ type: 'timestamptz', nullable: true })
    start_date: Date | string | null;

    @Column({ type: 'timestamptz', nullable: true })
    end_date: Date | string | null;

    @Column({ type: 'integer', default: 0 })
    tasks_count: number;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;
}
