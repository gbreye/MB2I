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

AuthRouter.post("/login", limiter, Auth.login);
AuthRouter.post("/signup", limiter, Auth.signup);
AuthRouter.post("/logout", Auth.logout);
AuthRouter.get("/find", limiter, authMiddleware, Auth.findUser);

export default AuthRouter;
