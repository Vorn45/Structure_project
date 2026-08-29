// ===========================================================================>> Third Party Library
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { User } from './users.entity';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'qr_login_session', schema: 'user' })
export class QrLoginSession {
    @PrimaryGeneratedColumn() id: number;

    @Column({ name: 'user_id', type: 'int' }) user_id: number;
    @Column({ type: 'varchar', length: 100, unique: true }) qr_token: string;
    @Column({ type: 'varchar', length: 20, default: 'pending' }) status: string;
    @Column({ type: 'timestamp' }) expires_at: Date;
    @Column({ type: 'timestamp', nullable: true }) used_at: Date | null;

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) user: User;
}
