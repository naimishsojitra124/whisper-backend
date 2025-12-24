import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import WebSocket, { WebSocketServer } from 'ws';

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
}

export default fp(async (app: FastifyInstance) => {
  const wss = new WebSocketServer({ noServer: true });

  // Upgrade HTTP → WebSocket
  app.server.on('upgrade', async (request, socket, head) => {
    try {
      const url = new URL(
        request.url || '',
        `http://${request.headers.host}`
      );

      const token = url.searchParams.get('token');

      if (!token) {
        socket.destroy();
        return;
      }

      const decoded = app.jwt.verify(token) as { userId: string };

      wss.handleUpgrade(request, socket, head, (ws) => {
        const authSocket = ws as AuthenticatedSocket;
        authSocket.userId = decoded.userId;

        wss.emit('connection', authSocket, request);
      });
    } catch {
      socket.destroy();
    }
  });

  // Connection handler
  wss.on('connection', (ws: AuthenticatedSocket) => {
    if (!ws.userId) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    app.log.info(
      { userId: ws.userId },
      'WebSocket connected'
    );

    ws.on('message', (data) => {
      // This is where chat logic goes later
      app.log.debug(
        { userId: ws.userId, data: data.toString() },
        'WS message'
      );
    });

    ws.on('close', () => {
      app.log.info(
        { userId: ws.userId },
        'WebSocket disconnected'
      );
    });
  });

  app.decorate('wss', wss);
});
