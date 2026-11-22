import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { db } from '../db/index.js';

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    // Member joins their family group room
    socket.on('join_group', ({ groupId, memberId }: { groupId: string; memberId: string }) => {
      if (groupId) {
        socket.join(`group_${groupId}`);
        console.log(`[Socket] Member ${memberId} joined room group_${groupId}`);
      }
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
