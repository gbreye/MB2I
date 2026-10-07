import jwt from "jsonwebtoken";
import User from "./models/User.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não definido");
}

export async function authMiddleware(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Não autorizado" });
  }

  try {
    const { id } = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });

    const user = await User.findById(id).select("admin").lean();
    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }

    req.user = { id, admin: user.admin };
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token inválido ou expirado" });
    }
    console.error(error);
    return res.status(500).json({ message: "Erro interno" });
  }
}

export function adminMiddleware(req, res, next) {
  if (!req.user?.admin) {
    return res.status(403).json({ message: "Acesso restrito a administradores" });
  }
  next();
}