// ===========================================================================>> Third Party Library
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { User } from './users.entity';

// ======================================= >> Code Starts Here << ========================== //
/**
 * A user's Org Admin homepage layout — which of the 6 dashboard sections show
 * (and in what order) versus sit in the "backlog" panel, plus which ones are
 * pinned to a full-width row instead of the normal 2-per-row layout. One row
 * per user; a missing row means "default order, empty backlog, no full-width
 * sections", so users who never open the customize menu keep seeing today's
 * fixed layout.
 */
@Entity({ name: 'home_layout_setting', schema: 'user' })
export class HomeLayoutSetting {
    @PrimaryGeneratedColumn('uuid') id: string;

    @Index({ unique: true })
    @Column({ type: 'int' }) user_id: number;

    @Column({ type: 'jsonb', default: () => `'[]'::jsonb` }) visible_order: string[];
    @Column({ type: 'jsonb', default: () => `'[]'::jsonb` }) backlog_order: string[];
    /** Section keys rendered full-width instead of sharing a 2-column row. */
    @Column({ type: 'jsonb', default: () => `'[]'::jsonb` }) wide_sections: string[];

    @CreateDateColumn({ name: 'created_at' }) created_at: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) user: User;
}
