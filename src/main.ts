import { io, Socket } from 'socket.io-client';
import { AvatarEditor } from './avatarEditor';
import { Player } from './player';
import { ChatSystem } from './chat';
import { HUD } from './hud';
import { AvatarData, PlayerState } from './types';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private socket: Socket | null = null;
  private player: Player | null = null;
  private otherPlayers: Map<string, Player> = new Map();
  private avatarEditor: AvatarEditor | null = null;
  private hud: HUD | null = null;
  private isGameStarted: boolean = false;
  private lastTime: number = 0;
  private cameraX: number = 0;
  private cameraY: number = 0;

  constructor() {
    // 创建主游戏画布
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取Canvas上下文');
    this.ctx = ctx;
    
    this.init();
  }

  private init(): void {
    this.setupCanvas();
    this.setupAvatarEditor();
    
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private setupCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    const container = document.getElementById('gameCanvas');
    if (container) {
      container.innerHTML = '';
      container.appendChild(this.canvas);
    }
  }

  private setupAvatarEditor(): void {
    this.avatarEditor = new AvatarEditor();
    
    const startButton = document.getElementById('startGame');
    if (startButton) {
      startButton.addEventListener('click', () => {
        if (!this.avatarEditor) return;
        
        const avatarData = this.avatarEditor.getAvatarData();
        if (avatarData.parts.length === 0) {
          alert('请至少添加一个图元来创建你的角色！');
          return;
        }
        this.startGame(avatarData);
      });
    }
  }

  private startGame(avatarData: AvatarData): void {
    const editorElement = document.getElementById('avatarEditor');
    const hudElement = document.getElementById('hud');
    
    if (editorElement) editorElement.style.display = 'none';
    if (hudElement) hudElement.classList.add('visible');
    
    this.isGameStarted = true;
    if (this.avatarEditor) {
      this.avatarEditor.cleanup();
    }

    this.hud = new HUD();
    this.connectToServer(avatarData);
    
    this.lastTime = performance.now();
    this.animate();
  }

  private connectToServer(avatarData: AvatarData): void {
    const serverUrl = import.meta.env.DEV 
      ? 'http://localhost:3000' 
      : window.location.origin;
    
    this.socket = io(serverUrl);

    this.socket.on('connect', () => {
      console.log('已连接到服务器');
      if (this.socket) {
        new ChatSystem(this.socket);
        this.socket.emit('joinGame', {
          name: `玩家${Math.floor(Math.random() * 9999)}`,
          avatar: avatarData
        });
      }
    });

    this.socket.on('playerJoined', (data: { id: string; players: PlayerState[] }) => {
      console.log('加入游戏成功');
      
      if (this.socket) {
        this.player = new Player(
          data.id,
          avatarData,
          this.socket,
          true
        );

        data.players.forEach(playerData => {
          if (playerData.id !== data.id && !this.otherPlayers.has(playerData.id)) {
            const otherPlayer = new Player(
              playerData.id,
              playerData.avatar,
              null,
              false
            );
            otherPlayer.updatePosition(playerData.position, playerData.rotation);
            otherPlayer.updateSize(playerData.size);
            this.otherPlayers.set(playerData.id, otherPlayer);
          }
        });
      }
    });

    this.socket.on('playerConnected', (playerData: PlayerState) => {
      console.log('新玩家加入:', playerData.name);
      
      if (!this.otherPlayers.has(playerData.id)) {
        const otherPlayer = new Player(
          playerData.id,
          playerData.avatar,
          null,
          false
        );
        this.otherPlayers.set(playerData.id, otherPlayer);
      }
    });

    this.socket.on('playerMoved', (data: { id: string; position: { x: number; y: number }; rotation: number }) => {
      const otherPlayer = this.otherPlayers.get(data.id);
      if (otherPlayer) {
        otherPlayer.updatePosition(data.position, data.rotation);
      }
    });

    this.socket.on('playerStateUpdate', (data: { id: string; jiecao: number; size: number; speed: number; overlapping: number }) => {
      if (this.socket && data.id === this.socket.id && this.player && this.hud) {
        this.player.updateJiecao(data.jiecao, data.size, data.speed);
        this.hud.updateStats(data.jiecao, data.size, data.speed, data.overlapping);
      }
      
      const otherPlayer = this.otherPlayers.get(data.id);
      if (otherPlayer) {
        otherPlayer.updateSize(data.size);
      }
    });

    this.socket.on('leaderboardUpdate', (leaderboard) => {
      if (this.hud) {
        this.hud.updateLeaderboard(leaderboard);
      }
    });

    this.socket.on('playerDisconnected', (playerId: string) => {
      this.otherPlayers.delete(playerId);
      console.log('玩家离开:', playerId);
    });

    this.socket.on('disconnect', () => {
      console.log('与服务器断开连接');
    });
  }

  private animate = (): void => {
    if (!this.isGameStarted) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // 转换为秒
    this.lastTime = currentTime;

    if (this.player) {
      this.player.update(deltaTime);
      
      // 相机跟随玩家
      const targetCameraX = this.player.position.x;
      const targetCameraY = this.player.position.y;
      
      this.cameraX += (targetCameraX - this.cameraX) * 0.1;
      this.cameraY += (targetCameraY - this.cameraY) * 0.1;
    }

    this.render();
    requestAnimationFrame(this.animate);
  }

  private render(): void {
    // 清空画布
    this.ctx.fillStyle = '#87ceeb';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制网格
    this.drawGrid();

    // 绘制其他玩家
    for (const [, otherPlayer] of this.otherPlayers) {
      otherPlayer.render(this.ctx, this.cameraX, this.cameraY, this.canvas.width, this.canvas.height);
    }

    // 绘制本地玩家
    if (this.player) {
      this.player.render(this.ctx, this.cameraX, this.cameraY, this.canvas.width, this.canvas.height);
    }
  }

  private drawGrid(): void {
    const gridSize = 100;
    const startX = Math.floor((this.cameraX - this.canvas.width / 2) / gridSize) * gridSize;
    const startY = Math.floor((this.cameraY - this.canvas.height / 2) / gridSize) * gridSize;
    const endX = this.cameraX + this.canvas.width / 2;
    const endY = this.cameraY + this.canvas.height / 2;

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 1;

    // 垂直线
    for (let x = startX; x <= endX; x += gridSize) {
      const screenX = this.canvas.width / 2 + (x - this.cameraX);
      this.ctx.beginPath();
      this.ctx.moveTo(screenX, 0);
      this.ctx.lineTo(screenX, this.canvas.height);
      this.ctx.stroke();
    }

    // 水平线
    for (let y = startY; y <= endY; y += gridSize) {
      const screenY = this.canvas.height / 2 + (y - this.cameraY);
      this.ctx.beginPath();
      this.ctx.moveTo(0, screenY);
      this.ctx.lineTo(this.canvas.width, screenY);
      this.ctx.stroke();
    }

    // 绘制地图边界
    const mapSize = 2000;
    this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(
      this.canvas.width / 2 + (-mapSize / 2 - this.cameraX),
      this.canvas.height / 2 + (-mapSize / 2 - this.cameraY),
      mapSize,
      mapSize
    );
  }

  private onWindowResize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
}

// 启动游戏
new Game();
