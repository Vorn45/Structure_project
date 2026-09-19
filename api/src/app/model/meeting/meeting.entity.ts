import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity({ name: 'meetings', schema: 'meeting' })
export class MeetingEntity {
    @PrimaryColumn({ type: 'varchar', length: 100 })
    id: string;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'varchar', length: 50, default: 'wms' })
    type: string;

    @Column({ type: 'varchar', length: 50 })
    date: string;

    @Column({ type: 'varchar', length: 50 })
    time: string;

    @Column({ type: 'varchar', length: 50, default: '៣០ នាទី' })
    duration: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    room_code: string;

    @Column({ type: 'text', nullable: true })
    room_url: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    organizer: string;

    @Column({ type: 'integer', nullable: true })
    organizer_id: number | null;

    @Column({ type: 'varchar', length: 50, default: 'upcoming' })
    status: string;

    @Column({ type: 'jsonb', default: () => "'[]'" })
    participants: any;

    @Column({ type: 'text', nullable: true })
    agenda: string;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;
}
