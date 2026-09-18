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
import { User } from '../user/users.entity';
import { Organization } from './organization.entity';

export type LeaveType = 'annual' | 'sick' | 'special' | 'maternity';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

@Entity({ name: 'leave_request', schema: 'organization' })
export class LeaveRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int' })
    user_id: number;

    @Column({ type: 'varchar', length: 150 })
    user_name: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    department: string;

    @Column({ type: 'varchar', length: 50, default: 'annual' })
    leave_type: LeaveType;

    @Column({ type: 'varchar', length: 50 })
    start_date: string;

    @Column({ type: 'varchar', length: 50 })
    end_date: string;

    @Column({ type: 'float', default: 1 })
    duration_days: number;

    @Column({ type: 'text' })
    reason: string;

    @Column({ type: 'varchar', length: 30, default: 'pending' })
    status: LeaveStatus;

    @Column({ type: 'text', nullable: true })
    reviewer_comment?: string;

    @Column({ type: 'int', nullable: true })
    reviewer_id?: number;

    @Column({ type: 'uuid', nullable: true })
    organization_id?: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user?: User;

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
