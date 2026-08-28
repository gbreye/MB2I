import express from 'express';
import {run} from './config/database.js';
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send("hello planta");
});

run();

app.listen(PORT, () => {
    console.log(`servidor rodando na porta${PORT}`);
});