import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

const players = new Map();
const JIECAO_DECAY_RATE = 0.5;
const JIECAO_INCREASE_RATE = 2;

function updateJiecaoValues() {
  for (const [id, player] of players.entries()) {
    if (player.overlapping > 0) {
      player.jiecao += JIECAO_INCREASE_RATE * player.overlapping;
      player.jiecao = Math.min(player.jiecao, 1000);
    } else {
      player.jiecao -= JIECAO_DECAY_RATE;
      player.jiecao = Math.max(player.jiecao, 0);
    }
    
    player.size = 1 + (player.jiecao / 200);
    player.speed = Math.max(0.3, 1 - (player.jiecao / 500));
  }
}

function checkOverlaps() {
  const playerArray = Array.from(players.entries());
  
  for (const [id, player] of players.entries()) {
    player.overlapping = 0;
  }
  
  for (let i = 0; i < playerArray.length; i++) {
    for (let j = i + 1; j < playerArray.length; j++) {
      const [id1, player1] = playerArray[i];
      const [id2, player2] = playerArray[j];
      
      const dx = player1.position.x - player2.position.x;
      const dy = player1.position.y - player2.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Increased threshold to detect overlaps more reliably
      const overlapThreshold = (player1.size + player2.size) * 60;
      
      if (distance < overlapThreshold) {
        player1.overlapping++;
        player2.overlapping++;
      }
    }
  }
}

setInterval(() => {
  checkOverlaps();
  updateJiecaoValues();
  
  const leaderboard = Array.from(players.entries())
    .map(([id, player]) => ({
      id,
      name: player.name,
      jiecao: Math.floor(player.jiecao)
    }))
    .sort((a, b) => b.jiecao - a.jiecao)
    .slice(0, 10);
  
  io.emit('leaderboardUpdate', leaderboard);
}, 100);

io.on('connection', (socket) => {
  console.log(`玩家连接: ${socket.id}`);

  socket.on('joinGame', (data) => {
    const player = {
      id: socket.id,
      name: data.name || `玩家${socket.id.slice(0, 4)}`,
      avatar: data.avatar,
      position: { x: 0, y: 0 },
      rotation: 0,
      jiecao: 0,
      size: 1,
      speed: 1,
      overlapping: 0
    };

    players.set(socket.id, player);

    socket.emit('playerJoined', {
      id: socket.id,
      players: Array.from(players.values())
    });

    socket.broadcast.emit('playerConnected', player);

    console.log(`${player.name} 加入游戏`);
  });

  socket.on('playerMove', (data) => {
    const player = players.get(socket.id);
    if (player) {
      player.position = data.position;
      player.rotation = data.rotation;
      
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        position: data.position,
        rotation: data.rotation
      });
    }
  });

  socket.on('playerUpdate', (data) => {
    const player = players.get(socket.id);
    if (player) {
      player.jiecao = data.jiecao;
      player.size = data.size;
      player.speed = data.speed;
      
      io.emit('playerStateUpdate', {
        id: socket.id,
        jiecao: player.jiecao,
        size: player.size,
        speed: player.speed,
        overlapping: player.overlapping
      });
    }
  });

  socket.on('chatMessage', (message) => {
    const player = players.get(socket.id);
    if (player && message && message.trim()) {
      const chatData = {
        sender: player.name,
        message: message.trim(),
        timestamp: Date.now()
      };
      io.emit('chatMessage', chatData);
      console.log(`[聊天] ${player.name}: ${message}`);
    }
  });

  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    if (player) {
      console.log(`${player.name} 离开游戏`);
      players.delete(socket.id);
      io.emit('playerDisconnected', socket.id);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});
