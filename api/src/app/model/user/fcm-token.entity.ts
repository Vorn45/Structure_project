// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { User }        from './users.entity';
import { FcmPlatform } from 'src/app/enum/fcm-platform.enum';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'fcm_tokens', schema: 'user' })
@Index(['token'], { unique: true })
export class FcmToken {
    @PrimaryGeneratedColumn('uuid') id: string;

    @Column({ type: 'int' }) user_id: number;
    @Column({ type: 'text' }) token: string;
    @Column({ type: 'enum', enum: FcmPlatform, default: FcmPlatform.WEB }) platform: FcmPlatform;
    @Column({ type: 'varchar', length: 255, nullable: true }) device_id: string | null;
    @Column({ type: 'timestamp', nullable: true }) last_used_at: Date | null;

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;

    @ManyToOne(() => User, (user) => user.fcm_tokens, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) user: User;
}
