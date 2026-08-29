import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { File } from '../file/file.entity';
import { Organization } from './organization.entity';
import { User } from '../user/users.entity';

@Entity({ name: 'organization_member_tor', schema: 'organization' })
export class OrganizationMemberTor {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({ type: 'uuid' }) organization_id: string;
    @Column({ type: 'int' }) user_id: number;
    @Column({ type: 'text' }) description: string;
    @Column({ type: 'int', nullable: true }) image_id: number | null;
    @Column({ type: 'int' }) created_by: number;
    @Column({ type: 'int', nullable: true }) updated_by: number | null;
    @CreateDateColumn() created_at: Date;
    @UpdateDateColumn() updated_at: Date;
    @DeleteDateColumn() deleted_at: Date;

    @ManyToOne(() => Organization, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'organization_id' }) organization: Organization;
    @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'user_id' }) user: User;
    @ManyToOne(() => File, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'image_id' }) image_file?: File;
}
