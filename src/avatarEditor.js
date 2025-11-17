import * as THREE from 'three';

export class AvatarEditor {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.parts = [];
    this.previewGroup = new THREE.Group();
    this.scene.add(this.previewGroup);
    
    this.setupEditor();
    this.updatePreview();
  }

  setupEditor() {
    const primitiveButtons = document.querySelectorAll('.primitive-btn[data-type]');
    let selectedType = 'box';

    primitiveButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        primitiveButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedType = btn.dataset.type;
      });
    });

    primitiveButtons[0].classList.add('active');

    document.getElementById('addPart').addEventListener('click', () => {
      const part = {
        type: selectedType,
        color: document.getElementById('partColor').value,
        size: parseFloat(document.getElementById('partSize').value),
        position: {
          x: parseFloat(document.getElementById('partX').value),
          y: parseFloat(document.getElementById('partY').value),
          z: parseFloat(document.getElementById('partZ').value)
        },
        rotation: parseFloat(document.getElementById('partRotation').value) * (Math.PI / 180)
      };

      this.parts.push(part);
      this.updatePartsList();
      this.updatePreview();
    });
  }

  updatePartsList() {
    const partsList = document.getElementById('partsList');
    partsList.innerHTML = '';

    this.parts.forEach((part, index) => {
      const item = document.createElement('div');
      item.className = 'part-item';
      item.innerHTML = `
        <span>${this.getTypeName(part.type)} (${part.size})</span>
        <button onclick="window.removePart(${index})">删除</button>
      `;
      partsList.appendChild(item);
    });
  }

  getTypeName(type) {
    const names = {
      box: '方块',
      sphere: '球体',
      cylinder: '圆柱',
      cone: '圆锥'
    };
    return names[type] || type;
  }

  updatePreview() {
    while (this.previewGroup.children.length > 0) {
      this.previewGroup.remove(this.previewGroup.children[0]);
    }

    this.parts.forEach(part => {
      const mesh = this.createPartMesh(part);
      this.previewGroup.add(mesh);
    });

    this.previewGroup.position.set(0, 2, 0);
    
    const time = Date.now() * 0.001;
    this.previewGroup.rotation.y = time * 0.5;
  }

  createPartMesh(part) {
    let geometry;
    
    switch (part.type) {
      case 'box':
        geometry = new THREE.BoxGeometry(part.size, part.size, part.size);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(part.size * 0.5, 16, 16);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(part.size * 0.5, part.size * 0.5, part.size, 16);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(part.size * 0.5, part.size, 16);
        break;
      default:
        geometry = new THREE.BoxGeometry(part.size, part.size, part.size);
    }

    const material = new THREE.MeshStandardMaterial({
      color: part.color,
      roughness: 0.7,
      metalness: 0.3
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(part.position.x, part.position.y, part.position.z);
    mesh.rotation.y = part.rotation;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  getAvatarData() {
    return {
      parts: this.parts
    };
  }

  cleanup() {
    this.scene.remove(this.previewGroup);
  }
}

window.removePart = (index) => {
  const game = window.gameInstance;
  if (game && game.avatarEditor) {
    game.avatarEditor.parts.splice(index, 1);
    game.avatarEditor.updatePartsList();
    game.avatarEditor.updatePreview();
  }
};

let animationId = null;
function animateEditor() {
  animationId = requestAnimationFrame(animateEditor);
  
  const game = window.gameInstance;
  if (game && game.avatarEditor && !game.isGameStarted) {
    game.avatarEditor.updatePreview();
  }
}

window.gameInstance = null;
setTimeout(() => {
  animateEditor();
}, 100);
