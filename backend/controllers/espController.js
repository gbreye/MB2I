// Fallback em memória (por espId) para quando o Mongo não está configurado.
// Garante que a rota do ESP32 continua funcionando sem banco (ou sem o
// pacote `mongoose` instalado).
const memoryStore = new Map();

let cachedDb = null;
const getDb = async () => {
  if (cachedDb) return cachedDb;
  try {
    const [{ default: mongoose }, { default: EspData }] = await Promise.all([
      import("mongoose"),
      import("../models/EspData.js"),
    ]);
    cachedDb = { mongoose, EspData };
  } catch {
    cachedDb = null;
  }
  return cachedDb;
};

const isDbReady = (db) => {
  try {
    return !!db && db.mongoose.connection?.readyState === 1;
  } catch {
    return false;
  }
};

const parseNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const normalizeId = (value) => {
  if (value === undefined || value === null) return null;
  const id = String(value).trim();
  return id === "" ? null : id;
};

// Toda requisição do ESP vem com id (body, query, params ou header).
const extractEspId = (req) => {
  const body = req.body ?? {};
  const query = req.query ?? {};
  const params = req.params ?? {};

  return (
    normalizeId(body.id) ??
    normalizeId(body.espId) ??
    normalizeId(body.esp_id) ??
    normalizeId(body.deviceId) ??
    normalizeId(params.id) ??
    normalizeId(query.id) ??
    normalizeId(query.espId) ??
    normalizeId(req.headers?.["x-esp-id"]) ??
    null
  );
};

const normalizePayload = (req) => {
  const body = req.body ?? {};
  const query = req.query ?? {};

  const moisture = parseNumber(body.moisture ?? query.moisture);
  const celsius = parseNumber(
    body.celsius ??
      body.temperature ??
      body.celcius ??
      query.celsius ??
      query.temperature ??
      query.celcius,
  );
  const solarlight = parseNumber(
    body.solarlight ?? body.solarLight ?? query.solarlight ?? query.solarLight,
  );

  return { moisture, celsius, solarlight };
};

const toReading = (espId, doc) => ({
  espId,
  moisture: doc?.moisture ?? null,
  celsius: doc?.celsius ?? null,
  solarlight: doc?.solarlight ?? null,
  updatedAt: doc?.updatedAt
    ? new Date(doc.updatedAt).toISOString()
    : new Date().toISOString(),
});

// Adiciona os dados em determinado dispositivo (upsert por espId).
const saveReading = async (espId, { moisture, celsius, solarlight }) => {
  const now = new Date();
  memoryStore.set(espId, {
    espId,
    moisture,
    celsius,
    solarlight,
    updatedAt: now.toISOString(),
  });

  const db = await getDb();
  if (isDbReady(db)) {
    const doc = await db.EspData.findOneAndUpdate(
      { espId },
      { espId, moisture, celsius, solarlight },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return doc.toReading();
  }

  return memoryStore.get(espId);
};

const findReading = async (espId) => {
  const db = await getDb();
  if (isDbReady(db)) {
    const doc = await db.EspData.findOne({ espId }).lean();
    if (doc) return toReading(espId, doc);
  }
  return memoryStore.get(espId) ?? null;
};

const findAllReadings = async () => {
  const db = await getDb();
  if (isDbReady(db)) {
    const docs = await db.EspData.find({}).lean();
    if (docs.length > 0) return docs.map((doc) => toReading(doc.espId, doc));
  }
  return [...memoryStore.values()];
};

const emitRealtime = (req, reading) => {
  try {
    req.app?.get?.("io")?.emit("esp:data", reading);
  } catch {
    // realtime é opcional; nunca quebra a ingestão
  }
};

class EspController {
  health(_req, res) {
    return res.json({ ok: true, message: "ESP32 route ready" });
  }

  // POST /esp/data — ingestão estrita: exige id + 3 sensores.
  async ingest(req, res) {
    const espId = extractEspId(req);
    if (!espId) {
      return res.status(400).json({
        success: false,
        message: "Campo 'id' do ESP é obrigatório (body, query ou header x-esp-id).",
      });
    }

    const { moisture, celsius, solarlight } = normalizePayload(req);
    if (moisture === null || celsius === null || solarlight === null) {
      return res.status(400).json({
        success: false,
        message: "Body/Query inválido. Envie moisture, celsius e solarlight.",
      });
    }

    try {
      const reading = await saveReading(espId, { moisture, celsius, solarlight });
      emitRealtime(req, reading);
      return res.status(200).json({
        success: true,
        message: "Dados do vaso recebidos",
        data: reading,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Erro ao salvar leitura" });
    }
  }

  // GET /esp/data?id=XXX[&sensores...] — com sensores faz ingestão,
  // sem sensores apenas retorna o dado daquele id.
  async receiveOrShow(req, res) {
    const espId = extractEspId(req);
    const { moisture, celsius, solarlight } = normalizePayload(req);
    const hasSensors = moisture !== null || celsius !== null || solarlight !== null;

    if (hasSensors) {
      if (!espId) {
        return res.status(400).json({
          success: false,
          message: "Campo 'id' do ESP é obrigatório para enviar dados.",
        });
      }
      try {
        const reading = await saveReading(espId, { moisture, celsius, solarlight });
        emitRealtime(req, reading);
        return res.json({ success: true, data: reading });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Erro ao salvar leitura" });
      }
    }

    if (espId) {
      try {
        const reading = await findReading(espId);
        if (!reading) {
          return res.status(404).json({
            success: false,
            message: `Nenhum dado encontrado para o ESP '${espId}'.`,
          });
        }
        return res.json({ success: true, data: reading });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Erro ao buscar leitura" });
      }
    }

    try {
      const data = await findAllReadings();
      return res.json({ success: true, data });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Erro ao buscar leituras" });
    }
  }

  async showById(req, res) {
    const espId = extractEspId(req);
    if (!espId) {
      return res.status(400).json({
        success: false,
        message: "Informe o 'id' do ESP (query ?id= ou rota /data/:id).",
      });
    }

    try {
      const reading = await findReading(espId);
      if (!reading) {
        return res.status(404).json({
          success: false,
          message: `Nenhum dado encontrado para o ESP '${espId}'.`,
        });
      }
      return res.json({ success: true, data: reading });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Erro ao buscar leitura" });
    }
  }

  async list(_req, res) {
    try {
      const data = await findAllReadings();
      return res.json({ success: true, data });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Erro ao buscar leituras" });
    }
  }
}

export default new EspController();
