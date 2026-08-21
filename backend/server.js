import express from 'express';
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send("hello world");
});

app.get('/neymar', (req, res) => {
    res.send("hello sigma");
});

app.listen(PORT, () => {
    console.log(`servidor rodando na porta${PORT}`);
});