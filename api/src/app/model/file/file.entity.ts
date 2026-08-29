// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';

// ===========================================================================>> Custom Library
import { Organization } from '../organization/organization.entity';
import { OrganizationPositionEntity } from '../organization/organization-position.entity';
import { OrganizationOfficeEntity } from '../organization/organization-office.entity';
import { User } from '../user/users.entity';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'file', schema: 'file' })
export class File {
    @PrimaryGeneratedColumn() id: number;

    @Column({ type: 'varchar', length: 255 }) title: string;
    @Column({ type: 'varchar', length: 20, nullable: true }) extention: string;
    @Column({ type: 'varchar', length: 50, nullable: true }) type: string;
    @Column({ type: 'integer', default: 0 }) size: number;
    @Column({ type: 'varchar', length: 100, nullable: true }) ref_table: string;
    @Column({ type: 'varchar', length: 50, nullable: true }) ref_id: string;
    @Column({ type: 'integer', nullable: true }) folder_id: number;
    @Column({ type: 'varchar', length: 500, nullable: true }) uri: string;
    @Column({ type: 'varchar', length: 255, nullable: true }) file_domain: string;
    @Column({ type: 'char', length: 1, default: '1' }) active: string;

    @CreateDateColumn({ type: 'timestamp' }) created_datetime: Date;
    @Column({ type: 'varchar', length: 50, nullable: true }) created_by: string;
    @UpdateDateColumn({ type: 'timestamp' }) updated_datetime: Date;
    @Column({ type: 'varchar', length: 50, nullable: true }) updated_by: string;
    @DeleteDateColumn({ type: 'timestamp', nullable: true }) deleted_datetime: Date;
    @Column({ type: 'varchar', length: 50, nullable: true }) deleted_by: string;

    @OneToMany(() => User, (user) => user.avatar_file) user_avatars: User[];
    @OneToMany(() => User, (user) => user.background_file) user_backgrounds: User[];
    @OneToMany(() => Organization, (organization) => organization.logo_file) organizations: Organization[];
    @OneToMany(() => OrganizationPositionEntity, (pos) => pos.icon) organization_positions: OrganizationPositionEntity[];
    @OneToMany(() => OrganizationOfficeEntity, (office) => office.logo) organization_offices: OrganizationOfficeEntity[];
}
