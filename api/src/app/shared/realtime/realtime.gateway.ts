import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import jwtConstants from 'shared/jwt/constants';

@WebSocketGateway({
    namespace: '/realtime',
    cors: {
        origin: '*',
        credentials: true,
    },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(RealtimeGateway.name);
    private userSocketMap = new Map<number, Set<string>>();

    handleConnection(client: Socket) {
        try {
            const token =
                client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

            let userId: number | null = null;
            if (token) {
                try {
                    const decoded = jwt.verify(token, jwtConstants.secret) as any;
                    userId = decoded?.user?.id || decoded?.id || null;
                } catch {
                    // Try decoding without verify if expired/demo token
                    const decoded = jwt.decode(token) as any;
                    userId = decoded?.user?.id || decoded?.id || null;
                }
            }

            if (userId) {
                (client as any).userId = userId;
                client.join(`user:${userId}`);
                if (!this.userSocketMap.has(userId)) {
                    this.userSocketMap.set(userId, new Set());
                }
                this.userSocketMap.get(userId)!.add(client.id);
            }

            this.logger.log(`[RealtimeGateway] Client connected: ${client.id} (User: ${userId ?? 'anon'})`);
        } catch (err: any) {
            this.logger.warn(`[RealtimeGateway] Connection handshake error: ${err?.message || err}`);
        }
    }

    handleDisconnect(client: Socket) {
        const userId = (client as any).userId;
        if (userId && this.userSocketMap.has(userId)) {
            const sockets = this.userSocketMap.get(userId)!;
            sockets.delete(client.id);
            if (sockets.size === 0) {
                this.userSocketMap.delete(userId);
            }
        }
        this.logger.log(`[RealtimeGateway] Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('project:join')
    handleProjectJoin(@ConnectedSocket() client: Socket, @MessageBody() projectId: string | number) {
        if (projectId) {
            client.join(`project:${projectId}`);
        }
    }

    @SubscribeMessage('organization:join')
    handleOrgJoin(@ConnectedSocket() client: Socket, @MessageBody() orgId: string | number) {
        if (orgId) {
            client.join(`org:${orgId}`);
        }
    }

    emitToAll(event: string, payload: any) {
        if (this.server) {
            this.server.emit(event, payload);
        }
    }

    emitToUser(userId: number, event: string, payload: any) {
        if (this.server) {
            this.server.to(`user:${userId}`).emit(event, payload);
        }
    }

    emitToProject(projectId: string | number, event: string, payload: any) {
        if (this.server) {
            this.server.to(`project:${projectId}`).emit(event, payload);
        }
    }

    emitNotification(notification: any, targetUserIds?: number[]) {
        if (!this.server) return;
        if (targetUserIds && targetUserIds.length > 0) {
            for (const uid of targetUserIds) {
                this.server.to(`user:${uid}`).emit('notification:new', notification);
            }
        } else {
            this.server.emit('notification:new', notification);
        }
    }

    emitTaskUpdated(taskPayload: { task_id: string | number; status_id?: number | null; project_id?: string | number | null }) {
        if (!this.server) return;
        this.server.emit('task:updated', taskPayload);
    }
}
