import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config();
const URI = process.env.MONGODB_URI;

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function run(res, req) {
  try {
    await mongoose.connect(URI, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch(error) {
    return res.status(500).json({mes: 'Internal server error'});
  }
}

module.exports = {
  run,
  client,
  db: client.db('seu_nome_de_banco')
};