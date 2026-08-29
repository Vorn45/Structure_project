// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Unique, } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { User } from '../user/users.entity';

// ======================================= >> Code Starts Here << ========================== //
@Entity({ name: 'user_file_folder', schema: 'file' })
@Unique(['user_id', 'external_folder_id'])
export class UserFileFolder {
    @PrimaryGeneratedColumn('uuid') id: string;

    @Column({ type: 'int' }) user_id: number;
    @Column({ type: 'uuid', nullable: true }) parent_id: string;
    @Column({ type: 'int', nullable: true }) external_folder_id: number;
    @Column({ type: 'int', nullable: true }) parent_external_folder_id: number;
    @Column({ type: 'varchar', length: 150 }) name: string;
    @Column({ type: 'int', nullable: true }) created_by: number;

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;
    @DeleteDateColumn({ name: 'deleted_at' }) deleted_at: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) user: User;

    @ManyToOne(() => UserFileFolder, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parent_id' }) parent: UserFileFolder;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by' }) creator: User;
}
