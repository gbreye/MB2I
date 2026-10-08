import express from "express";
import { rateLimit } from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const AuthRouter = express.Router();

import Auth from "../controllers/auth.js";

const auth = new Auth();

AuthRouter.post("/login", limiter, auth.login);
AuthRouter.post("/signup", limiter, auth.signup);
AuthRouter.get("/find", limiter, auth.findUser);

export default AuthRouter;