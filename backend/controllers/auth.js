import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

class auth {
  async login(req, res) {
    try {
      //comentando o código pros betinhas
      const { email, password } = req.body;
      if (!email || email.length > 50) {
        return res.status(400).json({ mes: "bad request!" });
      }
      //é um sistema de auth basico, mas precisa de verificações de segurança tipo se é um query do mongodb
      //supostamente funciona é pra verificar o input do usuario
      //ATENÇÃO, ESTAMOS USANDO HTTPONLY, TODA REQUISIÇÃO DEVE VIR COM ID
      if (/[{}]/.test(email)) {
        return res.status(400).json({ mes: "bad request!" });
      }
      if (!password || password.length > 50) {
        return res.status(400).json({ mes: "bad request!" });
      }
      if (/[{}]/.test(password)) {
        return res.status(400).json({ mes: "bad request!" });
      }
      const user = await User.findOne(email);
      if (!user) return res.status(401).json({ mes: "unable to find user!" });
      const userPassword = user.password;
      const compare = await bcrypt.compare(password, userPassword);
      if (!compare) {
        console.log("Auth Failed!");
        return res.status(401).json({ mes: "unable to find user!" });
      }
      const token = jsonwebtoken.sign(
        { id: user._id, email: user.email },
        JWT_SECRET,
        { expiresIn: "1h" },
      );

      res.cookie("token", token, {
        sameSite: "strict",
        httpOnly: "true",
        maxAge: "3600000",
      });
      return res.status(200).json({ mes: "Login realizado com sucesso!" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ mes: "Internal Server Error", error });
    }
  }
  async signup(req, res) {
    try {
      const { username, email, password } = req.body;
      if (username.length > 50 || username === "")
        return res.status(400).json({ mes: "invalid body" });
      if (/[{}]/.test(email)) {
        return res.status(400).json({ mes: "bad request!" });
      }
      if (email.length > 50 || username === "")
        return res.status(400).json({ mes: "invalid body" });
      if (password.length > 50 || username === "")
        return res.status(400).json({ mes: "invalid body" });
      if (/[{}]/.test(password)) {
        return res.status(400).json({ mes: "bad request!" });
      }
      const cryptPassWd = await bcrypt.hashSync(password, 12);
      await User.create({ username, email, password: cryptPassWd });
      return res.status(201).json({ mes: "usuario criado com sucesso!" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ mes: "Server Error" });
    }
  }
  async findUser(req, res) {
    try {
      const standardToken = req.cookies.token;
      if (!standardToken) {
        return res.status(401).json({ msg: "Not Authorized" });
      }
      const decodedToken = jsonwebtoken.verify(
        standardToken,
        process.env.JWT_SECRET,
      );
      if (!decodedToken || !decodedToken.User) {
        return res.status(401).json({ msg: "Invalid Token" });
      }

      const user = await User.findById(decodedToken.User);
      if (!user) {
        return res.status(404).json({ msg: "User Not Found!" });
      }
      return res.status(200).json({ msg: "Found!", user: user._id });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: "Internal Server Error" });
    }
  }
}

export default Auth.new();