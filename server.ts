import { createServer } from 'http';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handle);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: dev ? `http://${hostname}:${port}` : false,
      methods: ['GET', 'POST'],
    },
  });

  // Store io instance globally so API routes can emit events
  (global as any).__io = io;

  io.on('connection', (socket) => {
    console.log(`[socket.io] client connected: ${socket.id}`);

    socket.on('join:portal', (portalId: string) => {
      socket.join(`portal:${portalId}`);
    });

    socket.on('leave:portal', (portalId: string) => {
      socket.leave(`portal:${portalId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[socket.io] client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
