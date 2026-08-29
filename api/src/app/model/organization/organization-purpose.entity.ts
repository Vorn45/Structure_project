// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, ManyToOne, JoinColumn, } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { File }         from '../file/file.entity';
import { Organization } from './organization.entity';

// ======================================= >> Code Starts Here << ========================== //
/**
 * Global lookup for the main purpose picked on step 2 of the setup wizard
 * (ពង្រឹកអភិបាលកិច្ច, គ្រប់គ្រងប្រតិបត្តិការ, …). Not organization-scoped.
 */
@Entity({ name: 'organization_purpose', schema: 'organization' })
export class OrganizationPurposeEntity {
    @PrimaryGeneratedColumn() id: number;

    @Column({ type: 'varchar', length: 100 }) name_kh: string;
    @Column({ type: 'varchar', length: 100 }) name_en: string;

    /** Artwork on the file service, seeded by OrganizationPurposeSeeder. */
    @Column({ type: 'int', nullable: true }) file_id: number;
    /** Preset UI icon that renders with the active theme's primary colour. */
    @Column({ type: 'varchar', length: 100, nullable: true }) icon_key: string;

    @Column({ type: 'boolean', default: true }) is_active: boolean;
    @Column({ type: 'int', default: 0 }) sort: number;

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;
    @DeleteDateColumn({ name: 'deleted_at' }) deleted_at: Date;

    @ManyToOne(() => File, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'file_id' }) file?: File;

    @OneToMany(() => Organization, (organization) => organization.purpose) organizations: Organization[];
}
