export class ChatSystem {
  constructor(socket) {
    this.socket = socket;
    this.messagesContainer = document.getElementById('chatMessages');
    this.inputElement = document.getElementById('chatInput');
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const message = this.inputElement.value.trim();
        if (message) {
          this.socket.emit('chatMessage', message);
          this.inputElement.value = '';
        }
      }
    });

    this.socket.on('chatMessage', (data) => {
      this.addMessage(data.sender, data.message);
    });

    this.addSystemMessage('欢迎来到节操排行榜游戏！');
    this.addSystemMessage('靠近其他玩家可以增加节操值 💔');
  }

  addMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    
    const senderSpan = document.createElement('span');
    senderSpan.className = 'sender';
    senderSpan.textContent = sender + ':';
    
    const messageText = document.createTextNode(' ' + message);
    
    messageElement.appendChild(senderSpan);
    messageElement.appendChild(messageText);
    
    this.messagesContainer.appendChild(messageElement);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

    if (this.messagesContainer.children.length > 50) {
      this.messagesContainer.removeChild(this.messagesContainer.firstChild);
    }
  }

  addSystemMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message system';
    messageElement.textContent = '📢 ' + message;
    
    this.messagesContainer.appendChild(messageElement);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
}
