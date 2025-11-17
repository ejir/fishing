import * as THREE from 'three';

export class Player {
  constructor(id, avatarData, scene, camera, domElement, socket, isLocalPlayer = false) {
    this.id = id;
    this.scene = scene;
    this.camera = camera;
    this.socket = socket;
    this.isLocalPlayer = isLocalPlayer;
    
    this.mesh = new THREE.Group();
    this.currentSize = 1;
    this.currentSpeed = 1;
    this.jiecao = 0;
    
    this.createAvatar(avatarData);
    this.scene.add(this.mesh);
    
    if (isLocalPlayer) {
      this.setupControls(domElement);
      this.velocity = new THREE.Vector3();
      this.moveSpeed = 5;
      this.keys = {};
    }
  }

  createAvatar(avatarData) {
    avatarData.parts.forEach(part => {
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

      this.mesh.add(mesh);
    });

    if (!this.isLocalPlayer) {
      const nameCanvas = document.createElement('canvas');
      const context = nameCanvas.getContext('2d');
      nameCanvas.width = 256;
      nameCanvas.height = 64;
      
      context.fillStyle = 'rgba(0, 0, 0, 0.7)';
      context.fillRect(0, 0, nameCanvas.width, nameCanvas.height);
      
      context.font = 'Bold 32px Arial';
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.fillText(`玩家${this.id.slice(0, 4)}`, 128, 42);
      
      const texture = new THREE.CanvasTexture(nameCanvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(4, 1, 1);
      sprite.position.y = 3;
      this.mesh.add(sprite);
    }

    this.mesh.position.set(
      (Math.random() - 0.5) * 20,
      1,
      (Math.random() - 0.5) * 20
    );
  }

  setupControls(domElement) {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this.mouseX = 0;
    domElement.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    });
  }

  update() {
    if (!this.isLocalPlayer) return;

    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);
    
    this.velocity.set(0, 0, 0);

    if (this.keys['w']) this.velocity.add(forward);
    if (this.keys['s']) this.velocity.sub(forward);
    if (this.keys['a']) this.velocity.add(right);
    if (this.keys['d']) this.velocity.sub(right);

    if (this.velocity.length() > 0) {
      this.velocity.normalize();
      this.velocity.multiplyScalar(this.moveSpeed * this.currentSpeed * 0.016);
      
      this.velocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
      
      this.mesh.position.add(this.velocity);
      
      this.mesh.position.x = Math.max(-45, Math.min(45, this.mesh.position.x));
      this.mesh.position.z = Math.max(-45, Math.min(45, this.mesh.position.z));
    }

    const targetRotation = this.mouseX * Math.PI * 0.5;
    this.mesh.rotation.y += (targetRotation - this.mesh.rotation.y) * 0.1;

    if (Math.abs(this.velocity.x) > 0.001 || Math.abs(this.velocity.z) > 0.001) {
      this.socket.emit('playerMove', {
        position: {
          x: this.mesh.position.x,
          y: this.mesh.position.y,
          z: this.mesh.position.z
        },
        rotation: this.mesh.rotation.y
      });
    }
  }

  updatePosition(position, rotation) {
    this.mesh.position.set(position.x, position.y, position.z);
    this.mesh.rotation.y = rotation;
  }

  updateSize(size) {
    this.currentSize = size;
    this.mesh.scale.set(size, size, size);
  }

  updateJiecao(jiecao, size, speed) {
    this.jiecao = jiecao;
    this.currentSize = size;
    this.currentSpeed = speed;
    this.updateSize(size);
  }

  getPosition() {
    return this.mesh.position;
  }

  remove() {
    this.scene.remove(this.mesh);
  }
}
