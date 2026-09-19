// ===========================================================================>> Core Library
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { User } from 'src/app/model/user/users.entity';
import { MeetingEntity } from 'src/app/model/meeting/meeting.entity';
import { CreateMeetingDto } from './meeting.dto';

export interface ScheduledMeetingItem {
    id: string;
    title: string;
    type: string;
    date: string;
    time: string;
    duration: string;
    roomCode: string;
    roomUrl: string;
    organizer: string;
    status: string;
    participants: Array<{ id?: number; name: string; avatar?: string | null; role?: string }>;
    agenda: string;
}

@Injectable()
export class MeetingService implements OnModuleInit {
    constructor(
        @InjectRepository(MeetingEntity)
        private readonly _meetingRepo: Repository<MeetingEntity>,
        @InjectRepository(User)
        private readonly _userRepo: Repository<User>,
    ) {}

    async onModuleInit(): Promise<void> {
        try {
            await this._meetingRepo.query(`
                CREATE SCHEMA IF NOT EXISTS "meeting";
                CREATE TABLE IF NOT EXISTS "meeting"."meetings" (
                    "id" VARCHAR(100) PRIMARY KEY,
                    "title" VARCHAR(255) NOT NULL,
                    "type" VARCHAR(50) DEFAULT 'wms',
                    "date" VARCHAR(50) NOT NULL,
                    "time" VARCHAR(50) NOT NULL,
                    "duration" VARCHAR(50) DEFAULT '៣០ នាទី',
                    "room_code" VARCHAR(100),
                    "room_url" TEXT,
                    "organizer" VARCHAR(255),
                    "organizer_id" INTEGER,
                    "status" VARCHAR(50) DEFAULT 'upcoming',
                    "participants" JSONB DEFAULT '[]'::jsonb,
                    "agenda" TEXT,
                    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
                    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
                );
            `);

            const count = await this._meetingRepo.count();
            if (count === 0) {
                const seedMeetings: Partial<MeetingEntity>[] = [
                    {
                        id: 'meet-01',
                        title: 'ប្រជុំត្រួតពិនិត្យប្រចាំសប្តាហ៍ Sprint 36',
                        type: 'wms',
                        date: new Date().toISOString().split('T')[0],
                        time: '០៩:០០ ព្រឹក',
                        duration: '៤៥ នាទី',
                        room_code: 'WMS-8839',
                        room_url: 'https://meet.wms.digital/room/WMS-8839',
                        organizer: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត',
                        organizer_id: 101,
                        status: 'upcoming',
                        participants: [
                            { name: 'PISETH PANHAVORN', avatar: null, role: 'Host' },
                            { name: 'PUM BRUSMUNY', avatar: null, role: 'Super Admin / Project Lead' },
                            { name: 'THA WINNER', avatar: null, role: 'Developer' },
                        ],
                        agenda: 'ត្រួតពិនិត្យ Task សម្រេចបានក្នុងសប្តាហ៍នេះ និងរៀបចំបញ្ចេញកំណែប្រែថ្មី (Deployment Release)',
                    },
                    {
                        id: 'meet-02',
                        title: 'ពិភាក្សា Architecture RBAC & Passkey V2',
                        type: 'google',
                        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                        time: '០២:០០ រសៀល',
                        duration: '៦០ នាទី',
                        room_code: 'meet.google.com/abc-defg-hij',
                        room_url: 'https://meet.google.com/abc-defg-hij',
                        organizer: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត',
                        organizer_id: 101,
                        status: 'upcoming',
                        participants: [
                            { name: 'PISETH PANHAVORN', avatar: null, role: 'Host' },
                            { name: 'PUM BRUSMUNY', avatar: null, role: 'Super Admin / Project Lead' },
                        ],
                        agenda: 'រៀបចំ Flow Passkey WebAuthn & Multi-Factor Authentication',
                    },
                ];

                for (const m of seedMeetings) {
                    await this._meetingRepo.save(this._meetingRepo.create(m));
                }
            }
        } catch (e) {
            console.warn('Meeting table init check skipped:', e);
        }
    }

    private async getAvatarMap(): Promise<Map<string, string>> {
        const avatarMap = new Map<string, string>();
        try {
            const users = await this._userRepo.find({
                relations: ['avatar_file'],
            });
            for (const u of users) {
                let avatarUrl: string | null = null;
                if (u.avatar_file?.uri) {
                    let domain = (u.avatar_file.file_domain || '').replace(/\/+$/, '');
                    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(domain.trim())) {
                        domain = '';
                    }
                    const uri = u.avatar_file.uri.replace(/^\/+/, '');
                    avatarUrl = domain ? `${domain}/${uri}` : `/${uri}`;
                } else if (u.telegram_photo_url) {
                    avatarUrl = u.telegram_photo_url;
                }
                if (avatarUrl) {
                    if (u.id) avatarMap.set(`id:${u.id}`, avatarUrl);
                    if (u.name_en) avatarMap.set(`name:${u.name_en.toLowerCase().trim()}`, avatarUrl);
                    if (u.name_kh) avatarMap.set(`name:${u.name_kh.toLowerCase().trim()}`, avatarUrl);
                }
            }
        } catch (e) {
            console.warn('Failed to load avatars for meetings:', e);
        }
        return avatarMap;
    }

    async getMeetings(_user: UserPayload) {
        try {
            const avatarMap = await this.getAvatarMap();
            const dbMeetings = await this._meetingRepo.find({
                order: { date: 'ASC', created_at: 'DESC' },
            });

            const mapped: ScheduledMeetingItem[] = dbMeetings.map((m) => {
                const participants = Array.isArray(m.participants) ? m.participants : [];
                const enrichedParticipants = participants.map((p: any) => {
                    const nameKey = (p.name || '').toLowerCase().trim();
                    let av = p.avatar;
                    if (!av || av.includes('placeholder')) {
                        if (p.id && avatarMap.has(`id:${p.id}`)) {
                            av = avatarMap.get(`id:${p.id}`);
                        } else if (avatarMap.has(`name:${nameKey}`)) {
                            av = avatarMap.get(`name:${nameKey}`);
                        }
                    }
                    return {
                        id: p.id,
                        name: p.name,
                        role: p.role || 'Participant',
                        avatar: av || null,
                    };
                });

                return {
                    id: m.id,
                    title: m.title,
                    type: m.type,
                    date: m.date,
                    time: m.time,
                    duration: m.duration,
                    roomCode: m.room_code || '',
                    roomUrl: m.room_url || '',
                    organizer: m.organizer || '',
                    status: m.status || 'upcoming',
                    participants: enrichedParticipants,
                    agenda: m.agenda || '',
                };
            });

            return {
                status_code: 200,
                message: 'Scheduled meetings retrieved successfully',
                data: mapped,
            };
        } catch (err) {
            console.error('Failed to get meetings from database:', err);
            return {
                status_code: 200,
                message: 'Scheduled meetings retrieved successfully',
                data: [],
            };
        }
    }

    async createMeeting(user: UserPayload, dto: CreateMeetingDto) {
        const id = `meet-${Date.now().toString().slice(-4)}`;
        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const roomCode = dto.type === 'google' ? `meet.google.com/${randomCode}` : `WMS-${randomCode}`;
        const roomUrl = dto.type === 'google' ? `https://${roomCode}` : `https://meet.wms.digital/room/${roomCode}`;
        const organizer = user?.name_en || user?.name_kh || 'User';

        const entity = this._meetingRepo.create({
            id,
            title: dto.title,
            type: dto.type || 'wms',
            date: dto.date,
            time: dto.time,
            duration: dto.duration || '៣០ នាទី',
            room_code: roomCode,
            room_url: roomUrl,
            organizer,
            organizer_id: user?.id || null,
            status: 'upcoming',
            participants: dto.participants || [
                { id: user?.id, name: organizer, avatar: (user?.avatar as any)?.uri || null, role: 'Organizer' },
            ],
            agenda: dto.agenda || '',
        });

        const saved = await this._meetingRepo.save(entity);

        const resultItem: ScheduledMeetingItem = {
            id: saved.id,
            title: saved.title,
            type: saved.type,
            date: saved.date,
            time: saved.time,
            duration: saved.duration,
            roomCode: saved.room_code,
            roomUrl: saved.room_url,
            organizer: saved.organizer,
            status: saved.status,
            participants: saved.participants,
            agenda: saved.agenda,
        };

        return {
            status_code: 201,
            message: 'Meeting scheduled successfully',
            data: resultItem,
        };
    }
}
