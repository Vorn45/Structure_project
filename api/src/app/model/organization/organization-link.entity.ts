// ===========================================================================>> Third Party Library
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { User } from '../user/users.entity';
import { Organization } from './organization.entity';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'organization_link', schema: 'organization' })
export class OrganizationLink {
    @PrimaryGeneratedColumn('uuid') id: string;

    @Column({ type: 'uuid' }) organization_id: string;
    @Column({ type: 'varchar', length: 150 }) name: string;
    @Column({ type: 'varchar', length: 500 }) link: string;
    @Column({ type: 'int', default: 0 }) sort: number;
    @Column({ type: 'int' }) created_by: number;
    @Column({ type: 'int', nullable: true }) updated_by: number;

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;
    @DeleteDateColumn({ name: 'deleted_at' }) deleted_at: Date;

    @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' }) organization: Organization;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'created_by' }) creator: User;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'updated_by' }) updater?: User;
}
