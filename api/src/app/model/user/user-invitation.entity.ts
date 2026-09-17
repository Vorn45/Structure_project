import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export enum InvitationStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    EXPIRED = 'expired',
    REVOKED = 'revoked',
}

@Entity({ name: 'user_invitation', schema: 'user' })
export class UserInvitation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'varchar', length: 255 })
    email: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    name: string | null;

    @Column({ type: 'varchar', length: 100, default: 'Member' })
    role: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    department: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    position: string | null;

    @Column({ type: 'text', nullable: true })
    note: string | null;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 255 })
    token: string;

    @Column({
        type: 'varchar',
        length: 50,
        default: InvitationStatus.PENDING,
    })
    status: InvitationStatus;

    @Column({ type: 'bigint', nullable: true })
    invited_by_id: number | null;

    @Column({ type: 'timestamp with time zone' })
    expires_at: Date;

    @Column({ type: 'timestamp with time zone', nullable: true })
    accepted_at: Date | null;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;
}
