import express from 'express';
import { run } from './config/database.js';
import * as http from 'node:http';
import { Server } from 'socket.io';
import { authMiddleware } from './middlewares/tokenMiddleware.js';
import { registerRealtime } from './realtime/stream.js';
import AuthRouter from './routes/authRouter.js';
import EspRouter from './routes/espRouter.js';

const app = express();
const server = http.createServer(app);
export const io = new Server(server, { 
  cors: { origin: '*' } 
});

io.use(authMiddleware);
registerRealtime(io);

app.set('io', io);
app.use(express.json());
app.use('/auth', AuthRouter);
app.use('/esp', EspRouter);
const PORT = 3000;

app.get('/', (req, res) => {
  res.send("hello planta");
});

try {
  await run();
} catch (error) {
  console.error(`Falha ao conectar ao MongoDB: ${error.message}`);
  process.exit(1);
}

server.listen(PORT, () => {
  console.log(`servidor rodando na porta ${PORT}`);
});
