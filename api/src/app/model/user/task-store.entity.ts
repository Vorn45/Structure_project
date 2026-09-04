import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity({ name: 'task_store', schema: 'user' })
export class TaskStore {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', default: 'default_tasks_store' })
    key: string;

    @Column({ type: 'jsonb', nullable: true })
    tasks: any;

    @Column({ type: 'jsonb', nullable: true })
    comments: any;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;
}
