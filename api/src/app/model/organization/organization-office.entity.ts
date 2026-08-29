// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Unique, } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { User }         from '../user/users.entity';
import { File }         from '../file/file.entity';
import { Organization } from './organization.entity';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'organization_office', schema: 'organization' })
@Unique(['name_en', 'organization_id'])
export class OrganizationOfficeEntity {
    @PrimaryGeneratedColumn() id: number;

    @Column({ type: 'varchar', length: 100 }) name_kh: string;
    @Column({ type: 'varchar', length: 100 }) name_en: string;
    @Column({ type: 'int', nullable: true }) logo_id: number;
    @Column({ type: 'int', nullable: true }) creator_id: number;
    @Column({ type: 'uuid', nullable: true }) organization_id: string;
    @Column({ type: 'boolean', default: true }) is_active: boolean;
    @Column({ type: 'int', default: 0 }) sort: number;

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;
    @DeleteDateColumn({ name: 'deleted_at' }) deleted_at: Date;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'creator_id' }) creator?: User;

    @ManyToOne(() => Organization, (organization) => organization.organization_offices, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' }) organization?: Organization;

    @ManyToOne(() => File, (file) => file.organization_offices, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'logo_id' }) logo?: File;
}
