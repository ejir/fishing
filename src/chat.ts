import { Socket } from 'socket.io-client';
import { ChatMessage } from './types';

export class ChatSystem {
  private socket: Socket;
  private chatMessages: HTMLElement | null;
  private chatInput: HTMLInputElement | null;

  constructor(socket: Socket) {
    this.socket = socket;
    this.chatMessages = document.getElementById('chatMessages');
    this.chatInput = document.getElementById('chatInput') as HTMLInputElement;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (this.chatInput) {
      this.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });
    }

    this.socket.on('chatMessage', (data: ChatMessage) => {
      this.addMessage(data.sender, data.message, false);
    });
  }

  private sendMessage(): void {
    if (!this.chatInput) return;
    
    const message = this.chatInput.value.trim();
    if (message) {
      this.socket.emit('chatMessage', message);
      this.chatInput.value = '';
    }
  }

  public addMessage(sender: string, message: string, isSystem: boolean = false): void {
    if (!this.chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message${isSystem ? ' system' : ''}`;
    
    if (isSystem) {
      messageDiv.textContent = message;
    } else {
      const senderSpan = document.createElement('span');
      senderSpan.className = 'sender';
      senderSpan.textContent = `${sender}:`;
      
      const contentSpan = document.createElement('span');
      contentSpan.className = 'content';
      contentSpan.textContent = message;
      
      messageDiv.appendChild(senderSpan);
      messageDiv.appendChild(contentSpan);
    }

    this.chatMessages.appendChild(messageDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    // 限制消息数量
    while (this.chatMessages.children.length > 50) {
      this.chatMessages.removeChild(this.chatMessages.firstChild!);
    }
  }
}
