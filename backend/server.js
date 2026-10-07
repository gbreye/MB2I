import express from 'express';
import { run } from './config/database.js';
import * as http from 'node:http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: '*' } 
});

app.set('io', io);
const PORT = 3000;

app.get('/', (req, res) => {
  res.send("hello planta");
});

run();

server.listen(PORT, () => {
  console.log(`servidor rodando na porta ${PORT}`);
});
