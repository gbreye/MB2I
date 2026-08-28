import jsonwebtoken from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;



class auth {
    constructor(login, signup) {
        this.login = auth.login;
        this.signup = auth.singup;
    }
}

const auth = {
    login: async function (req, res) {
        try {
            const { email, password } = req.body;
            if (!email || email.length > 50) {
                return res.status(400).json({ mes: "bad request!" });
            }
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

            const token = jsonwebtoken.sign({
                
            })

        } catch (error) {
            return res.status(500).json({ mes: 'Internal Server Error' })
        }
    },
    singup: async function (req, res) {
        try {
            const { email, password } = req.body;
            if (!email || email.length > 50) {
                return res.status(400).json({ mes: "bad request!" });
            }
            if (/[{}]/.test(email)) {
                return res.status(400).json({ mes: "bad request!" });
            }
            if (!password || password.length > 50) {
                return res.status(400).json({ mes: "bad request!" });
            }
            if (/[{}]/.test(password)) {
                return res.status(400).json({ mes: "bad request!" });
            }
        const hashedPass = bcrypt.hashSync(password, 12);
        } catch(error) {
            return res.status(500).json({mes: 'Internal server error'});
        }
    }
}
