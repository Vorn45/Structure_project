import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

export type ClientStatus = 'active' | 'inactive' | 'lead' | 'contracted';

@Entity({ name: 'client', schema: 'organization' })
export class Client {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 150 })
    company_name: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    name_kh: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    name_en: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    email: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    phone: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    industry: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    contact_person: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    contact_phone: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    contact_email: string;

    @Column({ type: 'varchar', length: 30, default: 'active' })
    status: ClientStatus;

    @Column({ type: 'int', default: 0 })
    projects_count: number;

    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    website: string;

    @Column({ type: 'text', nullable: true })
    logo: string;

    @Column({ type: 'text', nullable: true })
    note: string;

    @Column({ type: 'uuid', nullable: true })
    organization_id: string;

    @ManyToOne(() => Organization, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'organization_id' })
    organization?: Organization;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deleted_at: Date;
}
