import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { env } from 'envs/env';
import { AuthService } from 'app/core/auth/auth.service';

export interface TaskUpdated {
    task_id: string;
    status_id: number | null;
    /** Present on project-scoped events; lets a board ignore updates for other projects. */
    project_id?: string | number | null;
}

export interface ChatUnread {
    room_id: string;
    project_id: string | number | null;
    sender_id: number | null;
}

export interface OrganizationMembersChanged {
    organization_id: string | number;
    member_total?: number;
    admins?: any[];
}

export interface OrganizationMemberPresence {
    organization_id: string | number;
    user_id: number;
    is_online: boolean;
    last_active_at: string | null;
}

/** A task changed in one of the organization's projects (created, status, edit). */
export interface OrganizationTasksChanged {
    organization_id: string | number;
    project_id: string | number | null;
}

/** A project's own metadata (name, logo) was edited — carries the new values directly
 *  (non-sensitive, already visible to anyone in the project) so viewers can update
 *  their header/listing card in place without an extra fetch. */
export interface ProjectUpdated {
    project_id: string | number;
    name_en?: string | null;
    name_kh?: string | null;
    short_name_en?: string | null;
    image?: { uri?: string | null; file_domain?: string | null } | null;
}
export interface OrganizationPositionOfficeChanged {
    organization_id: string | number;
    kind: 'organization' | 'office';
}

export interface ActivityChanged {
    project_id: string | number;
    activity_id: string;
    action: 'created' | 'updated' | 'deleted';
}

export interface ChatRead {
    room_id: string;
    project_id: string | number | null;
    reader_id: number;
    last_read_at: string;
}

/** A member's client just became reachable (socket connected) or a just-sent message
 *  reached an already-online recipient — drives the "delivered" (double-check) tick. */
export interface ChatDelivered {
    room_id: string;
    member_ids: number[];
    last_delivered_at: string;
}

/** A member is actively composing text or picking a file to attach in a task
 *  chat room — ephemeral, drives a WhatsApp-style "X is typing…" hint.
 *  `state: null` means they stopped. */
export interface ChatTyping {
    room_id: string;
    user_id: number;
    state: 'text' | 'file' | null;
}

/** A notification row was just created for the current user (server emits the saved row). */
export interface NotificationNew {
    id: string;
    [key: string]: any;
}

/** An MCP agent just acted on a task — ephemeral, never persisted. Drives a
 *  "<bot> is working on this…" hint the same way ChatTyping drives a human one. */
export interface AgentActivity {
    room_id: string;
    bot_id: number;
    name: string;
}


@Injectable({ providedIn: 'root' })
export class TaskSocketService {

    private _socket                         : Socket | null = null;
    private readonly _tasks                 = new Subject<TaskUpdated>();
    private readonly _chatUnread            = new Subject<ChatUnread>();
    private readonly _chatRead              = new Subject<ChatRead>();
    private readonly _chatDelivered         = new Subject<ChatDelivered>();
    private readonly _chatTyping            = new Subject<ChatTyping>();
    private readonly _agentActivity         = new Subject<AgentActivity>();
    private readonly _organizationMembers   = new Subject<OrganizationMembersChanged>();
    private readonly _organizationPresence  = new Subject<OrganizationMemberPresence>();
    private readonly _organizationTasks     = new Subject<OrganizationTasksChanged>();
    private readonly _organizationPositionOffice = new Subject<OrganizationPositionOfficeChanged>();
    private readonly _activity              = new Subject<ActivityChanged>();
    private readonly _notifications         = new Subject<NotificationNew>();
    private readonly _projectUpdated        = new Subject<ProjectUpdated>();

    constructor(private _auth: AuthService) {}

    private _base(): string {
        const explicit = (env as { SOCKET_URL?: string }).SOCKET_URL;
        if (explicit) return explicit.replace(/\/api\/?$/, '');
        return env.API_BASE_URL.replace(/\/api\/?$/, '');
    }
    private readonly _projectRooms = new Map<string, number>();
    private readonly _organizationRooms = new Map<string, number>();

    private _connect(): Socket {
        if (this._socket) return this._socket;
        const socket = io(`${this._base()}/realtime`, {
            transports: ['websocket'],
            auth: { token: this._auth.accessToken },
        });
        socket.on('task:updated', (payload: TaskUpdated) => this._tasks.next(payload));
        socket.on('chat:unread', (payload: ChatUnread) => this._chatUnread.next(payload));
        socket.on('chat:read', (payload: ChatRead) => this._chatRead.next(payload));
        socket.on('chat:delivered', (payload: ChatDelivered) => this._chatDelivered.next(payload));
        socket.on('chat:typing', (payload: ChatTyping) => this._chatTyping.next(payload));
        socket.on('chat:agent_activity', (payload: AgentActivity) => this._agentActivity.next(payload));
        socket.on('organization:members-changed', (payload: OrganizationMembersChanged) =>
            this._organizationMembers.next(payload),
        );
        socket.on('organization:member-presence', (payload: OrganizationMemberPresence) =>
            this._organizationPresence.next(payload),
        );
        socket.on('organization:tasks-changed', (payload: OrganizationTasksChanged) =>
            this._organizationTasks.next(payload),
        );
        socket.on('organization:position-office-changed', (payload: OrganizationPositionOfficeChanged) =>
            this._organizationPositionOffice.next(payload),
        );
        socket.on('activity:changed', (payload: ActivityChanged) => this._activity.next(payload));
        socket.on('notification:new', (payload: NotificationNew) => this._notifications.next(payload));
        socket.on('project:updated', (payload: ProjectUpdated) => this._projectUpdated.next(payload));
        socket.on('connect', () => {
            console.debug('[realtime] connected', socket.id);
            this._projectRooms.forEach((_count, id) => socket.emit('project:join', id));
            this._organizationRooms.forEach((_count, id) => socket.emit('organization:join', id));
        });
        socket.on('connect_error', (err) => console.warn('[realtime] connect_error', err?.message || err));
        socket.on('disconnect', (reason) => console.debug('[realtime] disconnected', reason));
        this._socket = socket;
        return socket;
    }

    /** Subscribe to a project board's live task events (create / status / edit). */
    joinProject(projectId: string | number): void {
        const id = String(projectId);
        if (!id) return;
        const next = (this._projectRooms.get(id) ?? 0) + 1;
        this._projectRooms.set(id, next);
        // Only the first subscriber needs to tell the server to join the room.
        if (next === 1) this._connect().emit('project:join', id);
        else this._connect();
    }

    leaveProject(projectId: string | number): void {
        const id = String(projectId);
        if (!id) return;
        const count = this._projectRooms.get(id) ?? 0;
        if (count <= 1) {
            this._projectRooms.delete(id);
            this._socket?.emit('project:leave', id);
        } else {
            this._projectRooms.set(id, count - 1);
        }
    }
    /** Subscribe to an organization's live membership events (add/remove/role). */
    joinOrganization(organizationId: string | number): void {
        const id = String(organizationId);
        if (!id) return;
        const next = (this._organizationRooms.get(id) ?? 0) + 1;
        this._organizationRooms.set(id, next);
        if (next === 1) this._connect().emit('organization:join', id);
        else this._connect();
    }

    leaveOrganization(organizationId: string | number): void {
        const id = String(organizationId);
        if (!id) return;
        const count = this._organizationRooms.get(id) ?? 0;
        if (count <= 1) {
            this._organizationRooms.delete(id);
            this._socket?.emit('organization:leave', id);
        } else {
            this._organizationRooms.set(id, count - 1);
        }
    }

    /** Fires when an org's membership changes (member added/removed, role change). */
    organizationMembersChanges(): Observable<OrganizationMembersChanged> {
        this._connect();
        return this._organizationMembers.asObservable();
    }

    /** Fires when an organization member's first socket connects or last socket disconnects. */
    organizationMemberPresence(): Observable<OrganizationMemberPresence> {
        this._connect();
        return this._organizationPresence.asObservable();
    }
    organizationTaskChanges(): Observable<OrganizationTasksChanged> {
        this._connect();
        return this._organizationTasks.asObservable();
    }
    organizationPositionOfficeChanges(): Observable<OrganizationPositionOfficeChanged> {
        this._connect();
        return this._organizationPositionOffice.asObservable();
    }

    taskUpdates(): Observable<TaskUpdated> {
        this._connect();
        return this._tasks.asObservable();
    }
    /** Fires when the server creates a notification row for the current user. */
    notifications(): Observable<NotificationNew> {
        this._connect();
        return this._notifications.asObservable();
    }
    activityChanges(): Observable<ActivityChanged> {
        this._connect();
        return this._activity.asObservable();
    }
    /** Fires when a project's name/logo is edited by anyone viewing it (self included, other tabs/devices). */
    projectUpdates(): Observable<ProjectUpdated> {
        this._connect();
        return this._projectUpdated.asObservable();
    }
    chatUnreads(): Observable<ChatUnread> {
        this._connect();
        return this._chatUnread.asObservable();
    }
    chatReads(): Observable<ChatRead> {
        this._connect();
        return this._chatRead.asObservable();
    }
    chatDelivereds(): Observable<ChatDelivered> {
        this._connect();
        return this._chatDelivered.asObservable();
    }
    typingUpdates(): Observable<ChatTyping> {
        this._connect();
        return this._chatTyping.asObservable();
    }
    sendTyping(roomId: string, state: 'text' | 'file' | null): void {
        if (!roomId) return;
        this._connect().emit('chat:typing', { room_id: roomId, state });
    }
    /** Fires when an MCP agent acts on a task in a room the current user belongs to. */
    agentActivityUpdates(): Observable<AgentActivity> {
        this._connect();
        return this._agentActivity.asObservable();
    }
}
