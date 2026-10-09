import { io } from './server.js'
import cookieParser from "cookie-parser";
import { db } from 'database.js'

const collection = db.collection("users");

io.on("connection", async (socket) => {

  let changeStream = null;

  try {
    console.log(`Novo cliente conectado: ${socket.id}`);
    const cookieHeader = socket.request.headers.cookie;
    if (!cookieHeader) {
      console.log("Cookie não encontrado. Desconectando o cliente.");
      return socket.disconnect(true);
    }

    const cookies = cookieParser.JSONCookies(cookieParser.parse(cookieHeader));
    const idToken = cookies._id;

    if (!idToken) {
      console.log("Token não encontrado no cookie. Desconectando o cliente.");
      return socket.disconnect(true);
    }

    //logica para buscar os dados do usuario no banco de dados usando o idToken
    const user = await collection.findOne({ _id: idToken });
    if (!user) {
      console.log("user not found");
      return socket.disconnect(true);
    }

    const pipeline = [
      {
        $match: {
          "documentKey._id": user._id,
          operationType: { $in: ["insert", "update", "replace"] },
        },
      },
    ];
    changeStream = await collection.watch(pipeline, { fullDocument: "updateLookup" });

    changeStream.on('change', (next) => {
      console.log("Change");
      if (next.operationType === 'insert' || next.operationType === 'update' || next.operationType === 'replace') {
        const newDoc = next.fullDocument;
        socket.emit("new data", { status: newDoc });
      }
    });

    socket.on("disconnect", async () => {
      console.log(`Cliente desconectado: ${socket.id}`);
      if (changeStream) {
        await changeStream.close();
        console.log(`Change stream closed for user: ${user._id}`);
      }
    });
  } catch (error) {
    console.log(error);
  }
});