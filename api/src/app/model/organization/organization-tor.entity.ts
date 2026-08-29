import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { File } from '../file/file.entity';
import { Organization } from './organization.entity';

@Entity({ name: 'organization_tor', schema: 'organization' })
export class OrganizationTor {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({ type: 'uuid' }) organization_id: string;
    @Column({ type: 'text' }) description: string;
    @Column({ type: 'int', nullable: true }) image_id: number | null;
    @Column({ type: 'int' }) created_by: number;
    @Column({ type: 'int', nullable: true }) updated_by: number | null;
    @CreateDateColumn() created_at: Date;
    @UpdateDateColumn() updated_at: Date;
    @DeleteDateColumn() deleted_at: Date;

    @ManyToOne(() => Organization, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'organization_id' }) organization: Organization;
    @ManyToOne(() => File, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'image_id' }) image_file?: File;
}
