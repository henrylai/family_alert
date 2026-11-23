import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { db } from '../db/index.js';
import { isAuthenticatedCookie } from '../auth.js';

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // The universal password gate also covers realtime: without the
  // session cookie (when APP_PASSWORD is set) the handshake is refused,
  // so nobody outside the password can listen in on a family group.
  io.use((socket, next) => {
    if (!isAuthenticatedCookie(socket.handshake.headers.cookie)) {
      return next(new Error('Password required'));
    }
    return next();
  });

  io.on('connection', (socket: Socket) => {
    // Member joins their family group room
    socket.on('join_group', ({ groupId, memberId }: { groupId: string; memberId: string }) => {
      if (!groupId || !memberId) return;
      const member = db.getMemberById(memberId);
      if (!member || member.groupId !== groupId) {
        console.warn(`[Socket] Refused room join: member ${memberId} is not in group ${groupId}`);
        return;
      }
      socket.join(`group_${groupId}`);
      console.log(`[Socket] Member ${memberId} joined room group_${groupId}`);
    });

    socket.on('disconnect', () => {
      // Clean up connection
    });
  });

  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}
