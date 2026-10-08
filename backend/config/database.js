import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
const URI = process.env.MONGODB_URI;

const clientOptions = {
  serverApi: { version: '1', strict: true, deprecationErrors: true },
};

async function run() {
  if (!URI) {
    console.log('MongoDB URI não definida. Ignorando conexão.');
    return false;
  }

  try {
    await mongoose.connect(URI, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
    return true;
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error.message);
    return false;
  }
}

export { run };
