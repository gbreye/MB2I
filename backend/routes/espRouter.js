import express from "express";
import { rateLimit } from "express-rate-limit";
import Esp from "../controllers/esp.js";
import { authMiddleware } from "../middlewares/tokenMiddleware.js";

const associationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const dataLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

const EspRouter = express.Router();

EspRouter.post("/associate", associationLimiter, authMiddleware, Esp.associate);
EspRouter.post("/data", dataLimiter, Esp.receive);

export default EspRouter;
