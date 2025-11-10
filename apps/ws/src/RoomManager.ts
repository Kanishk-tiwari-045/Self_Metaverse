import type { User } from './User';
import { OutgoingMessage } from './types';

export class RoomManager {
  rooms: Map<string, User[]> = new Map();
  static instance: RoomManager;

  private constructor() {
    this.rooms = new Map();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new RoomManager();
    }
    return this.instance;
  }

  public removeUser(user: User, spaceId: string) {
    if (!this.rooms.has(spaceId)) {
      return;
    }
    this.rooms.set(
      spaceId,
      this.rooms.get(spaceId)?.filter((u) => u.id !== user.id) ?? []
    );
  }

  public addUser(spaceId: string, user: User) {
    if (!this.rooms.has(spaceId)) {
      this.rooms.set(spaceId, [user]);
      return;
    }
    this.rooms.set(spaceId, [...(this.rooms.get(spaceId) ?? []), user]);
  }

  public broadcast(message: OutgoingMessage, user: User, roomId: string) {
    if (!this.rooms.has(roomId)) {
      return;
    }
    this.rooms.get(roomId)?.forEach((u) => {
      if (u.id !== user.id) {
        u.send(message);
      }
    });
  }

  public sendToUser(
    message: OutgoingMessage,
    targetUserId: string,
    roomId: string
  ) {
    if (!this.rooms.has(roomId)) {
      console.log(
        `[RoomManager] Room ${roomId} not found for user ${targetUserId}`
      );
      return;
    }

    // Try both string and number comparison to handle type mismatches
    const targetUser = this.rooms.get(roomId)?.find((u) => {
      return (
        u.userId === targetUserId ||
        u.userId === String(targetUserId) ||
        String(u.userId) === targetUserId
      );
    });

    if (targetUser) {
      console.log(
        `[RoomManager] ✓ Sending ${message.type} to user ${targetUserId}`
      );
      targetUser.send(message);
    } else {
      console.log(
        `[RoomManager] ✗ User ${targetUserId} not found in room ${roomId}`
      );
      console.log(
        `[RoomManager] Available users:`,
        this.rooms
          .get(roomId)
          ?.map((u) => ({ userId: u.userId, type: typeof u.userId }))
      );
    }
  }
}
