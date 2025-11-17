import { AvatarData, AvatarPart, Position2D } from './types';

interface DragState {
  isDragging: boolean;
  dragIndex: number;
  offsetX: number;
  offsetY: number;
  mode: 'move' | 'rotate' | 'scale' | null;
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
    mode: null
  };
  private selectedPartIndex: number = -1;
  private previewCenter: Position2D = { x: 250, y: 200 };
  
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 500;
    this.canvas.height = 400;
    this.canvas.style.border = '2px solid #667eea';
    this.canvas.style.borderRadius = '8px';
    this.canvas.style.cursor = 'crosshair';
    
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
    
    // 检查是否点击了某个部件
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const part = this.parts[i];
      const dx = mousePos.x - part.position.x;
      const dy = mousePos.y - part.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < part.size) {
        this.dragState.isDragging = true;
        this.dragState.dragIndex = i;
        this.dragState.offsetX = dx;
        this.dragState.offsetY = dy;
        this.dragState.mode = e.shiftKey ? 'scale' : e.ctrlKey ? 'rotate' : 'move';
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
      
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const part = this.parts[i];
        const dx = mousePos.x - part.position.x;
        const dy = mousePos.y - part.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < part.size) {
          hovering = true;
          break;
        }
      }
      
      this.canvas.style.cursor = hovering ? 'grab' : 'crosshair';
      return;
    }

    const mousePos = this.getMousePos(e);
    const part = this.parts[this.dragState.dragIndex];

    if (this.dragState.mode === 'move') {
      // 移动模式
      part.position.x = mousePos.x - this.dragState.offsetX;
      part.position.y = mousePos.y - this.dragState.offsetY;
      
      // 限制在画布范围内
      const maxDist = 150;
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
    } else if (this.dragState.mode === 'scale') {
      // 缩放模式
      const distance = Math.sqrt(
        (mousePos.x - part.position.x) ** 2 + 
        (mousePos.y - part.position.y) ** 2
      );
      part.size = Math.max(10, Math.min(80, distance));
    }

    this.updatePartsList();
  }

  private handleMouseUp(): void {
    this.dragState.isDragging = false;
    this.dragState.dragIndex = -1;
    this.dragState.mode = null;
    this.canvas.style.cursor = 'crosshair';
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
    this.ctx.arc(this.previewCenter.x, this.previewCenter.y, 150, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // 绘制所有部件
    this.parts.forEach((part, index) => {
      this.drawPart(part, index === this.selectedPartIndex);
    });

    // 绘制说明文字
    this.ctx.fillStyle = '#666';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('拖拽图元来移动 | Shift+拖拽缩放 | Ctrl+拖拽旋转', this.canvas.width / 2, this.canvas.height - 10);
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
