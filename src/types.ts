export interface Position2D {
  x: number;
  y: number;
}

export interface AvatarPart {
  type: 'circle' | 'rect' | 'triangle' | 'ellipse';
  color: string;
  size: number;
  position: Position2D;
  rotation: number;
}

export interface AvatarData {
  parts: AvatarPart[];
}

export interface PlayerState {
  id: string;
  name: string;
  avatar: AvatarData;
  position: Position2D;
  rotation: number;
  jiecao: number;
  size: number;
  speed: number;
  overlapping: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  jiecao: number;
}

export interface ChatMessage {
  sender: string;
  message: string;
  timestamp: number;
}
