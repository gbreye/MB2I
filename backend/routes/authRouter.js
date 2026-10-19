import express from "express";
import { rateLimit } from 'express-rate-limit';
import Auth from "../controllers/auth.js";
import { authMiddleware } from "../middlewares/tokenMiddleware.js";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const AuthRouter = express.Router();
const auth = new Auth();

AuthRouter.post("/login", limiter, auth.login);
AuthRouter.post("/signup", limiter, auth.signup);
AuthRouter.get("/find", limiter, authMiddleware, auth.findUser);

export default AuthRouter;
