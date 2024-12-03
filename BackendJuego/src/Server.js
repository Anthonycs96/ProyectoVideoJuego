import express from 'express';
import http from 'http';
import { Server } from 'socket.io';


const app = express();
const server = http.createServer(app);

const rooms = {};

// Configurar CORS en Socket.IO
const io = new Server(server, { 
  cors: {
    origin: [
      "http://localhost:3001",   // Permitir origen localhost
      "http://10.249.177.135:3001" // Permitir origen en red local
    ],
    methods: ["GET", "POST"]  // Métodos HTTP permitidos
  }
});


io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Crear o unirse a una sala
  socket.on('join_room', (roomId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = { players: [], scores: { player1: 0, player2: 0 } };
    }
    if (rooms[roomId].players.length < 2) {
      rooms[roomId].players.push(socket.id);
      socket.join(roomId);
      socket.emit('room_joined', roomId, rooms[roomId].players.length);
      if (rooms[roomId].players.length === 2) {
        io.in(roomId).emit('start_game');
      }
    } else {
      socket.emit('room_full');
    }
  });

  // Manejar puntuaciones
  socket.on('score_update', (roomId, player) => {
    if (rooms[roomId]) {
      rooms[roomId].scores[player]++;
      io.in(roomId).emit('update_scores', rooms[roomId].scores);
    }
  });

  // Desconexión
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const roomId in rooms) {
      rooms[roomId].players = rooms[roomId].players.filter((id) => id !== socket.id);
      if (rooms[roomId].players.length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
