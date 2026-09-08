import { Injectable } from '@nestjs/common';
import { UserPayload } from 'src/app/interface/jwt.interface';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import {
    MarkReadManyDto,
    QueryChatNotificationDto,
    QueryNotificationDto,
    QueryTaskChatNotificationDto,
    SaveFcmTokenDto,
    UpdateNotificationSettingDto,
} from './notification.dto';

export interface NotificationItem {
    id: string;
    type: string;
    title: string;
    title_kh: string;
    title_en: string;
    message: string;
    message_kh: string;
    message_en: string;
    data?: any;
    is_unread: boolean;
    read_at: string | null;
    created_at: string;
    organization?: {
        id: string;
        name_en?: string;
        name_kh?: string;
        avatar?: { id?: number; uri?: string | null; file_domain?: string | null; url?: string | null } | null;
    } | null;
    project?: {
        id: string;
        name_en?: string;
        name_kh?: string;
        short_name_en?: string;
        short_name_kh?: string;
        avatar?: { id?: number; uri?: string | null; file_domain?: string | null; url?: string | null } | null;
    } | null;
    task?: {
        id: number | string;
        task_code?: string;
        title?: string;
        avatar?: { id?: number; uri?: string | null; file_domain?: string | null; url?: string | null } | null;
    } | null;
    last_message?: {
        source: 'message' | 'activity';
        id: string;
        content: string;
        field_name?: string | null;
        sender_id: number;
        chat_message_type_id: number | null;
        created_at: string;
        sender?: { id: number; name_en?: string; name_kh?: string; avatar?: any } | null;
    } | null;
}

@Injectable()
export class NotificationService {
    private notifications: NotificationItem[] = [
        {
            id: 'notif_1',
            type: 'task_assigned',
            title: 'ភារកិច្ចថ្មីត្រូវបានចាត់តាំង',
            title_kh: 'ភារកិច្ចថ្មីត្រូវបានចាត់តាំង',
            title_en: 'New Task Assigned',
            message: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត បានចាត់តាំងភារកិច្ច "#WMS-0000: Org Admin | Structure | Department" ជូនអ្នក។',
            message_kh: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត បានចាត់តាំងភារកិច្ច "#WMS-0000: Org Admin | Structure | Department" ជូនអ្នក។',
            message_en: 'You have been assigned to task #WMS-0000: Org Admin | Structure | Department',
            is_unread: true,
            read_at: null,
            created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
            organization: {
                id: 'org_1',
                name_en: 'Digitech Systems',
                name_kh: 'ឌីជីថេក ស៊ីស្ទឹម',
                avatar: { uri: 'images/logo/default_logo.png' },
            },
            project: {
                id: 'wms-digitech',
                name_en: 'WMS Digitech',
                name_kh: 'WMS ឌីជីថេក',
                short_name_en: 'WMS Digitech',
                short_name_kh: 'WMS ឌីជីថេក',
                avatar: { uri: 'images/logo/default_logo.png' },
            },
            task: {
                id: 1,
                task_code: '#WMS-0000',
                title: 'ភារកិច្ចថ្មីត្រូវបានចាត់តាំង (#WMS-0000)',
            },
            last_message: {
                source: 'activity',
                id: 'msg_1',
                content: 'បានចាត់តាំងភារកិច្ច "#WMS-0000: Org Admin | Structure" ជូនអ្នក',
                sender_id: 1,
                chat_message_type_id: 1,
                created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
                sender: { id: 1, name_en: 'PISETH PANHAVORN', name_kh: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត' },
            },
        },
        {
            id: 'notif_2',
            type: 'error_alert',
            title: 'បញ្ហាបច្ចេកទេសការងារ (Build Issue)',
            title_kh: 'បញ្ហាបច្ចេកទេសការងារ',
            title_en: 'Task Build Issue',
            message: 'ការបញ្ជូនទិន្នន័យលើ pipeline BMS Digitech មានបញ្ហា សូមពិនិត្យ។',
            message_kh: 'ការបញ្ជូនទិន្នន័យលើ pipeline BMS Digitech មានបញ្ហា សូមពិនិត្យ។',
            message_en: 'A deployment issue was detected in BMS Digitech pipeline',
            is_unread: true,
            read_at: null,
            created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            organization: {
                id: 'org_1',
                name_en: 'Digitech Systems',
                name_kh: 'ឌីជីថេក ស៊ីស្ទឹម',
            },
            project: {
                id: 'bms-digitech',
                name_en: 'BMS Digitech',
                name_kh: 'BMS ឌីជីថេក',
                short_name_en: 'BMS Digitech',
                short_name_kh: 'BMS ឌីជីថេក',
            },
            task: {
                id: 2,
                task_code: '#BMS-0000',
                title: 'បញ្ហាបច្ចេកទេសការងារ (#BMS-0000)',
            },
            last_message: {
                source: 'message',
                id: 'msg_2',
                content: 'ការបញ្ជូនទិន្នន័យលើ pipeline BMS Digitech មានបញ្ហា សូមពិនិត្យ',
                sender_id: 3,
                chat_message_type_id: 1,
                created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
                sender: { id: 3, name_en: 'THA WINNER', name_kh: 'ថា វីនណឺរ' },
            },
        },
        {
            id: 'notif_3',
            type: 'account_update',
            title: 'ការកែប្រែគណនី (Account Update)',
            title_kh: 'ការកែប្រែគណនី',
            title_en: 'Account Update',
            message: 'ការកំណត់សិទ្ធិ និងព័ត៌មានគណនីរបស់អ្នកត្រូវបានធ្វើបច្ចុប្បន្នភាព។',
            message_kh: 'ការកំណត់សិទ្ធិ និងព័ត៌មានគណនីរបស់អ្នកត្រូវបានធ្វើបច្ចុប្បន្នភាព។',
            message_en: 'Account profile & permission settings have been updated.',
            is_unread: false,
            read_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            last_message: {
                source: 'activity',
                id: 'msg_3',
                content: 'ព័ត៌មានគណនី និងសិទ្ធិត្រូវបានធ្វើបច្ចុប្បន្នភាព',
                sender_id: 1,
                chat_message_type_id: 1,
                created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            },
        },
        {
            id: 'notif_4',
            type: 'feature_announcement',
            title: 'ការប្រកាសមុខងារថ្មី (New Feature)',
            title_kh: 'ការប្រកាសមុខងារថ្មី',
            title_en: 'Feature Announcement',
            message: 'មុខងារថ្មីត្រូវបានដាក់ឱ្យប្រើប្រាស់៖ Kanban Board & Real-time Notification។',
            message_kh: 'មុខងារថ្មីត្រូវបានដាក់ឱ្យប្រើប្រាស់៖ Kanban Board & Real-time Notification។',
            message_en: 'New feature released: Enhanced Kanban board & real-time notifications.',
            is_unread: false,
            read_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            last_message: {
                source: 'activity',
                id: 'msg_4',
                content: 'មុខងារថ្មីត្រូវបានដាក់ឱ្យប្រើប្រាស់៖ Kanban Board & Real-time Notification',
                sender_id: 1,
                chat_message_type_id: 1,
                created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            },
        },
        {
            id: 'notif_5',
            type: 'system_alert',
            title: 'វត្តមានប្រចាំថ្ងៃ (Daily Attendance)',
            title_kh: 'វត្តមានប្រចាំថ្ងៃ',
            title_en: 'Daily Attendance',
            message: 'អ្នកបានចុះវត្តមានចូលធ្វើការ (Check-In) ដោយជោគជ័យនៅម៉ោង 8:00 AM។',
            message_kh: 'អ្នកបានចុះវត្តមានចូលធ្វើការ (Check-In) ដោយជោគជ័យនៅម៉ោង 8:00 AM។',
            message_en: 'You successfully checked in today at 8:00 AM.',
            is_unread: false,
            read_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
            last_message: {
                source: 'activity',
                id: 'msg_5',
                content: 'បានចុះវត្តមានចូលធ្វើការ (Check-In) ដោយជោគជ័យនៅម៉ោង 8:00 AM',
                sender_id: 1,
                chat_message_type_id: 1,
                created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
            },
        },
    ];

    private settingsMap = new Map<string, any>();
    private fcmTokens: Set<string> = new Set();

    async getNotifications(user: UserPayload, query: QueryNotificationDto) {
        const limit = query?.limit ? Number(query.limit) : 30;
        const offset = query?.offset ? Number(query.offset) : 0;
        const unreadOnly = query?.unread_only === 'true' || query?.unread_only === true;

        let filtered = [...this.notifications];
        if (unreadOnly) {
            filtered = filtered.filter((n) => n.is_unread);
        }

        const total = filtered.length;
        const unreadCount = this.notifications.filter((n) => n.is_unread).length;
        const results = filtered.slice(offset, offset + limit);

        return {
            status_code: 200,
            message: 'Notifications retrieved successfully',
            data: {
                results,
                total,
                unread_count: unreadCount,
                limit,
                offset,
            },
        };
    }

    async getUnreadCount(user: UserPayload) {
        const unreadCount = this.notifications.filter((n) => n.is_unread).length;
        return {
            status_code: 200,
            message: 'Unread count retrieved successfully',
            data: {
                unread_count: unreadCount,
            },
        };
    }

    async markRead(user: UserPayload, id: string) {
        const notif = this.notifications.find((n) => n.id === id);
        if (notif) {
            notif.is_unread = false;
            notif.read_at = new Date().toISOString();
        }
        return {
            status_code: 200,
            message: 'Notification marked as read',
            data: notif || null,
        };
    }

    async markReadMany(user: UserPayload, dto: MarkReadManyDto) {
        const ids = dto?.ids || [];
        for (const n of this.notifications) {
            if (ids.includes(n.id)) {
                n.is_unread = false;
                n.read_at = new Date().toISOString();
            }
        }
        return {
            status_code: 200,
            message: 'Notifications marked as read',
            data: {
                updated_count: ids.length,
            },
        };
    }

    async markAllAsRead(user: UserPayload) {
        for (const n of this.notifications) {
            n.is_unread = false;
            n.read_at = new Date().toISOString();
        }
        return {
            status_code: 200,
            message: 'All notifications marked as read',
            data: {
                unread_count: 0,
            },
        };
    }

    async deleteNotification(user: UserPayload, id: string) {
        this.notifications = this.notifications.filter((n) => n.id !== id);
        return {
            status_code: 200,
            message: 'Notification deleted successfully',
            data: { id },
        };
    }

    async getChatList(user: UserPayload, query: QueryChatNotificationDto) {
        return {
            status_code: 200,
            message: 'Chat notifications retrieved successfully',
            data: [
                {
                    project_id: 'bms-digitech',
                    room_id: 'room_bms',
                    unread_count: 1,
                    is_muted: false,
                    is_pinned: true,
                    project: {
                        id: 'bms-digitech',
                        name_en: 'BMS Digitech',
                        name_kh: 'BMS ឌីជីថេក',
                    },
                    last_message: {
                        id: 'msg_bms_1',
                        content: 'សូមជួយ review pull request ថ្មីផង!',
                        sender: { id: 2, name_en: 'Pum Brusmuny', name_kh: 'ពុំ ប្រុសមុន្នី' },
                        created_at: new Date().toISOString(),
                    },
                    last_message_at: new Date().toISOString(),
                },
            ],
        };
    }

    async getOrganizationChatList(user: UserPayload, query: QueryChatNotificationDto) {
        return {
            status_code: 200,
            message: 'Organization chat notifications retrieved successfully',
            data: [
                {
                    organization_id: 'org_1',
                    room_id: 'room_org_1',
                    unread_count: 0,
                    is_muted: false,
                    organization: {
                        id: 'org_1',
                        name_en: 'Digitech HQ',
                        name_kh: 'ទីស្នាក់ការកណ្តាល ឌីជីថេក',
                    },
                    last_message: {
                        id: 'msg_org_1',
                        content: 'សូមស្វាគមន៍មកកាន់ប្រព័ន្ធគ្រប់គ្រងការងារ WFM!',
                        sender: { id: 1, name_en: 'Piseth Panhavorn', name_kh: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត' },
                        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
                    },
                    last_message_at: new Date(Date.now() - 3600000 * 24).toISOString(),
                },
            ],
        };
    }

    async getTaskChatList(user: UserPayload, query: QueryTaskChatNotificationDto) {
        return {
            status_code: 200,
            message: 'Task chats retrieved successfully',
            data: {
                rows: [
                    {
                        task_id: '1',
                        room_id: 'task_chat_1',
                        unread_count: 1,
                        task: {
                            id: '1',
                            task_code: '#WMS-0000',
                            title: 'Org Admin | Structure | Department',
                            status: { id: 1, name_en: 'In Review', name_kh: 'កំពុងត្រួតពិនិត្យ' },
                            priority: { id: 1, name_en: 'High', name_kh: 'ខ្ពស់' },
                            type: { id: 1, name_en: 'Feature', name_kh: 'មុខងារ' },
                            reporter: { id: 1, name_en: 'Piseth Panhavorn', name_kh: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត' },
                            assignee_ids: [1],
                            project_id: 'wms-digitech',
                            project: { id: 'wms-digitech', name_en: 'WMS Digitech', name_kh: 'WMS ឌីជីថេក' },
                        },
                        last_message: {
                            id: 'msg_tc_1',
                            content: 'ភារកិច្ច #WMS-0000 ត្រូវបានបង្កើត និងចាត់តាំង',
                            sender: { id: 1, name_en: 'Piseth Panhavorn', name_kh: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត' },
                            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                        },
                        last_message_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                    },
                ],
                total: 1,
            },
        };
    }

    async getSettings(user: UserPayload, scope?: string) {
        const key = `${user?.id || 'default'}_${scope || 'general'}`;
        const existing = this.settingsMap.get(key) || {
            enabled: true,
            muted_until: null,
            sound: true,
            web: true,
            web_muted_until: null,
            mobile: true,
            email: true,
            telegram: true,
        };
        return {
            status_code: 200,
            message: 'Notification settings retrieved successfully',
            data: existing,
        };
    }

    async updateSettings(user: UserPayload, dto: UpdateNotificationSettingDto, scope?: string) {
        const key = `${user?.id || 'default'}_${scope || 'general'}`;
        const current = this.settingsMap.get(key) || {
            enabled: true,
            muted_until: null,
            sound: true,
            web: true,
            web_muted_until: null,
            mobile: true,
            email: true,
            telegram: true,
        };
        const updated = { ...current, ...dto };
        this.settingsMap.set(key, updated);
        return {
            status_code: 200,
            message: 'Notification settings updated successfully',
            data: updated,
        };
    }

    async getFirebaseConfig() {
        return {
            status_code: 200,
            message: 'Firebase config retrieved',
            data: {
                apiKey: 'AIzaSyDemoConfigForWfmAppPushNotifications',
                authDomain: 'wfm-app.firebaseapp.com',
                projectId: 'wfm-app',
                storageBucket: 'wfm-app.appspot.com',
                messagingSenderId: '123456789012',
                appId: '1:123456789012:web:abcdef123456',
                vapidKey: 'BMockVapidKeyForWebPushNotificationTokens',
            },
        };
    }

    async saveFcmToken(user: UserPayload, dto: SaveFcmTokenDto) {
        if (dto?.token) {
            this.fcmTokens.add(dto.token);
        }
        return {
            status_code: 200,
            message: 'FCM token registered successfully',
            data: { token: dto?.token },
        };
    }

    async deleteFcmToken(user: UserPayload, token: string) {
        if (token) {
            this.fcmTokens.delete(token);
        }
        return {
            status_code: 200,
            message: 'FCM token removed successfully',
            data: { token },
        };
    }

    constructor(private readonly _realtimeGateway?: RealtimeGateway) {}

    async simulateTestNotification(user?: UserPayload) {
        const idNum = Math.floor(Math.random() * 9000) + 1000;
        const senderName = user?.name_kh || user?.name_en || 'ពិសិដ្ឋ បញ្ញាវ័ន្ត (Piseth)';
        const testNotif: NotificationItem = {
            id: 'notif_live_' + Date.now(),
            type: 'task_assigned',
            title: 'ភារកិច្ចថ្មីត្រូវបានចាត់តាំង',
            title_kh: 'ភារកិច្ចថ្មីត្រូវបានចាត់តាំង',
            title_en: 'New Task Assigned',
            message: `${senderName} បានចាត់តាំងភារកិច្ច "#WMS-${idNum}: Real-time Notification System" ជូនអ្នក។`,
            message_kh: `${senderName} បានចាត់តាំងភារកិច្ច "#WMS-${idNum}: Real-time Notification System" ជូនអ្នក។`,
            message_en: `${senderName} assigned task "#WMS-${idNum}: Real-time Notification System" to you.`,
            is_unread: true,
            read_at: null,
            created_at: new Date().toISOString(),
            organization: {
                id: 'org_1',
                name_en: 'Digitech Systems',
                name_kh: 'ឌីជីថេក ស៊ីស្ទឹម',
                avatar: { uri: 'images/logo/default_logo.png' },
            },
            project: {
                id: 'wms-digitech',
                name_en: 'WMS Digitech',
                name_kh: 'WMS ឌីជីថេក',
                short_name_en: 'WMS Digitech',
                short_name_kh: 'WMS ឌីជីថេក',
                avatar: { uri: 'images/logo/default_logo.png' },
            },
            task: {
                id: idNum,
                task_code: `#WMS-${idNum}`,
                title: `Real-time Notification System (#WMS-${idNum})`,
            },
            last_message: {
                source: 'activity',
                id: 'msg_' + Date.now(),
                content: `បានចាត់តាំងភារកិច្ច "#WMS-${idNum}: Real-time Notification" ជូនអ្នក`,
                sender_id: user?.id || 1,
                chat_message_type_id: 1,
                created_at: new Date().toISOString(),
                sender: { id: user?.id || 1, name_en: senderName, name_kh: senderName },
            },
        };

        return await this.pushNotification(testNotif);
    }

    async pushNotification(notification: NotificationItem, targetUserIds?: number[]) {
        notification.is_unread = true;
        notification.read_at = null;
        if (!notification.created_at) {
            notification.created_at = new Date().toISOString();
        }
        this.notifications.unshift(notification);
        if (this._realtimeGateway) {
            this._realtimeGateway.emitNotification(notification, targetUserIds);
        }
        return {
            status_code: 201,
            message: 'Notification pushed successfully',
            data: notification,
        };
    }
}
