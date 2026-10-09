import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "../models/User.js"; 

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const isStr = (v, max = 50) =>
  typeof v === "string" && v.trim() !== "" && v.length <= max;

class Auth {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!isStr(email) || !isStr(password)) {
        return res.status(400).json({ mes: "bad request!" });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ mes: "invalid credentials!" });
      }

      const token = jsonwebtoken.sign(
        { id: user._id, email: user.email },
        JWT_SECRET,
        { expiresIn: "1h" },
      );
      
      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: 3600000,
      });
      return res.status(200).json({ mes: "Login realizado com sucesso!" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ mes: "Internal Server Error" });
    }
  }

  async signup(req, res) {
    try {
      const { username, email, password } = req.body;
      if (!isStr(username) || !isStr(email) || !isStr(password)) {
        return res.status(400).json({ mes: "invalid body" });
      }

      const hash = await bcrypt.hash(password, 12);
      await User.create({
        username,
        email: email.toLowerCase(),
        password: hash,
        isEmailVerify: false,
        plants: "",
        esp: "",
      });
      return res.status(201).json({ mes: "usuario criado com sucesso!" });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ mes: "email already in use" });
      }
      console.error(error);
      return res.status(500).json({ mes: "Server Error" });
    }
  }

  async findUser(req, res) {
    try {
      const token = req.cookies.token;
      if (!token) return res.status(401).json({ msg: "Not Authorized" });

      const decoded = jsonwebtoken.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ msg: "User Not Found!" });

      return res.status(200).json({ msg: "Found!", user: user._id });
    } catch (error) {
      // verify lança erro se o token for inválido/expirado
      return res.status(401).json({ msg: "Invalid Token" });
    }
  }
}

export default new Auth();