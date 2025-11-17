import { AvatarData, AvatarPart, Position2D } from './types';
import { Socket } from 'socket.io-client';

export class Player {
  public id: string;
  public position: Position2D;
  public rotation: number = 0;
  public currentSize: number = 1;
  public currentSpeed: number = 1;
  public jiecao: number = 0;
  private avatarData: AvatarData;
  private isLocalPlayer: boolean;
  private socket: Socket | null;
  private keys: Record<string, boolean> = {};
  private velocity: Position2D = { x: 0, y: 0 };
  private moveSpeed: number = 200; // pixels per second
  private mouseAngle: number = 0;
  
  constructor(
    id: string,
    avatarData: AvatarData,
    socket: Socket | null,
    isLocalPlayer: boolean = false
  ) {
    this.id = id;
    this.avatarData = avatarData;
    this.socket = socket;
    this.isLocalPlayer = isLocalPlayer;
    this.position = {
      x: (Math.random() - 0.5) * 1000,
      y: (Math.random() - 0.5) * 1000
    };
    
    if (isLocalPlayer) {
      this.setupControls();
    }
  }
  
  private setupControls(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('mousemove', (e) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      this.mouseAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    });
  }
  
  public update(deltaTime: number): void {
    if (!this.isLocalPlayer) return;
    
    this.velocity.x = 0;
    this.velocity.y = 0;
    
    if (this.keys['w']) this.velocity.y -= 1;
    if (this.keys['s']) this.velocity.y += 1;
    if (this.keys['a']) this.velocity.x -= 1;
    if (this.keys['d']) this.velocity.x += 1;
    
    // 归一化速度
    const length = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (length > 0) {
      this.velocity.x /= length;
      this.velocity.y /= length;
    }
    
    // 应用移动
    const speed = this.moveSpeed * this.currentSpeed * deltaTime;
    this.position.x += this.velocity.x * speed;
    this.position.y += this.velocity.y * speed;
    
    // 限制在地图范围内
    const mapSize = 2000;
    this.position.x = Math.max(-mapSize / 2, Math.min(mapSize / 2, this.position.x));
    this.position.y = Math.max(-mapSize / 2, Math.min(mapSize / 2, this.position.y));
    
    // 更新旋转
    this.rotation = this.mouseAngle;
    
    // 发送位置更新
    if (length > 0 && this.socket) {
      this.socket.emit('playerMove', {
        position: this.position,
        rotation: this.rotation
      });
    }
  }
  
  public updatePosition(position: Position2D, rotation: number): void {
    this.position = position;
    this.rotation = rotation;
  }
  
  public updateSize(size: number): void {
    this.currentSize = size;
  }
  
  public updateJiecao(jiecao: number, size: number, speed: number): void {
    this.jiecao = jiecao;
    this.currentSize = size;
    this.currentSpeed = speed;
  }
  
  public render(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    const screenX = canvasWidth / 2 + (this.position.x - cameraX);
    const screenY = canvasHeight / 2 + (this.position.y - cameraY);
    
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(this.rotation);
    ctx.scale(this.currentSize, this.currentSize);
    
    // 绘制头像的每个部件
    this.avatarData.parts.forEach(part => {
      this.renderPart(ctx, part);
    });
    
    ctx.restore();
    
    // 绘制玩家名字（如果不是本地玩家）
    if (!this.isLocalPlayer) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`玩家${this.id.slice(0, 4)}`, screenX, screenY - 50 * this.currentSize);
    }
  }
  
  private renderPart(ctx: CanvasRenderingContext2D, part: AvatarPart): void {
    ctx.save();
    ctx.translate(part.position.x, part.position.y);
    ctx.rotate(part.rotation);
    
    ctx.fillStyle = part.color;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2 / this.currentSize;
    
    switch (part.type) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, part.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'rect':
        ctx.fillRect(-part.size / 2, -part.size / 2, part.size, part.size);
        ctx.strokeRect(-part.size / 2, -part.size / 2, part.size, part.size);
        break;
        
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -part.size / 2);
        ctx.lineTo(part.size / 2, part.size / 2);
        ctx.lineTo(-part.size / 2, part.size / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'ellipse':
        ctx.beginPath();
        ctx.ellipse(0, 0, part.size / 2, part.size / 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
    }
    
    ctx.restore();
  }
  
  public getPosition(): Position2D {
    return this.position;
  }
}
