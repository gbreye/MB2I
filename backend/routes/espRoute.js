import express from 'express';
import espController from '../controllers/espController.js';

const router = express.Router();

router.get('/health', (req, res) => espController.health(req, res));

// Ingestão via GET (ex.: ESP simples com query string) ou leitura:
// - com sensores (?id=X&moisture=..&celsius=..&solarlight=..) -> salva no ESP `id`
// - só com id (?id=X) -> retorna o dado daquele ESP
// - sem nada -> lista todos
router.get('/data', (req, res) => espController.receiveOrShow(req, res));

// Leitura de um ESP específico
router.get('/data/:id', (req, res) => espController.showById(req, res));

// Ingestão via POST — exige `id` + moisture + celsius + solarlight
router.post('/data', (req, res) => espController.ingest(req, res));

export default router;
