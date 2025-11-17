import { AvatarData, AvatarPart, Position2D } from './types';

interface DragState {
  isDragging: boolean;
  dragIndex: number;
  offsetX: number;
  offsetY: number;
  mode: 'move' | 'rotate' | 'scale' | null;
  handleType?: 'tl' | 'tr' | 'bl' | 'br' | 'rotate' | null;
  initialSize?: number;
  initialAngle?: number;
}

interface PresetAvatar {
  name: string;
  description: string;
  parts: AvatarPart[];
}

export class AvatarEditor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private parts: AvatarPart[] = [];
  private dragState: DragState = {
    isDragging: false,
    dragIndex: -1,
    offsetX: 0,
    offsetY: 0,
    mode: null,
    handleType: null
  };
  private selectedPartIndex: number = -1;
  private previewCenter: Position2D = { x: 400, y: 300 };
  private handleSize: number = 8;
  
  private presets: PresetAvatar[] = [
    {
      name: '彩虹球',
      description: '多彩圆形',
      parts: [
        { type: 'circle', color: '#ff6b6b', size: 70, position: { x: 0, y: 0 }, rotation: 0 },
        { type: 'circle', color: '#4ecdc4', size: 45, position: { x: 0, y: 0 }, rotation: 0 },
        { type: 'circle', color: '#ffe66d', size: 25, position: { x: 0, y: 0 }, rotation: 0 },
        { type: 'circle', color: '#000000', size: 8, position: { x: -15, y: -8 }, rotation: 0 },
        { type: 'circle', color: '#000000', size: 8, position: { x: 15, y: -8 }, rotation: 0 },
      ]
    },
    {
      name: '方块怪',
      description: '几何方块',
      parts: [
        { type: 'rect', color: '#667eea', size: 60, position: { x: 0, y: 0 }, rotation: 0 },
        { type: 'rect', color: '#764ba2', size: 35, position: { x: 0, y: 0 }, rotation: 0.785 },
        { type: 'circle', color: '#ffffff', size: 12, position: { x: -12, y: -8 }, rotation: 0 },
        { type: 'circle', color: '#ffffff', size: 12, position: { x: 12, y: -8 }, rotation: 0 },
        { type: 'circle', color: '#000000', size: 6, position: { x: -12, y: -8 }, rotation: 0 },
        { type: 'circle', color: '#000000', size: 6, position: { x: 12, y: -8 }, rotation: 0 },
      ]
    },
    {
      name: '三角星',
      description: '星形图案',
      parts: [
        { type: 'triangle', color: '#ffd700', size: 75, position: { x: 0, y: 5 }, rotation: 0 },
        { type: 'triangle', color: '#ffed4e', size: 75, position: { x: 0, y: -5 }, rotation: 3.14159 },
        { type: 'circle', color: '#ff6b6b', size: 30, position: { x: 0, y: 0 }, rotation: 0 },
        { type: 'circle', color: '#000000', size: 8, position: { x: -10, y: -5 }, rotation: 0 },
        { type: 'circle', color: '#000000', size: 8, position: { x: 10, y: -5 }, rotation: 0 },
      ]
    },
    {
      name: '椭圆虫',
      description: '可爱椭圆',
      parts: [
        { type: 'ellipse', color: '#95e1d3', size: 90, position: { x: 0, y: 0 }, rotation: 0 },
        { type: 'ellipse', color: '#f38181', size: 35, position: { x: -20, y: -10 }, rotation: 0.5 },
        { type: 'ellipse', color: '#f38181', size: 35, position: { x: 20, y: -10 }, rotation: -0.5 },
        { type: 'circle', color: '#000000', size: 10, position: { x: -15, y: 5 }, rotation: 0 },
        { type: 'circle', color: '#000000', size: 10, position: { x: 15, y: 5 }, rotation: 0 },
        { type: 'ellipse', color: '#ffffff', size: 20, position: { x: 0, y: 25 }, rotation: 0 },
      ]
    },
    {
      name: '笑脸',
      description: '经典笑脸',
      parts: [
        { type: 'circle', color: '#ffe66d', size: 80, position: { x: 0, y: 0 }, rotation: 0 },
        { type: 'circle', color: '#000000', size: 10, position: { x: -18, y: -12 }, rotation: 0 },
        { type: 'circle', color: '#000000', size: 10, position: { x: 18, y: -12 }, rotation: 0 },
        { type: 'ellipse', color: '#000000', size: 35, position: { x: 0, y: 15 }, rotation: 0 },
        { type: 'ellipse', color: '#ffe66d', size: 30, position: { x: 0, y: 10 }, rotation: 0 },
      ]
    },
    {
      name: '机器人',
      description: '方块机器人',
      parts: [
        { type: 'rect', color: '#95a5a6', size: 55, position: { x: 0, y: -10 }, rotation: 0 },
        { type: 'rect', color: '#34495e', size: 65, position: { x: 0, y: 25 }, rotation: 0 },
        { type: 'circle', color: '#3498db', size: 12, position: { x: -14, y: -15 }, rotation: 0 },
        { type: 'circle', color: '#3498db', size: 12, position: { x: 14, y: -15 }, rotation: 0 },
        { type: 'rect', color: '#e74c3c', size: 25, position: { x: 0, y: -5 }, rotation: 0 },
        { type: 'rect', color: '#7f8c8d', size: 20, position: { x: -35, y: 25 }, rotation: 0 },
        { type: 'rect', color: '#7f8c8d', size: 20, position: { x: 35, y: 25 }, rotation: 0 },
      ]
    },
    {
      name: '彩虹塔',
      description: '堆叠图形',
      parts: [
        { type: 'circle', color: '#e74c3c', size: 75, position: { x: 0, y: 20 }, rotation: 0 },
        { type: 'rect', color: '#f39c12', size: 60, position: { x: 0, y: -5 }, rotation: 0 },
        { type: 'triangle', color: '#3498db', size: 55, position: { x: 0, y: -35 }, rotation: 0 },
        { type: 'circle', color: '#000000', size: 8, position: { x: -12, y: -10 }, rotation: 0 },
        { type: 'circle', color: '#000000', size: 8, position: { x: 12, y: -10 }, rotation: 0 },
      ]
    },
    {
      name: '蝴蝶',
      description: '对称图案',
      parts: [
        { type: 'ellipse', color: '#9b59b6', size: 60, position: { x: -25, y: -10 }, rotation: 0.5 },
        { type: 'ellipse', color: '#9b59b6', size: 60, position: { x: 25, y: -10 }, rotation: -0.5 },
        { type: 'ellipse', color: '#e67e22', size: 50, position: { x: -25, y: 15 }, rotation: -0.5 },
        { type: 'ellipse', color: '#e67e22', size: 50, position: { x: 25, y: 15 }, rotation: 0.5 },
        { type: 'circle', color: '#34495e', size: 30, position: { x: 0, y: 0 }, rotation: 0 },
        { type: 'circle', color: '#ffffff', size: 8, position: { x: -8, y: -5 }, rotation: 0 },
        { type: 'circle', color: '#ffffff', size: 8, position: { x: 8, y: -5 }, rotation: 0 },
      ]
    },
    {
      name: '波奇酱',
      description: '孤独摇滚',
      parts: [
        { type: 'rect', color: '#ffb3d9', size: 60, position: { x: 0, y: 0 }, rotation: 0 },
        { type: 'rect', color: '#ff69b4', size: 40, position: { x: -15, y: -25 }, rotation: 0.2 },
        { type: 'rect', color: '#ff69b4', size: 40, position: { x: 15, y: -25 }, rotation: -0.2 },
        { type: 'rect', color: '#1a1a2e', size: 10, position: { x: -12, y: -5 }, rotation: 0 },
        { type: 'rect', color: '#1a1a2e', size: 10, position: { x: 12, y: -5 }, rotation: 0 },
        { type: 'rect', color: '#ff1493', size: 20, position: { x: 0, y: 10 }, rotation: 0 },
        { type: 'rect', color: '#ffb3d9', size: 35, position: { x: 0, y: 35 }, rotation: 0 },
      ]
    },
    {
      name: '喜多',
      description: '孤独摇滚',
      parts: [
        { type: 'rect', color: '#ffd700', size: 60, position: { x: 0, y: 0 }, rotation: 0 },
        { type: 'rect', color: '#ff6347', size: 45, position: { x: -18, y: -28 }, rotation: 0.3 },
        { type: 'rect', color: '#ff6347', size: 45, position: { x: 18, y: -28 }, rotation: -0.3 },
        { type: 'rect', color: '#8b4513', size: 12, position: { x: -15, y: -8 }, rotation: 0 },
        { type: 'rect', color: '#8b4513', size: 12, position: { x: 15, y: -8 }, rotation: 0 },
        { type: 'rect', color: '#ff4500', size: 25, position: { x: 0, y: 8 }, rotation: 0 },
        { type: 'rect', color: '#ffa500', size: 40, position: { x: 0, y: 38 }, rotation: 0 },
      ]
    },
    {
      name: '凉',
      description: '孤独摇滚',
      parts: [
        { type: 'rect', color: '#87ceeb', size: 60, position: { x: 0, y: 0 }, rotation: 0 },
        { type: 'rect', color: '#4169e1', size: 35, position: { x: -20, y: -30 }, rotation: 0.1 },
        { type: 'rect', color: '#4169e1', size: 35, position: { x: 20, y: -30 }, rotation: -0.1 },
        { type: 'rect', color: '#000080', size: 10, position: { x: -12, y: -6 }, rotation: 0 },
        { type: 'rect', color: '#000080', size: 10, position: { x: 12, y: -6 }, rotation: 0 },
        { type: 'rect', color: '#1e90ff', size: 18, position: { x: 0, y: 8 }, rotation: 0 },
        { type: 'rect', color: '#5f9ea0', size: 38, position: { x: 0, y: 36 }, rotation: 0 },
      ]
    },
    {
      name: '虹夏',
      description: '孤独摇滚',
      parts: [
        { type: 'rect', color: '#fff8dc', size: 60, position: { x: 0, y: 0 }, rotation: 0 },
        { type: 'rect', color: '#ffd700', size: 38, position: { x: -16, y: -26 }, rotation: 0.15 },
        { type: 'rect', color: '#ffd700', size: 38, position: { x: 16, y: -26 }, rotation: -0.15 },
        { type: 'rect', color: '#2f4f4f', size: 11, position: { x: -13, y: -7 }, rotation: 0 },
        { type: 'rect', color: '#2f4f4f', size: 11, position: { x: 13, y: -7 }, rotation: 0 },
        { type: 'rect', color: '#ff6b6b', size: 22, position: { x: 0, y: 9 }, rotation: 0 },
        { type: 'rect', color: '#ffeb3b', size: 36, position: { x: 0, y: 37 }, rotation: 0 },
      ]
    }
  ];
  
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 800;
    this.canvas.height = 600;
    this.canvas.style.border = '2px solid #667eea';
    this.canvas.style.borderRadius = '8px';
    this.canvas.style.cursor = 'crosshair';
    this.canvas.style.maxWidth = '100%';
    this.canvas.style.height = 'auto';
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取Canvas上下文');
    this.ctx = ctx;
    
    this.setupCanvas();
    this.setupPresets();
    this.setupEventListeners();
    this.animate();
  }
  
  private setupCanvas(): void {
    const container = document.getElementById('previewCanvas');
    if (container) {
      container.innerHTML = '';
      container.appendChild(this.canvas);
    }
  }

  private setupPresets(): void {
    const presetsGrid = document.getElementById('presetsGrid');
    if (!presetsGrid) return;

    this.presets.forEach((preset, index) => {
      const card = document.createElement('div');
      card.className = 'preset-card';
      card.dataset.presetIndex = index.toString();

      const preview = document.createElement('canvas');
      preview.className = 'preset-preview';
      preview.width = 120;
      preview.height = 80;
      
      const previewCtx = preview.getContext('2d');
      if (previewCtx) {
        this.renderPresetPreview(previewCtx, preset.parts, 60, 40);
      }

      const name = document.createElement('div');
      name.className = 'preset-name';
      name.textContent = preset.name;

      card.appendChild(preview);
      card.appendChild(name);
      card.addEventListener('click', () => this.loadPreset(index));

      presetsGrid.appendChild(card);
    });
  }

  private renderPresetPreview(ctx: CanvasRenderingContext2D, parts: AvatarPart[], centerX: number, centerY: number): void {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const scale = 0.5; // 缩小预览

    parts.forEach(part => {
      ctx.save();
      ctx.translate(
        centerX + part.position.x * scale,
        centerY + part.position.y * scale
      );
      ctx.rotate(part.rotation);

      ctx.fillStyle = part.color;
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;

      const scaledSize = part.size * scale;

      switch (part.type) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, scaledSize / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;
        case 'rect':
          ctx.fillRect(-scaledSize / 2, -scaledSize / 2, scaledSize, scaledSize);
          ctx.strokeRect(-scaledSize / 2, -scaledSize / 2, scaledSize, scaledSize);
          break;
        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(0, -scaledSize / 2);
          ctx.lineTo(scaledSize / 2, scaledSize / 2);
          ctx.lineTo(-scaledSize / 2, scaledSize / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        case 'ellipse':
          ctx.beginPath();
          ctx.ellipse(0, 0, scaledSize / 2, scaledSize / 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;
      }

      ctx.restore();
    });
  }

  private loadPreset(index: number): void {
    const preset = this.presets[index];
    if (!preset) return;

    // 深拷贝预设的parts
    this.parts = preset.parts.map(part => ({ ...part, position: { ...part.position } }));
    this.selectedPartIndex = -1;
    this.updatePartsList();

    // 高亮选中的预设卡片
    document.querySelectorAll('.preset-card').forEach((card, i) => {
      if (i === index) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
  }
  
  private setupEventListeners(): void {
    // 图元按钮 - 支持拖拽
    const primitiveButtons = document.querySelectorAll('.primitive-btn[data-type]');

    primitiveButtons.forEach(btn => {
      const element = btn as HTMLElement;
      
      element.addEventListener('dragstart', (e: DragEvent) => {
        const type = element.dataset.type;
        if (e.dataTransfer && type) {
          e.dataTransfer.setData('primitiveType', type);
          e.dataTransfer.effectAllowed = 'copy';
        }
      });
    });

    // Canvas接收拖拽
    this.canvas.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    });

    this.canvas.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault();
      const primitiveType = e.dataTransfer?.getData('primitiveType');
      
      if (primitiveType) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - this.previewCenter.x;
        const y = e.clientY - rect.top - this.previewCenter.y;
        
        const part: AvatarPart = {
          type: primitiveType as AvatarPart['type'],
          color: (document.getElementById('partColor') as HTMLInputElement)?.value || '#ff6b6b',
          size: parseFloat((document.getElementById('partSize') as HTMLInputElement)?.value || '30'),
          position: { x, y },
          rotation: parseFloat((document.getElementById('partRotation') as HTMLInputElement)?.value || '0') * (Math.PI / 180)
        };

        // 限制在范围内
        const maxDist = 250;
        const dist = Math.sqrt(part.position.x * part.position.x + part.position.y * part.position.y);
        if (dist > maxDist) {
          const angle = Math.atan2(part.position.y, part.position.x);
          part.position.x = Math.cos(angle) * maxDist;
          part.position.y = Math.sin(angle) * maxDist;
        }

        this.parts.push(part);
        this.updatePartsList();
        
        // 取消预设选中状态
        document.querySelectorAll('.preset-card').forEach(card => {
          card.classList.remove('selected');
        });
      }
    });

    // 鼠标事件 - 拖拽功能
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
    this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());

    // 键盘事件 - 删除选中的部件
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' && this.selectedPartIndex >= 0) {
        this.removePart(this.selectedPartIndex);
      }
    });
  }

  private getMousePos(e: MouseEvent): Position2D {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left - this.previewCenter.x,
      y: e.clientY - rect.top - this.previewCenter.y
    };
  }

  private handleMouseDown(e: MouseEvent): void {
    const mousePos = this.getMousePos(e);
    
    // 首先检查是否点击了控制手柄（如果有选中的图元）
    if (this.selectedPartIndex >= 0) {
      const handleType = this.getHandleAtPosition(mousePos, this.parts[this.selectedPartIndex]);
      if (handleType) {
        this.dragState.isDragging = true;
        this.dragState.dragIndex = this.selectedPartIndex;
        this.dragState.mode = handleType === 'rotate' ? 'rotate' : 'scale';
        this.dragState.handleType = handleType;
        this.dragState.initialSize = this.parts[this.selectedPartIndex].size;
        this.dragState.initialAngle = this.parts[this.selectedPartIndex].rotation;
        this.canvas.style.cursor = 'grabbing';
        return;
      }
    }
    
    // 检查是否点击了某个部件
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const part = this.parts[i];
      const dx = mousePos.x - part.position.x;
      const dy = mousePos.y - part.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < part.size / 2 + 10) {
        this.dragState.isDragging = true;
        this.dragState.dragIndex = i;
        this.dragState.offsetX = dx;
        this.dragState.offsetY = dy;
        this.dragState.mode = 'move';
        this.dragState.handleType = null;
        this.selectedPartIndex = i;
        this.canvas.style.cursor = 'grabbing';
        return;
      }
    }
    
    this.selectedPartIndex = -1;
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.dragState.isDragging || this.dragState.dragIndex < 0) {
      // 检查鼠标悬停
      const mousePos = this.getMousePos(e);
      let hovering = false;
      let cursor = 'crosshair';
      
      // 检查是否悬停在控制手柄上
      if (this.selectedPartIndex >= 0) {
        const handleType = this.getHandleAtPosition(mousePos, this.parts[this.selectedPartIndex]);
        if (handleType) {
          cursor = handleType === 'rotate' ? 'grab' : 'nwse-resize';
          hovering = true;
        }
      }
      
      // 检查是否悬停在图元上
      if (!hovering) {
        for (let i = this.parts.length - 1; i >= 0; i--) {
          const part = this.parts[i];
          const dx = mousePos.x - part.position.x;
          const dy = mousePos.y - part.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < part.size / 2 + 10) {
            cursor = 'grab';
            break;
          }
        }
      }
      
      this.canvas.style.cursor = cursor;
      return;
    }

    const mousePos = this.getMousePos(e);
    const part = this.parts[this.dragState.dragIndex];

    if (this.dragState.mode === 'move') {
      // 移动模式
      part.position.x = mousePos.x - this.dragState.offsetX;
      part.position.y = mousePos.y - this.dragState.offsetY;
      
      // 限制在画布范围内
      const maxDist = 250;
      const dist = Math.sqrt(part.position.x * part.position.x + part.position.y * part.position.y);
      if (dist > maxDist) {
        const angle = Math.atan2(part.position.y, part.position.x);
        part.position.x = Math.cos(angle) * maxDist;
        part.position.y = Math.sin(angle) * maxDist;
      }
    } else if (this.dragState.mode === 'rotate') {
      // 旋转模式
      const angle = Math.atan2(mousePos.y - part.position.y, mousePos.x - part.position.x);
      part.rotation = angle;
    } else if (this.dragState.mode === 'scale' && this.dragState.handleType) {
      // 通过控制手柄缩放
      const dx = mousePos.x - part.position.x;
      const dy = mousePos.y - part.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      part.size = Math.max(10, Math.min(150, distance * 2));
    }

    this.updatePartsList();
  }

  private handleMouseUp(): void {
    this.dragState.isDragging = false;
    this.dragState.dragIndex = -1;
    this.dragState.mode = null;
    this.dragState.handleType = null;
    this.canvas.style.cursor = 'crosshair';
  }

  private getHandleAtPosition(mousePos: Position2D, part: AvatarPart): 'tl' | 'tr' | 'bl' | 'br' | 'rotate' | null {
    const handles = this.getHandlePositions(part);
    const threshold = this.handleSize + 5;
    
    for (const [type, pos] of Object.entries(handles)) {
      const dx = mousePos.x - pos.x;
      const dy = mousePos.y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < threshold) {
        return type as 'tl' | 'tr' | 'bl' | 'br' | 'rotate';
      }
    }
    
    return null;
  }

  private getHandlePositions(part: AvatarPart): Record<string, Position2D> {
    const halfSize = part.size / 2;
    const rotateHandleDistance = halfSize + 30;
    
    return {
      tl: { x: part.position.x - halfSize, y: part.position.y - halfSize },
      tr: { x: part.position.x + halfSize, y: part.position.y - halfSize },
      bl: { x: part.position.x - halfSize, y: part.position.y + halfSize },
      br: { x: part.position.x + halfSize, y: part.position.y + halfSize },
      rotate: { 
        x: part.position.x, 
        y: part.position.y - rotateHandleDistance 
      }
    };
  }

  private updatePartsList(): void {
    const partsList = document.getElementById('partsList');
    if (!partsList) return;
    
    partsList.innerHTML = '';

    this.parts.forEach((part, index) => {
      const item = document.createElement('div');
      item.className = 'part-item';
      item.style.background = index === this.selectedPartIndex ? '#e0e0ff' : '#f5f5f5';
      item.innerHTML = `
        <span>${this.getTypeName(part.type)} (${Math.round(part.size)}px)</span>
        <button class="delete-btn" data-index="${index}">删除</button>
      `;
      
      const deleteBtn = item.querySelector('.delete-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => this.removePart(index));
      }
      
      item.addEventListener('click', (e) => {
        if (!(e.target as HTMLElement).classList.contains('delete-btn')) {
          this.selectedPartIndex = index;
          this.updatePartsList();
        }
      });
      
      partsList.appendChild(item);
    });
  }

  private getTypeName(type: AvatarPart['type']): string {
    const names = {
      circle: '圆形',
      rect: '矩形',
      triangle: '三角形',
      ellipse: '椭圆'
    };
    return names[type] || type;
  }

  private removePart(index: number): void {
    this.parts.splice(index, 1);
    this.selectedPartIndex = -1;
    this.updatePartsList();
  }

  private drawPart(part: AvatarPart, isSelected: boolean = false): void {
    this.ctx.save();
    this.ctx.translate(
      this.previewCenter.x + part.position.x,
      this.previewCenter.y + part.position.y
    );
    this.ctx.rotate(part.rotation);

    // 绘制图形
    this.ctx.fillStyle = part.color;
    this.ctx.strokeStyle = isSelected ? '#667eea' : '#333';
    this.ctx.lineWidth = isSelected ? 3 : 1;

    switch (part.type) {
      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(0, 0, part.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        break;

      case 'rect':
        this.ctx.fillRect(-part.size / 2, -part.size / 2, part.size, part.size);
        this.ctx.strokeRect(-part.size / 2, -part.size / 2, part.size, part.size);
        break;

      case 'triangle':
        this.ctx.beginPath();
        this.ctx.moveTo(0, -part.size / 2);
        this.ctx.lineTo(part.size / 2, part.size / 2);
        this.ctx.lineTo(-part.size / 2, part.size / 2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        break;

      case 'ellipse':
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, part.size / 2, part.size / 3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        break;
    }

    this.ctx.restore();
    
    // 绘制控制手柄
    if (isSelected) {
      this.drawHandles(part);
    }
  }

  private drawHandles(part: AvatarPart): void {
    const handles = this.getHandlePositions(part);
    const halfSize = part.size / 2;
    
    this.ctx.save();
    
    // 绘制边界框
    this.ctx.strokeStyle = '#667eea';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(
      this.previewCenter.x + part.position.x - halfSize,
      this.previewCenter.y + part.position.y - halfSize,
      part.size,
      part.size
    );
    this.ctx.setLineDash([]);
    
    // 绘制角点控制手柄（缩放）
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#667eea';
    this.ctx.lineWidth = 2;
    
    for (const [type, pos] of Object.entries(handles)) {
      if (type !== 'rotate') {
        this.ctx.beginPath();
        this.ctx.arc(
          this.previewCenter.x + pos.x,
          this.previewCenter.y + pos.y,
          this.handleSize,
          0,
          Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.stroke();
      }
    }
    
    // 绘制旋转手柄
    const rotateHandle = handles.rotate;
    
    // 绘制连接线
    this.ctx.strokeStyle = '#667eea';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([3, 3]);
    this.ctx.beginPath();
    this.ctx.moveTo(
      this.previewCenter.x + part.position.x,
      this.previewCenter.y + part.position.y - halfSize
    );
    this.ctx.lineTo(
      this.previewCenter.x + rotateHandle.x,
      this.previewCenter.y + rotateHandle.y
    );
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    // 绘制旋转手柄圆圈
    this.ctx.fillStyle = '#4ade80';
    this.ctx.strokeStyle = '#16a34a';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(
      this.previewCenter.x + rotateHandle.x,
      this.previewCenter.y + rotateHandle.y,
      this.handleSize,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.stroke();
    
    // 在旋转手柄上绘制旋转图标
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(
      this.previewCenter.x + rotateHandle.x,
      this.previewCenter.y + rotateHandle.y,
      this.handleSize / 2,
      0.2,
      Math.PI * 1.8
    );
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  private render(): void {
    // 清空画布
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制中心点参考
    this.ctx.strokeStyle = '#ddd';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(this.previewCenter.x, 0);
    this.ctx.lineTo(this.previewCenter.x, this.canvas.height);
    this.ctx.moveTo(0, this.previewCenter.y);
    this.ctx.lineTo(this.canvas.width, this.previewCenter.y);
    this.ctx.stroke();

    // 绘制预览圈
    this.ctx.strokeStyle = '#ccc';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.arc(this.previewCenter.x, this.previewCenter.y, 250, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // 绘制所有部件
    this.parts.forEach((part, index) => {
      this.drawPart(part, index === this.selectedPartIndex);
    });

    // 绘制说明文字
    this.ctx.fillStyle = '#666';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('拖拽图元移动 | 拖拽控制点缩放/旋转 | Delete删除', this.canvas.width / 2, this.canvas.height - 15);
  }

  private animate = (): void => {
    this.render();
    requestAnimationFrame(this.animate);
  }

  public getAvatarData(): AvatarData {
    return {
      parts: this.parts.map(part => ({ ...part }))
    };
  }

  public cleanup(): void {
    // 清理资源
  }
}
