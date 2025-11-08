import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MapViewToolbar } from '../components/map/MapViewToolbar';
import { MapViewSidebar } from '../components/map/MapViewSidebar';
import Phaser from 'phaser';
import { GameScene } from '../game/GameScene';
import { useWebSocket } from '../hooks/useWebSocket';
import { User, CurrentUser, ChatMessage, MapData } from '../game/types';

export const MapViewPhaser = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const { token, user } = useAuth();
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GameScene | null>(null);

  const [map, setMap] = useState<MapData | null>(null);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [gameReady, setGameReady] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Fetch map data
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/v1/maps/map/${mapId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setMap(data);
          setIsLoading(false);
        } else {
          setError('Failed to load map');
          setIsLoading(false);
        }
      } catch (err) {
        setError('Network error');
        setIsLoading(false);
      }
    };

    fetchMapData();

    return () => {
      if (gameInstance.current) {
        gameInstance.current.destroy(true);
      }
    };
  }, [mapId, token]);

  // Initialize Phaser game
  useEffect(() => {
    if (map && user && gameRef.current && !gameInstance.current) {
      const container = gameRef.current;
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: container.clientWidth,
        height: container.clientHeight,
        parent: container,
        physics: {
          default: 'arcade',
          arcade: {
            debug: false,
          },
        },
        render: {
          antialias: false,
          pixelArt: true,
          roundPixels: true,
        },
        scene: new GameScene(handleMovement),
      };

      gameInstance.current = new Phaser.Game(config);
      gameInstance.current.events.on('ready', () => {
        sceneRef.current = gameInstance.current!.scene.getScene(
          'GameScene'
        ) as GameScene;
        setGameReady(true);
      });

      const handleResize = () => {
        if (gameInstance.current && container) {
          gameInstance.current.scale.resize(
            container.clientWidth,
            container.clientHeight
          );
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [map, user]);

  // Handle sidebar toggle resize
  useEffect(() => {
    if (gameInstance.current && gameRef.current) {
      // Small delay to ensure DOM has updated after sidebar toggle
      setTimeout(() => {
        const container = gameRef.current;
        if (container) {
          gameInstance.current!.scale.resize(
            container.clientWidth,
            container.clientHeight
          );
        }
      }, 50);
    }
  }, [isSidebarOpen]);

  // Adjust renderer, canvas style and camera viewport when sidebar toggles.
  // IMPORTANT: do NOT override camera bounds (map size) here — overriding
  // bounds causes the camera to clip and prevents showing remaining map area.
  useEffect(() => {
    if (!gameInstance.current || !gameRef.current) return;
    const container = gameRef.current;
    // Wait for the layout transition to complete before resizing
    const id = window.setTimeout(() => {
      if (!gameInstance.current || !container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;

      // Resize Phaser scale & renderer
      try {
        gameInstance.current.scale.resize(w, h);
        // Some Phaser builds expose renderer.resize
        if ((gameInstance.current as any).renderer?.resize) {
          (gameInstance.current as any).renderer.resize(w, h);
        }
      } catch (e) {
        // ignore any resize errors
      }

      // Ensure canvas fills its parent (prevents leftover black gutter)
      if (gameInstance.current.canvas) {
        gameInstance.current.canvas.style.width = '100%';
        gameInstance.current.canvas.style.height = '100%';
      }

      // Adjust camera viewport to match new canvas size but KEEP bounds = map size
      const scene = gameInstance.current.scene.getScene('GameScene') as any;
      if (scene && scene.cameras && scene.cameras.main) {
        scene.cameras.main.setViewport(0, 0, w, h);
      }
    }, 120); // slightly larger delay to allow CSS transition

    return () => {
      window.clearTimeout(id);
    };
  }, [isSidebarOpen]);

  // WebSocket connection
  const wsRef = useWebSocket({
    mapId: mapId!,
    token,
    sceneRef,
    setCurrentUser,
    setUsers,
    setChatMessages,
    setError,
    gameReady,
  });

  const handleMovement = (x: number, y: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'move',
          payload: {
            x,
            y,
            userId: user?.id,
          },
        })
      );
    }
  };

  const sendChatMessage = () => {
    if (
      !newMessage.trim() ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN ||
      !user
    )
      return;

    wsRef.current.send(
      JSON.stringify({
        type: 'chat',
        payload: {
          text: newMessage.trim(),
          displayName: user.username || `User ${user.id}`,
        },
      })
    );
    setNewMessage('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !map) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="mb-4">{error || 'Map not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Vertical Toolbar - Left edge */}
      <MapViewToolbar
        isChatOpen={isSidebarOpen}
        onToggleChat={() => setIsSidebarOpen(!isSidebarOpen)}
        usersOnline={users.size + (currentUser ? 1 : 0)}
      />

      {/* Chat Sidebar - Slides in from left */}
      {isSidebarOpen && (
        <MapViewSidebar
          currentUser={currentUser}
          users={users}
          chatMessages={chatMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSendMessage={sendChatMessage}
        />
      )}

      {/* Main Phaser Game Area - Full screen with margin for toolbar/sidebar */}
      <div
        className="transition-all duration-300"
        style={{
          marginLeft: isSidebarOpen ? '368px' : '48px', // 48px toolbar + 320px sidebar OR just toolbar
          height: '100vh',
          width: isSidebarOpen ? 'calc(100vw - 368px)' : 'calc(100vw - 48px)',
        }}
      >
        <div
          ref={gameRef}
          className="w-full h-full bg-black"
          onClick={() => {
            if (gameInstance.current?.canvas) {
              gameInstance.current.canvas.focus();
            }
          }}
          tabIndex={0}
        />
      </div>
    </div>
  );
};
