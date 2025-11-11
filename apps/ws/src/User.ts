import { WebSocket } from 'ws';
import { RoomManager } from './RoomManager';
import { OutgoingMessage } from './types';
import client from '@repo/db/client';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_PASSWORD } from './config';

function getRandomString(length: number) {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export class User {
  public id: string;
  public userId?: string;
  public username?: string;
  public avatarUrl?: string;
  private spaceId?: string;
  private mapId?: string;
  private roomType?: 'space' | 'map';
  public x: number;
  public y: number;
  private ws: WebSocket;

  constructor(ws: WebSocket) {
    this.id = getRandomString(10);
    this.x = 0;
    this.y = 0;
    this.ws = ws;
    this.initHandlers();
  }

  initHandlers() {
    this.ws.on('message', async (data) => {
      console.log(data);
      const parsedData = JSON.parse(data.toString());
      console.log(parsedData);
      console.log('parsedData');
      switch (parsedData.type) {
        case 'join':
          console.log('join received');
          const spaceId = parsedData.payload.spaceId;
          const mapId = parsedData.payload.mapId;
          const token = parsedData.payload.token;

          // Validate required fields - either spaceId or mapId but not both
          if ((!spaceId && !mapId) || (spaceId && mapId) || !token) {
            console.log(
              'Missing or conflicting spaceId/mapId or token in join request'
            );
            this.ws.close();
            return;
          }

          let userId;
          try {
            userId = (jwt.verify(token, JWT_PASSWORD) as JwtPayload).userId;
          } catch (error) {
            console.log(
              'Invalid token:',
              error instanceof Error ? error.message : 'Unknown error'
            );
            this.ws.close();
            return;
          }

          if (!userId) {
            console.log('No userId found in token');
            this.ws.close();
            return;
          }

          this.userId = userId;

          // Fetch user avatar and username
          const user = await client.user.findUnique({
            where: { id: parseInt(userId) },
            select: {
              id: true,
              username: true,
              avatar: {
                select: {
                  imageUrl: true,
                },
              },
            },
          });

          if (user?.avatar) {
            this.avatarUrl = user.avatar.imageUrl;
          }

          if (user?.username) {
            this.username = user.username;
          }

          // Handle space joining
          if (spaceId) {
            const space = await client.space.findFirst({
              where: {
                id: spaceId,
              },
            });

            if (!space) {
              this.ws.close();
              return;
            }

            this.spaceId = spaceId;
            this.roomType = 'space';
            RoomManager.getInstance().addUser(`space_${spaceId}`, this);

            // Spawn at a safe position within the space bounds
            this.x = Math.floor(Math.random() * space.width);
            this.y = Math.floor(Math.random() * space.height);

            // Fetch recent messages (last 50) for this space
            const recentMessages = await client.message.findMany({
              where: {
                spaceId: spaceId,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 50,
            });

            // Reverse to show oldest first
            const messages = recentMessages.reverse().map((msg) => ({
              id: msg.id,
              userId: msg.userId.toString(),
              displayName: msg.displayName,
              text: msg.text,
              createdAt: msg.createdAt.toISOString(),
            }));

            this.send({
              type: 'space-joined',
              payload: {
                spawn: {
                  x: this.x,
                  y: this.y,
                },
                userId: this.userId,
                avatarUrl: this.avatarUrl,
                users:
                  RoomManager.getInstance()
                    .rooms.get(`space_${spaceId}`)
                    ?.filter((x) => x.id !== this.id)
                    ?.map((u) => ({
                      id: u.id,
                      userId: u.userId,
                      username: u.username, // Add username
                      x: u.x,
                      y: u.y,
                      avatarUrl: u.avatarUrl,
                    })) ?? [],
                messages: messages,
              },
            });

            RoomManager.getInstance().broadcast(
              {
                type: 'user-joined',
                payload: {
                  userId: this.userId,
                  username: this.username,
                  x: this.x,
                  y: this.y,
                  avatarUrl: this.avatarUrl,
                },
              },
              this,
              `space_${spaceId}`
            );
          }

          // Handle map joining
          if (mapId) {
            const map = await client.map.findFirst({
              where: {
                id: mapId,
              },
            });

            if (!map) {
              this.ws.close();
              return;
            }

            this.mapId = mapId;
            this.roomType = 'map';
            RoomManager.getInstance().addUser(`map_${mapId}`, this);

            // Track map visit for the user
            if (this.userId) {
              try {
                await client.userMapVisit.upsert({
                  where: {
                    userId_mapId: {
                      userId: parseInt(this.userId),
                      mapId: mapId,
                    },
                  },
                  update: {
                    visitedAt: new Date(),
                  },
                  create: {
                    userId: parseInt(this.userId),
                    mapId: mapId,
                  },
                });
              } catch (error) {
                console.error('Failed to track map visit:', error);
              }
            }

            // Spawn at a safe default position (center-left area, usually walkable)
            // TODO: Implement proper spawn point selection:
            // - Option 1: Let users click on chairs/desks to select their spawn
            // - Option 2: Define spawn points in map metadata (Tiled map properties)
            // - Option 3: Parse Tiled map collision layer to find walkable tiles
            this.x = 10;
            this.y = 10;

            // Fetch recent messages (last 50) for this map
            const recentMessages = await client.message.findMany({
              where: {
                mapId: mapId,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 50,
            });

            // Reverse to show oldest first
            const messages = recentMessages.reverse().map((msg) => ({
              id: msg.id,
              userId: msg.userId.toString(),
              displayName: msg.displayName,
              text: msg.text,
              createdAt: msg.createdAt.toISOString(),
            }));

            this.send({
              type: 'map-joined',
              payload: {
                spawn: {
                  x: this.x,
                  y: this.y,
                },
                userId: this.userId,
                avatarUrl: this.avatarUrl,
                users:
                  RoomManager.getInstance()
                    .rooms.get(`map_${mapId}`)
                    ?.filter((x) => x.id !== this.id)
                    ?.map((u) => ({
                      id: u.id,
                      userId: u.userId,
                      username: u.username,
                      x: u.x,
                      y: u.y,
                      avatarUrl: u.avatarUrl,
                    })) ?? [],
                messages: messages,
              },
            });

            RoomManager.getInstance().broadcast(
              {
                type: 'user-joined',
                payload: {
                  userId: this.userId,
                  username: this.username,
                  x: this.x,
                  y: this.y,
                  avatarUrl: this.avatarUrl,
                },
              },
              this,
              `map_${this.mapId}`
            );
          }
          break;
        case 'move':
          const pixelX = parsedData.payload.x; // Now receiving PIXELS
          const pixelY = parsedData.payload.y;
          const isTeleport = parsedData.payload.teleport || false;

          // Convert pixels to grid coordinates for storage and validation
          const CELL_SIZE = 32;
          const gridX = Math.floor(pixelX / CELL_SIZE);
          const gridY = Math.floor(pixelY / CELL_SIZE);

          const xDisplacement = Math.abs(this.x - gridX);
          const yDisplacement = Math.abs(this.y - gridY);

          if (isTeleport) {
            console.log(
              `Teleport request: ${this.userId} from grid (${this.x}, ${this.y}) to grid (${gridX}, ${gridY}), pixels (${pixelX}, ${pixelY})`
            );
          }

          // Validate that user is in either a space or map
          if (!this.spaceId && !this.mapId) {
            return;
          }

          const isValidMove = await this.validateMovement(
            gridX,
            gridY,
            xDisplacement,
            yDisplacement,
            isTeleport
          );

          if (isValidMove) {
            // Update GRID position for collision checks
            this.x = gridX;
            this.y = gridY;

            // Determine the room key for broadcasting
            const roomKey = this.spaceId
              ? `space_${this.spaceId}`
              : `map_${this.mapId}`;

            // Broadcast PIXEL coordinates to other users for smooth interpolation
            RoomManager.getInstance().broadcast(
              {
                type: 'movement',
                payload: {
                  userId: this.userId,
                  x: pixelX, // Send pixels for smoothness
                  y: pixelY,
                },
              },
              this,
              roomKey
            );

            // Send acknowledgment with pixel coordinates
            this.send({
              type: 'movement-accepted',
              payload: {
                x: pixelX,
                y: pixelY,
              },
            });
            return;
          }

          // Movement rejected - send current grid position as pixels
          this.send({
            type: 'movement-rejected',
            payload: {
              x: this.x * CELL_SIZE,
              y: this.y * CELL_SIZE,
            },
          });
          break;

        case 'chat':
          // Chat message broadcasting and persistence
          try {
            const text = String(parsedData.payload?.text || '').slice(0, 2000);
            const displayName =
              parsedData.payload?.displayName || String(this.userId || this.id);
            const taggedUserIds = parsedData.payload?.taggedUserIds || [];

            if ((!this.spaceId && !this.mapId) || !this.userId || !text.trim())
              return;

            const roomKey = this.spaceId
              ? `space_${this.spaceId}`
              : `map_${this.mapId}`;

            // Filter taggedUserIds to ensure they are valid user IDs in the room
            let validTaggedUserIds: string[] = [];
            if (taggedUserIds.length > 0) {
              try {
                // Get all users in the current room/map to validate tagged users
                let roomUsers;
                if (this.spaceId) {
                  // For spaces, get users who have messages in this space (recent participants)
                  roomUsers = await client.user.findMany({
                    where: {
                      messages: {
                        some: {
                          spaceId: parseInt(this.spaceId),
                        },
                      },
                    },
                    select: {
                      id: true,
                    },
                  });
                } else if (this.mapId) {
                  // For maps, get users who have messages in this map
                  roomUsers = await client.user.findMany({
                    where: {
                      messages: {
                        some: {
                          mapId: parseInt(this.mapId),
                        },
                      },
                    },
                    select: {
                      id: true,
                    },
                  });
                }

                if (roomUsers) {
                  const roomUserIds = roomUsers.map((u) => String(u.id));
                  validTaggedUserIds = taggedUserIds.filter((userId: string) =>
                    roomUserIds.includes(userId)
                  );
                }
              } catch (err) {
                console.error('Error validating tagged users:', err);
              }
            }

            if (this.spaceId) {
              // For spaces: persist message to database
              const savedMessage = await client.message.create({
                data: {
                  spaceId: parseInt(this.spaceId),
                  userId: parseInt(this.userId),
                  displayName,
                  text: text.trim(),
                },
              });

              const chatPayload = {
                id: savedMessage.id,
                userId: this.userId,
                displayName,
                text: text.trim(),
                createdAt: savedMessage.createdAt.toISOString(),
                taggedUsers: validTaggedUserIds,
              };

              // Send to sender immediately
              this.send({
                type: 'chat',
                payload: chatPayload,
              });

              // Broadcast to other users in the room
              RoomManager.getInstance().broadcast(
                {
                  type: 'chat',
                  payload: chatPayload,
                },
                this,
                roomKey
              );
            } else if (this.mapId) {
              // For maps: persist message to database (same as spaces)
              const savedMessage = await client.message.create({
                data: {
                  mapId: parseInt(this.mapId),
                  userId: parseInt(this.userId),
                  displayName,
                  text: text.trim(),
                },
              });

              const chatPayload = {
                id: savedMessage.id,
                userId: this.userId,
                displayName,
                text: text.trim(),
                createdAt: savedMessage.createdAt.toISOString(),
                taggedUsers: validTaggedUserIds,
              };

              // Send to sender immediately
              this.send({
                type: 'chat',
                payload: chatPayload,
              });

              // Broadcast to other users in the room
              RoomManager.getInstance().broadcast(
                {
                  type: 'chat',
                  payload: chatPayload,
                },
                this,
                roomKey
              );
            }
          } catch (err) {
            console.error('Error handling chat message:', err);
          }
          break;

        // Real-time video call WebRTC signaling (doesn't affect player movement)
        case 'video-join-request':
          console.log(`[VideoCall] Join request from ${this.userId}`);
          if (!this.userId || (!this.spaceId && !this.mapId)) return;

          const joinRoomKey = this.spaceId
            ? `space_${this.spaceId}`
            : `map_${this.mapId}`;
          RoomManager.getInstance().broadcast(
            {
              type: 'video-join-request',
              payload: parsedData.payload,
            },
            this,
            joinRoomKey
          );
          break;

        case 'video-join-accepted':
          console.log(
            `[VideoCall] Join accepted for ${parsedData.payload.userId}`
          );
          if (!this.userId || (!this.spaceId && !this.mapId)) return;

          const acceptRoomKey = this.spaceId
            ? `space_${this.spaceId}`
            : `map_${this.mapId}`;

          // Send to specific user who requested to join
          RoomManager.getInstance().sendToUser(
            {
              type: 'video-join-accepted',
              payload: parsedData.payload,
            },
            parsedData.payload.userId,
            acceptRoomKey
          );
          break;

        case 'video-join-declined':
          console.log(
            `[VideoCall] Join declined for ${parsedData.payload.userId}`
          );
          if (!this.userId || (!this.spaceId && !this.mapId)) return;

          const declineRoomKey = this.spaceId
            ? `space_${this.spaceId}`
            : `map_${this.mapId}`;
          RoomManager.getInstance().sendToUser(
            {
              type: 'video-join-declined',
              payload: parsedData.payload,
            },
            parsedData.payload.userId,
            declineRoomKey
          );
          break;

        case 'video-join':
          console.log(`[VideoCall] User ${this.userId} joined video call`);
          if (!this.userId || (!this.spaceId && !this.mapId)) return;

          const videoJoinRoomKey = this.spaceId
            ? `space_${this.spaceId}`
            : `map_${this.mapId}`;

          // Broadcast to all other users that this user joined
          RoomManager.getInstance().broadcast(
            {
              type: 'video-join',
              payload: {
                ...parsedData.payload,
                userId: this.userId,
              },
            },
            this,
            videoJoinRoomKey
          );

          // TODO: Send existing participants to the new joiner
          // This would require tracking active video call participants per room
          // For now, peer connections will be established through the join process
          break;

        case 'video-leave':
          console.log(`[VideoCall] User ${this.userId} left video call`);
          if (!this.userId || (!this.spaceId && !this.mapId)) return;

          const videoLeaveRoomKey = this.spaceId
            ? `space_${this.spaceId}`
            : `map_${this.mapId}`;
          RoomManager.getInstance().broadcast(
            {
              type: 'video-leave',
              payload: {
                ...parsedData.payload,
                userId: this.userId,
              },
            },
            this,
            videoLeaveRoomKey
          );
          break;

        case 'video-offer':
          console.log(
            `[VideoCall] WebRTC offer from ${this.userId} to ${parsedData.payload.targetUserId}`
          );
          if (!this.userId || (!this.spaceId && !this.mapId)) return;

          const offerRoomKey = this.spaceId
            ? `space_${this.spaceId}`
            : `map_${this.mapId}`;
          RoomManager.getInstance().sendToUser(
            {
              type: 'video-offer',
              payload: {
                ...parsedData.payload,
                fromUserId: this.userId,
              },
            },
            parsedData.payload.targetUserId,
            offerRoomKey
          );
          break;

        case 'video-answer':
          console.log(
            `[VideoCall] WebRTC answer from ${this.userId} to ${parsedData.payload.targetUserId}`
          );
          if (!this.userId || (!this.spaceId && !this.mapId)) return;

          const answerRoomKey = this.spaceId
            ? `space_${this.spaceId}`
            : `map_${this.mapId}`;
          RoomManager.getInstance().sendToUser(
            {
              type: 'video-answer',
              payload: {
                ...parsedData.payload,
                fromUserId: this.userId,
              },
            },
            parsedData.payload.targetUserId,
            answerRoomKey
          );
          break;

        case 'video-ice-candidate':
          console.log(
            `[VideoCall] ICE candidate from ${this.userId} to ${parsedData.payload.targetUserId}`
          );
          if (!this.userId || (!this.spaceId && !this.mapId)) return;

          const iceRoomKey = this.spaceId
            ? `space_${this.spaceId}`
            : `map_${this.mapId}`;
          RoomManager.getInstance().sendToUser(
            {
              type: 'video-ice-candidate',
              payload: {
                ...parsedData.payload,
                fromUserId: this.userId,
              },
            },
            parsedData.payload.targetUserId,
            iceRoomKey
          );
          break;

        case 'video-media-state':
          console.log(`[VideoCall] Media state change from ${this.userId}`);
          if (!this.userId || (!this.spaceId && !this.mapId)) return;

          const mediaStateRoomKey = this.spaceId
            ? `space_${this.spaceId}`
            : `map_${this.mapId}`;
          RoomManager.getInstance().broadcast(
            {
              type: 'video-media-state',
              payload: {
                ...parsedData.payload,
                userId: this.userId,
              },
            },
            this,
            mediaStateRoomKey
          );
          break;

        case 'video-kick':
          console.log(
            `[VideoCall] User ${parsedData.payload.targetUserId} kicked by ${this.userId}`
          );
          if (!this.userId || (!this.spaceId && !this.mapId)) return;

          const kickRoomKey = this.spaceId
            ? `space_${this.spaceId}`
            : `map_${this.mapId}`;
          RoomManager.getInstance().sendToUser(
            {
              type: 'video-kick',
              payload: {
                ...parsedData.payload,
                kickedBy: this.userId,
              },
            },
            parsedData.payload.targetUserId,
            kickRoomKey
          );
          break;
      }
    });
  }

  async validateMovement(
    newX: number,
    newY: number,
    xDisplacement: number,
    yDisplacement: number,
    isTeleport: boolean = false
  ): Promise<boolean> {
    try {
      // 1. Movement validation: allow teleport or reasonable movement distances
      // With Phaser physics at 160 pixels/second and CELL_SIZE=32, players can move ~5 cells/second
      // Allow up to 10 cells per update to accommodate network latency and frame timing
      if (!isTeleport) {
        const maxDistance = 10;
        if (xDisplacement > maxDistance || yDisplacement > maxDistance) {
          return false;
        }
      }

      // 2. Quick check: collision with other players (no DB query needed)
      const roomKey = this.spaceId
        ? `space_${this.spaceId}`
        : `map_${this.mapId}`;
      const roomUsers = RoomManager.getInstance().rooms.get(roomKey) || [];
      for (const otherUser of roomUsers) {
        if (
          otherUser.id !== this.id &&
          otherUser.x === newX &&
          otherUser.y === newY
        ) {
          return false; // Player collision
        }
      }

      // 3. Get room data based on type
      if (this.spaceId) {
        // Handle space validation
        const space = await client.space.findFirst({
          where: { id: parseInt(this.spaceId) },
          select: {
            width: true,
            height: true,
            elements: {
              select: {
                x: true,
                y: true,
                element: {
                  select: {
                    width: true,
                    height: true,
                  },
                },
              },
            },
          },
        });

        if (!space) {
          return false;
        }

        // Check boundaries
        if (
          newX < 0 ||
          newX >= space.width ||
          newY < 0 ||
          newY >= space.height
        ) {
          return false;
        }

        // Check element collisions
        for (const spaceElement of space.elements) {
          const element = spaceElement.element;

          if (
            newX >= spaceElement.x &&
            newX < spaceElement.x + element.width &&
            newY >= spaceElement.y &&
            newY < spaceElement.y + element.height
          ) {
            return false; // Element collision
          }
        }
      } else if (this.mapId) {
        // Handle map validation
        const map = await client.map.findFirst({
          where: { id: parseInt(this.mapId) },
          select: {
            width: true,
            height: true,
            mapElements: {
              select: {
                x: true,
                y: true,
                element: {
                  select: {
                    width: true,
                    height: true,
                  },
                },
              },
            },
          },
        });

        if (!map) {
          return false;
        }

        // Check boundaries
        if (newX < 0 || newX >= map.width || newY < 0 || newY >= map.height) {
          return false;
        }

        // Check element collisions
        for (const mapElement of map.mapElements) {
          const element = mapElement.element;

          if (
            newX >= mapElement.x &&
            newX < mapElement.x + element.width &&
            newY >= mapElement.y &&
            newY < mapElement.y + element.height
          ) {
            return false; // Element collision
          }
        }
      } else {
        return false; // Neither space nor map
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  destroy() {
    const roomKey = this.spaceId
      ? `space_${this.spaceId}`
      : `map_${this.mapId}`;

    if (roomKey && (this.spaceId || this.mapId)) {
      RoomManager.getInstance().broadcast(
        {
          type: 'user-left',
          payload: {
            userId: this.userId,
          },
        },
        this,
        roomKey
      );
      RoomManager.getInstance().removeUser(this, roomKey);
    }
  }

  send(payload: OutgoingMessage) {
    this.ws.send(JSON.stringify(payload));
  }
}
