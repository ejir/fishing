import { LeaderboardEntry } from './types';

export class HUD {
  private jiecaoElement: HTMLElement | null;
  private sizeElement: HTMLElement | null;
  private speedElement: HTMLElement | null;
  private overlapElement: HTMLElement | null;
  private leaderboardListElement: HTMLElement | null;

  constructor() {
    this.jiecaoElement = document.getElementById('jiecaoValue');
    this.sizeElement = document.getElementById('sizeValue');
    this.speedElement = document.getElementById('speedValue');
    this.overlapElement = document.getElementById('overlapCount');
    this.leaderboardListElement = document.getElementById('leaderboardList');
  }

  public updateStats(jiecao: number, size: number, speed: number, overlapping: number): void {
    if (this.jiecaoElement) {
      this.jiecaoElement.textContent = Math.floor(jiecao).toString();
    }
    if (this.sizeElement) {
      this.sizeElement.textContent = `${size.toFixed(2)}x`;
    }
    if (this.speedElement) {
      this.speedElement.textContent = `${Math.round(speed * 100)}%`;
    }
    if (this.overlapElement) {
      this.overlapElement.textContent = overlapping.toString();
    }
  }

  public updateLeaderboard(leaderboard: LeaderboardEntry[]): void {
    if (!this.leaderboardListElement) return;

    this.leaderboardListElement.innerHTML = '';
    
    leaderboard.forEach((entry, index) => {
      const item = document.createElement('div');
      item.className = 'leaderboard-item';
      
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      
      item.innerHTML = `
        <span>${medal} ${entry.name}</span>
        <span>${entry.jiecao}</span>
      `;
      
      if (this.leaderboardListElement) {
        this.leaderboardListElement.appendChild(item);
      }
    });
  }
}
