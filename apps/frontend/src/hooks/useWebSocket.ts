import { useRef, useEffect, Dispatch, SetStateAction } from 'react';
import { User, CurrentUser, ChatMessage } from '../game/types';
import { GameScene } from '../game/GameScene';

interface UseWebSocketProps {
  mapId: string;
  token: string | null;
  sceneRef: React.RefObject<GameScene | null>;
  setCurrentUser: Dispatch<SetStateAction<CurrentUser | null>>;
  setUsers: Dispatch<SetStateAction<Map<string, User>>>;
  setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setError: Dispatch<SetStateAction<string>>;
  gameReady: boolean; // Only connect when game is ready
}

export function useWebSocket({
  mapId,
  token,
  sceneRef,
  setCurrentUser,
  setUsers,
  setChatMessages,
  setError,
  gameReady,
}: UseWebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Only connect when token is available AND game is ready
    if (!token || !gameReady) return;

    const ws = new WebSocket('ws://localhost:3001');
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'join',
          payload: {
            mapId: parseInt(mapId),
            token: token,
          },
        })
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'map-joined':
          const spawnX = message.payload.spawn.x;
          const spawnY = message.payload.spawn.y;
          sceneRef.current?.setPlayerPosition(spawnX, spawnY);
          sceneRef.current?.setCurrentUser(
            message.payload.userId,
            message.payload.avatarUrl
          );
          setCurrentUser({
            x: spawnX,
            y: spawnY,
            userId: message.payload.userId,
          });
          if (message.payload.messages) {
            setChatMessages(message.payload.messages);
          }
          const userMap = new Map();
          message.payload.users.forEach((u: any) => {
            if (u.userId && u.userId !== message.payload.userId) {
              const userIdString = String(u.userId);
              userMap.set(userIdString, {
                id: userIdString,
                x: u.x || 0,
                y: u.y || 0,
                avatarUrl: u.avatarUrl,
                direction: 'down',
              });
              sceneRef.current?.addOtherPlayer(
                userIdString,
                u.x,
                u.y,
                u.avatarUrl
              );
            }
          });
          setUsers(userMap);
          break;

        case 'user-joined':
          const joinedUserId = String(message.payload.userId);

          setUsers((prev) => {
            const newUsers = new Map(prev);
            if (!newUsers.has(joinedUserId)) {
              newUsers.set(joinedUserId, {
                id: joinedUserId,
                x: message.payload.x || 0,
                y: message.payload.y || 0,
                avatarUrl: message.payload.avatarUrl,
                direction: 'down',
              });
            }
            return newUsers;
          });
          sceneRef.current?.addOtherPlayer(
            joinedUserId,
            message.payload.x,
            message.payload.y,
            message.payload.avatarUrl
          );
          break;

        case 'user-left':
          const leftUserId = String(message.payload.userId);

          setUsers((prev) => {
            const newUsers = new Map(prev);
            newUsers.delete(leftUserId);
            return newUsers;
          });
          sceneRef.current?.removeOtherPlayer(leftUserId);
          break;

        case 'movement':
          console.log('Received movement message:', message.payload);
          console.log('Message userId type:', typeof message.payload.userId);

          const movementUserId = String(message.payload.userId);

          setCurrentUser((currentUser) => {
            const currentUserId = String(currentUser?.userId);

            if (movementUserId !== currentUserId) {
              console.log(
                `Processing movement for user ${movementUserId} to (${message.payload.x}, ${message.payload.y})`
              );

              setUsers((prev) => {
                const newUsers = new Map(prev);
                const user = newUsers.get(movementUserId);
                if (user) {
                  // Calculate direction based on movement
                  let direction = user.direction || 'down';
                  const deltaX = message.payload.x - user.x;
                  const deltaY = message.payload.y - user.y;

                  if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    direction = deltaX > 0 ? 'right' : 'left';
                  } else if (deltaY !== 0) {
                    direction = deltaY > 0 ? 'down' : 'up';
                  }

                  newUsers.set(movementUserId, {
                    ...user,
                    x: message.payload.x,
                    y: message.payload.y,
                    direction: direction,
                  });
                } else {
                  console.warn(
                    `User ${movementUserId} not found in users map for movement update`
                  );
                }
                return newUsers;
              });

              sceneRef.current?.updateOtherPlayerMovement(
                movementUserId,
                message.payload.x,
                message.payload.y
              );
            } else {
              console.log('Ignoring own movement message');
            }

            return currentUser;
          });
          break;

        case 'chat':
          setChatMessages((prev) => [
            ...prev,
            {
              id: message.payload.id,
              userId: message.payload.userId,
              displayName: message.payload.displayName,
              text: message.payload.text,
              createdAt: message.payload.createdAt,
            },
          ]);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [
    mapId,
    token,
    gameReady,
    sceneRef,
    setCurrentUser,
    setUsers,
    setChatMessages,
    setError,
  ]);

  return wsRef;
}
