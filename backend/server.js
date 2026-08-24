import express from 'express';
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send("hello planta");
});

app.get('/dispositivo', (req, res) => {
    res.send("hello dispositivo");
});

app.get('/conta', (req, res) => {
    res.send("hello user");
});

app.get('/conta/login', (req, res) => {
    res.send("hello user");
});

app.get('/conta/config', (req, res) => {
    res.send("hello user");
});

app.listen(PORT, () => {
    console.log(`servidor rodando na porta${PORT}`);
});