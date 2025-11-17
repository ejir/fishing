import * as THREE from 'three';
import { io } from 'socket.io-client';
import { AvatarEditor } from './avatarEditor.js';
import { Player } from './player.js';
import { ChatSystem } from './chat.js';
import { HUD } from './hud.js';

class Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.socket = null;
    this.player = null;
    this.otherPlayers = new Map();
    this.avatarEditor = null;
    this.chatSystem = null;
    this.hud = null;
    this.isGameStarted = false;

    this.init();
  }

  init() {
    this.setupScene();
    this.setupLights();
    this.createGround();
    this.setupAvatarEditor();
    
    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 10, 15);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('gameCanvas').appendChild(this.renderer.domElement);
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x6b8e23, 0.3);
    this.scene.add(hemisphereLight);
  }

  createGround() {
    const gridSize = 100;
    const gridDivisions = 50;
    
    const groundGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x90ee90,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x888888, 0xcccccc);
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    this.addRandomObjects();
  }

  addRandomObjects() {
    const colors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0xa8e6cf, 0xff8b94];
    
    for (let i = 0; i < 20; i++) {
      const geometry = Math.random() > 0.5 
        ? new THREE.BoxGeometry(2, 2, 2)
        : new THREE.CylinderGeometry(1, 1, 2, 8);
      
      const material = new THREE.MeshStandardMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        roughness: 0.7,
        metalness: 0.3
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 80,
        1,
        (Math.random() - 0.5) * 80
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }
  }

  setupAvatarEditor() {
    this.avatarEditor = new AvatarEditor(this.scene, this.camera);
    window.gameInstance = this;
    
    document.getElementById('startGame').addEventListener('click', () => {
      const avatarData = this.avatarEditor.getAvatarData();
      if (avatarData.parts.length === 0) {
        alert('请至少添加一个图元来创建你的角色！');
        return;
      }
      this.startGame(avatarData);
    });
  }

  startGame(avatarData) {
    document.getElementById('avatarEditor').style.display = 'none';
    document.getElementById('hud').classList.add('visible');
    
    this.isGameStarted = true;
    this.avatarEditor.cleanup();

    this.hud = new HUD();
    this.connectToServer(avatarData);
    
    this.animate();
  }

  connectToServer(avatarData) {
    const serverUrl = import.meta.env.DEV 
      ? 'http://localhost:3000' 
      : window.location.origin;
    
    this.socket = io(serverUrl);

    this.socket.on('connect', () => {
      console.log('已连接到服务器');
      this.chatSystem = new ChatSystem(this.socket);
      this.socket.emit('joinGame', {
        name: `玩家${Math.floor(Math.random() * 9999)}`,
        avatar: avatarData
      });
    });

    this.socket.on('playerJoined', (data) => {
      console.log('加入游戏成功');
      
      this.player = new Player(
        data.id,
        avatarData,
        this.scene,
        this.camera,
        this.renderer.domElement,
        this.socket,
        true
      );

      data.players.forEach(playerData => {
        if (playerData.id !== data.id && !this.otherPlayers.has(playerData.id)) {
          const otherPlayer = new Player(
            playerData.id,
            playerData.avatar,
            this.scene,
            this.camera,
            this.renderer.domElement,
            this.socket,
            false
          );
          otherPlayer.updatePosition(playerData.position, playerData.rotation);
          otherPlayer.updateSize(playerData.size);
          this.otherPlayers.set(playerData.id, otherPlayer);
        }
      });
    });

    this.socket.on('playerConnected', (playerData) => {
      console.log('新玩家加入:', playerData.name);
      
      if (!this.otherPlayers.has(playerData.id)) {
        const otherPlayer = new Player(
          playerData.id,
          playerData.avatar,
          this.scene,
          this.camera,
          this.renderer.domElement,
          this.socket,
          false
        );
        this.otherPlayers.set(playerData.id, otherPlayer);
      }
    });

    this.socket.on('playerMoved', (data) => {
      const otherPlayer = this.otherPlayers.get(data.id);
      if (otherPlayer) {
        otherPlayer.updatePosition(data.position, data.rotation);
      }
    });

    this.socket.on('playerStateUpdate', (data) => {
      if (data.id === this.socket.id && this.player) {
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

    this.socket.on('playerDisconnected', (playerId) => {
      const otherPlayer = this.otherPlayers.get(playerId);
      if (otherPlayer) {
        otherPlayer.remove();
        this.otherPlayers.delete(playerId);
        console.log('玩家离开:', playerId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('与服务器断开连接');
    });
  }

  checkCollisions() {
    if (!this.player) return;

    let overlappingCount = 0;
    const playerPos = this.player.getPosition();
    const playerSize = this.player.currentSize;

    for (const [id, otherPlayer] of this.otherPlayers.entries()) {
      const otherPos = otherPlayer.getPosition();
      const otherSize = otherPlayer.currentSize;

      const dx = playerPos.x - otherPos.x;
      const dy = playerPos.y - otherPos.y;
      const dz = playerPos.z - otherPos.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const overlapThreshold = (playerSize + otherSize) * 0.8;

      if (distance < overlapThreshold) {
        overlappingCount++;
      }
    }

    return overlappingCount;
  }

  animate() {
    if (!this.isGameStarted) return;

    requestAnimationFrame(() => this.animate());

    if (this.player) {
      this.player.update();
      
      const cameraOffset = new THREE.Vector3(0, 8, 12);
      cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.mesh.rotation.y);
      
      const playerPos = this.player.getPosition();
      this.camera.position.lerp(
        new THREE.Vector3(
          playerPos.x + cameraOffset.x,
          playerPos.y + cameraOffset.y,
          playerPos.z + cameraOffset.z
        ),
        0.1
      );
      
      this.camera.lookAt(playerPos.x, playerPos.y + 2, playerPos.z);
    }

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

new Game();
