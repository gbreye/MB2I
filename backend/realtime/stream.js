import { Server } from "socket.io";
import cookieParser from "cookie-parser"; // Correção do erro de digitação

// Certifique-se de instanciar o 'io' adequadamente, por exemplo:
// const io = new Server(server);

io.on("connection", (socket) => {
  console.log(`Novo cliente conectado: ${socket.id}`);

  const cookieHeader = socket.request.headers.cookie;

  if (!cookieHeader) {
    console.log("Cookie não encontrado. Desconectando o cliente.");
    return socket.disconnect(true);
  }

    const cookies = cookieParser.JSONCookies(cookieParser.parse(cookieHeader));
    const idToken = cookies.token;

  if (!idToken) {
    console.log("Token não encontrado no cookie. Desconectando o cliente.");
    return socket.disconnect(true);
  }

  //logica para buscar os dados do usuario no banco de dados usando o idToken
  const data = { id: "123", name: "John Doe" };
  socket.emit("resposta_servidor", { status: "Recebido com sucesso!" });

  socket.on("disconnect", () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});