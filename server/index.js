const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "../public")));

const rooms = {};

io.on("connection", (socket) => {
    console.log("Novo jogador conectado:", socket.id);

    socket.on("createRoom", (roomId) => {
        socket.join(roomId);

        rooms[roomId] = {
            players: [socket.id]
        };

        socket.emit("roomCreated", roomId);
        console.log(`Sala criada: ${roomId}`);
    });

    socket.on("joinRoom", (roomId) => {
        const room = rooms[roomId];

        if (!room) {
            socket.emit("errorMessage", "Sala não existe");
            return;
        }

        if (room.players.length >= 2) {
            socket.emit("errorMessage", "Sala cheia");
            return;
        }

        room.players.push(socket.id);
        socket.join(roomId);

        io.to(roomId).emit("playerJoined", {
            players: room.players.length
        });

        console.log(`Jogador entrou na sala: ${roomId}`);
    });

    socket.on("disconnect", () => {
        console.log("Jogador desconectado:", socket.id);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Servidor rodando na porta " + PORT);
});