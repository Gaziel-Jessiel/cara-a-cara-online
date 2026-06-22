const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "../public")));

const rooms = {};

function generateCharacters() {
    const genders = ["M", "F"];
    const skin = ["clara", "media", "escura"];
    const hair = ["careca", "curto", "longo"];
    const eyes = ["azul", "castanho", "verde"];

    let characters = [];

    let id = 0;

    for (let g of genders)
    for (let s of skin)
    for (let h of hair)
    for (let e of eyes) {
        characters.push({
            id: id++,
            gender: g,
            skin: s,
            hair: h,
            eyes: e
        });
    }

    return characters;
}

io.on("connection", (socket) => {

    socket.on("createRoom", (roomId) => {
        socket.join(roomId);

        rooms[roomId] = {
            players: [socket.id],
            characters: generateCharacters(),
            secrets: {},
            turn: null
        };

        socket.emit("roomCreated", roomId);
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

        // manda tabuleiro para os 2 jogadores
        io.to(roomId).emit("gameStart", {
            characters: room.characters
        });

        room.turn = room.players[0];

        io.to(roomId).emit("turnUpdate", room.turn);
    });

    socket.on("chooseSecret", ({ roomId, characterId }) => {
        const room = rooms[roomId];
        room.secrets[socket.id] = characterId;
    });

    socket.on("askQuestion", ({ roomId, question }) => {
        const room = rooms[roomId];

        socket.to(roomId).emit("question", {
            question
        });
    });

    socket.on("answer", ({ roomId, answer }) => {
        const room = rooms[roomId];

        io.to(roomId).emit("answer", answer);
    });

    socket.on("guess", ({ roomId, guessId }) => {
        const room = rooms[roomId];

        const secret = Object.values(room.secrets).find(id => id !== undefined);

        if (guessId === secret) {
            io.to(roomId).emit("gameOver", {
                winner: socket.id
            });
        }
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log("Servidor rodando");
});