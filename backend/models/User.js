import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isEmailVerify: {
    type: Boolean,
    required: true
  },
  plants: {
    type: String,
    required: false,
  },
  // `esp` guarda o id do dispositivo do usuário.
  // As leituras desse ESP ficam no model EspData (um documento por espId).
  esp: {
    type: String,
    required:true
  }
  
});

const User = mongoose.model("User", userSchema);

export default User;