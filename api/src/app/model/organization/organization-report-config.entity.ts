// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { Organization } from './organization.entity';
import { File }         from '../file/file.entity';
import { User }         from '../user/users.entity';

// ======================================= >> Code Starts Here << ========================== //
export interface OrganizationReportLine {
    text: string;
    moul: boolean;
    bold: boolean;
}

/**
 * Per-organization document template settings — which blocks the generated
 * report header/footer carry (kingdom line, logo, organization name lines,
 * document number, page number, print date). One row per organization.
 */
@Entity({ name: 'organization_report_config', schema: 'organization' })
export class OrganizationReportConfigEntity {
    @PrimaryGeneratedColumn('uuid') id: string;

    @Column({ type: 'uuid', unique: true }) organization_id: string;

    // > Header
    @Column({ type: 'boolean', default: true }) show_kingdom: boolean;
    @Column({ type: 'varchar', length: 10, default: 'center' }) kingdom_align: string;
    @Column({ type: 'boolean', default: true }) show_logo: boolean;
    @Column({ type: 'int', nullable: true }) logo_id: number;
    @Column({ type: 'boolean', default: true }) show_organization: boolean;
    @Column({ type: 'varchar', length: 10, default: 'center' }) organization_align: string;
    @Column({ type: 'jsonb', nullable: true }) organization_lines: OrganizationReportLine[];
    @Column({ type: 'boolean', default: false }) show_number: boolean;

    // > Footer
    @Column({ type: 'boolean', default: true }) show_page_number: boolean;
    @Column({ type: 'boolean', default: false }) show_print_date: boolean;
    @Column({ type: 'varchar', length: 150, nullable: true }) footer_text: string;
    @Column({ type: 'varchar', length: 10, default: 'left' }) footer_align: string;

    @Column({ type: 'int', nullable: true }) updated_by: number;

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;

    @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' }) organization: Organization;

    @ManyToOne(() => File, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'logo_id' }) logo_file?: File;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'updated_by' }) updater?: User;
}
