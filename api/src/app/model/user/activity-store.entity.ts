import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity({ name: 'activity_store', schema: 'user' })
export class ActivityStore {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', default: 'default_activities_store' })
    key: string;

    @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
    projects: any;

    @Column({ type: 'jsonb', nullable: true, default: () => "'{}'" })
    tasks_map: any;

    @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
    activities: any;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;
}
