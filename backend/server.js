import express from 'express';
import { run } from './config/database.js';
import * as http from 'node:http';
import { Server } from 'socket.io';
import espRoute from './routes/espRoute.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

app.set('io', io);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const PORT = 3000;

app.get('/', (req, res) => {
  res.send('hello planta');
});

app.use('/esp', espRoute);

if (process.env.MONGODB_URI) {
  run();
} else {
  console.log('MongoDB não configurado; a rota do ESP32 continua funcionando sem banco.');
}

server.listen(PORT, () => {
  console.log(`servidor rodando na porta ${PORT}`);
});
