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
  
  private setupEventListeners(): void {
    // 图元按钮
    const primitiveButtons = document.querySelectorAll('.primitive-btn[data-type]');
    let selectedType: AvatarPart['type'] = 'circle';

    primitiveButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        primitiveButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedType = (btn as HTMLElement).dataset.type as AvatarPart['type'];
      });
    });

    if (primitiveButtons[0]) {
      primitiveButtons[0].classList.add('active');
    }

    // 添加图元按钮
    const addButton = document.getElementById('addPart');
    if (addButton) {
      addButton.addEventListener('click', () => {
        const part: AvatarPart = {
          type: selectedType,
          color: (document.getElementById('partColor') as HTMLInputElement)?.value || '#ff6b6b',
          size: parseFloat((document.getElementById('partSize') as HTMLInputElement)?.value || '30'),
          position: { x: 0, y: 0 },
          rotation: parseFloat((document.getElementById('partRotation') as HTMLInputElement)?.value || '0') * (Math.PI / 180)
        };

        this.parts.push(part);
        this.updatePartsList();
      });
    }

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
