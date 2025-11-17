export class HUD {
  constructor() {
    this.jiecaoElement = document.getElementById('jiecaoValue');
    this.sizeElement = document.getElementById('sizeValue');
    this.speedElement = document.getElementById('speedValue');
    this.overlapElement = document.getElementById('overlapCount');
    this.leaderboardList = document.getElementById('leaderboardList');
  }

  updateStats(jiecao, size, speed, overlapping) {
    this.jiecaoElement.textContent = Math.floor(jiecao);
    this.sizeElement.textContent = size.toFixed(2) + 'x';
    this.speedElement.textContent = Math.floor(speed * 100) + '%';
    this.overlapElement.textContent = overlapping;

    const jiecaoColor = this.getJiecaoColor(jiecao);
    this.jiecaoElement.style.color = jiecaoColor;
  }

  getJiecaoColor(jiecao) {
    if (jiecao < 50) return '#4ade80';
    if (jiecao < 150) return '#fbbf24';
    if (jiecao < 300) return '#fb923c';
    return '#ef4444';
  }

  updateLeaderboard(leaderboard) {
    this.leaderboardList.innerHTML = '';

    if (leaderboard.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.style.textAlign = 'center';
      emptyItem.style.color = '#888';
      emptyItem.textContent = '暂无数据';
      this.leaderboardList.appendChild(emptyItem);
      return;
    }

    leaderboard.forEach((player, index) => {
      const item = document.createElement('div');
      item.className = 'leaderboard-item';
      
      const medals = ['🥇', '🥈', '🥉'];
      const medal = index < 3 ? medals[index] : `${index + 1}.`;
      
      item.innerHTML = `
        <span>${medal} ${player.name}</span>
        <span style="color: ${this.getJiecaoColor(player.jiecao)}">${player.jiecao}</span>
      `;
      
      this.leaderboardList.appendChild(item);
    });
  }
}
