const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '../public')));

const rooms = {};

function generateRoomId() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

io.on('connection', (socket) => {

  socket.on('create_room', () => {
    const roomId = generateRoomId();
    rooms[roomId] = { players: [socket.id], choices: {}, eliminated: {} };
    socket.join(roomId);
    socket.roomId = roomId;
    socket.emit('room_created', { roomId, playerNum: 1 });
  });

  socket.on('join_room', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return socket.emit('error', 'Sala não encontrada.');
    if (room.players.length >= 2) return socket.emit('error', 'Sala cheia.');
    room.players.push(socket.id);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.emit('room_joined', { roomId, playerNum: 2 });
    io.to(roomId).emit('both_connected');
  });

  socket.on('choose_character', ({ charIndex }) => {
    const room = rooms[socket.roomId];
    if (!room) return;
    room.choices[socket.id] = charIndex;
    room.eliminated[socket.id] = [];
    socket.emit('character_chosen');
    if (Object.keys(room.choices).length === 2) {
      io.to(room.players[0]).emit('your_turn');
      io.to(room.players[1]).emit('wait_turn');
    }
  });

  socket.on('send_question', ({ text }) => {
    const room = rooms[socket.roomId];
    if (!room) return;
    const opponent = room.players.find(id => id !== socket.id);
    io.to(opponent).emit('receive_question', { text });
  });

  socket.on('send_answer', ({ answer }) => {
    const room = rooms[socket.roomId];
    if (!room) return;
    const opponent = room.players.find(id => id !== socket.id);
    io.to(opponent).emit('receive_answer', { answer });
    io.to(socket.id).emit('your_turn');
    io.to(opponent).emit('wait_turn');
  });

  socket.on('eliminate', ({ charIndex }) => {
    const room = rooms[socket.roomId];
    if (!room) return;
    room.eliminated[socket.id] = room.eliminated[socket.id] || [];
    room.eliminated[socket.id].push(charIndex);
  });

  socket.on('guess_character', ({ charIndex }) => {
    const room = rooms[socket.roomId];
    if (!room) return;
    const opponent = room.players.find(id => id !== socket.id);
    const correct = room.choices[opponent] === charIndex;
    socket.emit('guess_result', { correct });
    io.to(opponent).emit('guess_result', { correct: !correct });
  });

  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId]) {
      io.to(roomId).emit('opponent_left');
      delete rooms[roomId];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
