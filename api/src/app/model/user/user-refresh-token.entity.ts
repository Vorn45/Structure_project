// ===========================================================================>> Third Party Library
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { User }         from './users.entity';
import { UserSessions } from './user_sessions.entity';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'user_refresh_token', schema: 'user' })
@Index(['token_hash'], { unique: true })
@Index(['family_id'])
export class UserRefreshToken {
    @PrimaryGeneratedColumn('uuid') declare id: string;

    @Column({ type: 'int' }) declare user_id: number;
    @Column({ type: 'int' }) declare user_session_id: number;
    @Column({ type: 'uuid' }) declare family_id: string;
    @Column({ type: 'varchar', length: 64 }) declare token_hash: string;
    @Column({ type: 'int', nullable: true }) declare active_role_id: number | null;
    @Column({ type: 'uuid', nullable: true })
    declare active_organization_id: string | null;
    @Column({ type: 'timestamp' }) declare expires_at: Date;
    @Column({ type: 'timestamp' }) declare idle_expires_at: Date;
    @Column({ type: 'timestamp', nullable: true }) declare used_at: Date | null;
    @Column({ type: 'timestamp', nullable: true }) declare revoked_at: Date | null;

    @CreateDateColumn({ name: 'created_at' }) declare created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) declare updated_at: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    declare user: User;

    @ManyToOne(() => UserSessions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_session_id' })
    declare session: UserSessions;
}
