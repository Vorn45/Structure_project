import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn, } from 'typeorm';
import { Organization } from '../organization/organization.entity';
import { User } from '../user/users.entity';

@Entity({ name: 'organization_file_folder', schema: 'file' })
@Unique(['organization_id', 'external_folder_id'])
export class OrganizationFileFolder {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({ type: 'uuid' }) organization_id: string;
    @Column({ type: 'uuid', nullable: true }) parent_id: string | null;
    @Column({ type: 'int', nullable: true }) external_folder_id: number | null;
    @Column({ type: 'int', nullable: true }) parent_external_folder_id: number | null;
    @Column({ type: 'varchar', length: 150 }) name: string;
    @Column({ type: 'int', nullable: true }) created_by: number | null;
    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;
    @DeleteDateColumn({ name: 'deleted_at' }) deleted_at: Date;
    @ManyToOne(() => Organization, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'organization_id' }) organization: Organization;
    @ManyToOne(() => OrganizationFileFolder, { nullable: true, onDelete: 'CASCADE' }) @JoinColumn({ name: 'parent_id' }) parent?: OrganizationFileFolder;
    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'created_by' }) creator?: User;
}
