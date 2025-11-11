export interface User {
  id: string;
  username?: string;
  x: number;
  y: number;
  avatarId?: number;
  avatarUrl?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export interface CurrentUser {
  x: number;
  y: number;
  userId: string;
}

export interface ChatMessage {
  id?: number;
  userId: string;
  displayName: string;
  text: string;
  createdAt: string;
  taggedUsers?: string[]; // Array of userIds that were tagged in this message
}

export interface PositionInterface {
  x: number;
  y: number;
}

export interface HasPlayerMovedInterface extends PositionInterface {
  oldX?: number;
  oldY?: number;
  direction?: string;
  moving?: boolean;
}

export interface MapData {
  id: number;
  name: string;
  width: number;
  height: number;
  ownerId: number;
  owner: string;
}
