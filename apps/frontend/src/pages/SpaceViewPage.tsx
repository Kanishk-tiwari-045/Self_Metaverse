import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Minimize,
} from 'lucide-react';
// import { createPhaserGame } from '../components/PhaserGame';

interface SpaceElement {
  id: number;
  elementId: number;
  x: number;
  y: number;
  element: {
    id: number;
    imageUrl: string;
    width: number;
    height: number;
    isStatic: boolean;
  };
}

interface SpaceData {
  id: number;
  name: string;
  width: number;
  height: number;
  ownerId: number;
  elements: SpaceElement[];
}

interface User {
  id: string;
  x: number;
  y: number;
  avatarUrl?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
}

interface CurrentUser {
  x: number;
  y: number;
  userId: string;
  avatarUrl?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
}

interface ChatMessage {
  id?: number;
  userId: string;
  displayName: string;
  text: string;
  createdAt: string;
}

const CELL_SIZE = 32; // pixels per grid cell

export const SpaceViewPage = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const [space, setSpace] = useState<SpaceData | null>(null);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [avatarImages, setAvatarImages] = useState<
    Map<string, HTMLImageElement>
  >(new Map());
  const avatarAnimationFrames = useRef<Map<string, number>>(new Map());

  // Load avatar image
  const loadAvatarImage = (userId: string, avatarUrl: string) => {
    if (!avatarUrl || avatarImages.has(userId)) return;

    console.log(`Loading avatar image for user ${userId} from ${avatarUrl}`);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      console.log(
        `Avatar image loaded successfully for user ${userId}, dimensions: ${img.width}x${img.height}`
      );
      setAvatarImages((prev) => new Map(prev).set(userId, img));
      avatarAnimationFrames.current.set(userId, 0);
    };
    img.onerror = (error) => {
      console.error(`Failed to load avatar image for user ${userId}:`, error);
    };
    img.src = avatarUrl;
  };

  // Load avatar images when users change
  useEffect(() => {
    users.forEach((user) => {
      if (user.avatarUrl) {
        loadAvatarImage(user.id, user.avatarUrl);
      }
    });
    if (currentUser?.avatarUrl) {
      loadAvatarImage(currentUser.userId, currentUser.avatarUrl);
    }
  }, [users, currentUser]);

  // Load avatar images when users change
  useEffect(() => {
    users.forEach((user) => {
      if (user.avatarUrl) {
        loadAvatarImage(user.id, user.avatarUrl);
      }
    });
    if (currentUser?.avatarUrl) {
      loadAvatarImage(currentUser.userId, currentUser.avatarUrl);
    }
  }, [users, currentUser]);

  // Get sprite row based on direction - fixed mapping
  const getDirectionRow = (direction?: string) => {
    switch (direction) {
      case 'down':
        return 0; // First row - facing down
      case 'left':
        return 1; // Second row - facing left
      case 'right':
        return 2; // Third row - facing right
      case 'up':
        return 3; // Fourth row - facing up
      default:
        return 0;
    }
  };

  // Check if user is the owner of this space
  const isOwner = space && user && space.ownerId === parseInt(user.id);

  useEffect(() => {
    fetchSpaceData();
    return () => {
      // Clean up WebSocket connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      // Clear user state
      setUsers(new Map());
      setCurrentUser(null);
    };
  }, [spaceId]);

  useEffect(() => {
    if (space) {
      connectWebSocket();
    }
  }, [space]);

  useEffect(() => {
    if (space && currentUser) {
      // Use requestAnimationFrame for smoother rendering
      const animationId = requestAnimationFrame(() => {
        drawCanvas();
      });

      return () => cancelAnimationFrame(animationId);
    }
  }, [space, currentUser, users]);

  const fetchSpaceData = async () => {
    try {
      console.log('Fetching space data for spaceId:', spaceId);
      console.log('Token:', token);

      const response = await fetch(
        `http://localhost:3000/api/v1/space/${spaceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Space data:', data);
        setSpace(data);
        setIsLoading(false);
      } else {
        const errorData = await response.text();
        console.log('Error response:', errorData);
        setError('Failed to load space');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Network error');
      setIsLoading(false);
    }
  };

  const connectWebSocket = () => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket('ws://localhost:3001');
    wsRef.current = ws;

    ws.onopen = () => {
      // Immediately join the space for faster connection
      ws.send(
        JSON.stringify({
          type: 'join',
          payload: {
            spaceId: parseInt(spaceId!),
            token: token,
          },
        })
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // Process messages immediately without console.log for performance

      switch (message.type) {
        case 'space-joined':
          // Initialize current user position
          const spawnX = message.payload.spawn.x;
          const spawnY = message.payload.spawn.y;

          setCurrentUser({
            x: spawnX,
            y: spawnY,
            userId: message.payload.userId,
            avatarUrl: message.payload.avatarUrl,
            direction: 'down',
          });

          // Reset zoom to 100% (normal view)
          setZoom(1);

          // Center the scroll position on the player's spawn location
          setTimeout(() => {
            centerScrollOnPlayer(spawnX, spawnY, false);
          }, 100); // Small delay to ensure DOM is updated

          // Initialize other users from the payload
          const userMap = new Map();
          message.payload.users.forEach((u: any) => {
            if (u.userId && u.userId !== message.payload.userId) {
              userMap.set(u.userId, {
                id: u.userId,
                x: u.x || 0,
                y: u.y || 0,
                avatarUrl: u.avatarUrl,
                direction: 'down',
              });
            }
          });
          setUsers(userMap);

          // Load initial messages from the payload
          if (
            message.payload.messages &&
            Array.isArray(message.payload.messages)
          ) {
            setChatMessages(message.payload.messages);
          }
          break;

        case 'user-joined':
          setUsers((prev) => {
            const newUsers = new Map(prev);
            // Only add if it's not the current user and not already in the list
            if (
              message.payload.userId !== currentUser?.userId &&
              !newUsers.has(message.payload.userId)
            ) {
              newUsers.set(message.payload.userId, {
                id: message.payload.userId,
                x: message.payload.x || 0,
                y: message.payload.y || 0,
                avatarUrl: message.payload.avatarUrl,
                direction: 'down',
              });
            }
            return newUsers;
          });
          break;

        case 'user-left':
          setUsers((prev) => {
            const newUsers = new Map(prev);
            newUsers.delete(message.payload.userId);
            return newUsers;
          });
          break;

        case 'movement':
          // Immediately update other users' positions for fast synchronization
          if (message.payload.userId !== currentUser?.userId) {
            setUsers((prev) => {
              const newUsers = new Map(prev);
              const user = newUsers.get(message.payload.userId);
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

                // Always update position immediately
                newUsers.set(message.payload.userId, {
                  ...user,
                  x: message.payload.x,
                  y: message.payload.y,
                  direction: direction,
                });
              }
              return newUsers;
            });
          }
          break;

        case 'movement-accepted':
          // Confirm current user position when movement is accepted
          setCurrentUser((prev) =>
            prev
              ? {
                  ...prev,
                  x: message.payload.x,
                  y: message.payload.y,
                }
              : null
          );
          break;

        case 'movement-rejected':
          // Reset current user position if movement was rejected
          setCurrentUser((prev) =>
            prev
              ? {
                  ...prev,
                  x: message.payload.x,
                  y: message.payload.y,
                }
              : null
          );
          break;

        case 'chat':
          // Add new chat message
          setChatMessages((prev) => [
            ...prev,
            {
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
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (
      !currentUser ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    )
      return;

    let newX = currentUser.x;
    let newY = currentUser.y;
    let newDirection = currentUser.direction;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault(); // Prevent scrolling
        newY = Math.max(0, currentUser.y - 1);
        newDirection = 'up';
        break;
      case 'ArrowDown':
        e.preventDefault(); // Prevent scrolling
        newY = Math.min(space!.height - 1, currentUser.y + 1);
        newDirection = 'down';
        break;
      case 'ArrowLeft':
        e.preventDefault(); // Prevent scrolling
        newX = Math.max(0, currentUser.x - 1);
        newDirection = 'left';
        break;
      case 'ArrowRight':
        e.preventDefault(); // Prevent scrolling
        newX = Math.min(space!.width - 1, currentUser.x + 1);
        newDirection = 'right';
        break;
      default:
        return;
    }

    if (newX !== currentUser.x || newY !== currentUser.y) {
      // Optimistically update current user position for immediate feedback
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              x: newX,
              y: newY,
              direction: newDirection,
            }
          : null
      );

      // Send movement request immediately
      wsRef.current.send(
        JSON.stringify({
          type: 'move',
          payload: {
            x: newX,
            y: newY,
            userId: currentUser.userId,
          },
        })
      );
    }
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (
      !currentUser ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN ||
      !space
    ) {
      console.log('Double-click blocked: missing requirements');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Since canvas is positioned absolutely, use direct click coordinates on canvas
    const canvasClickX = e.clientX - rect.left;
    const canvasClickY = e.clientY - rect.top;

    // Convert to grid coordinates (no need to account for canvas offset here)
    const x = Math.floor(canvasClickX / CELL_SIZE);
    const y = Math.floor(canvasClickY / CELL_SIZE);

    console.log(
      `Double-click at canvas (${canvasClickX}, ${canvasClickY}) -> grid (${x}, ${y})`
    );

    // Validate bounds
    if (x < 0 || x >= space.width || y < 0 || y >= space.height) {
      console.log(
        `Click out of bounds: (${x}, ${y}), space size: ${space.width}x${space.height}`
      );
      return;
    }

    console.log(
      `Teleporting from (${currentUser.x}, ${currentUser.y}) to (${x}, ${y})`
    );

    // Optimistically update current user position for teleportation
    setCurrentUser((prev) =>
      prev
        ? {
            ...prev,
            x: x,
            y: y,
          }
        : null
    );

    // Send teleport request (using move message but allowing any distance)
    wsRef.current.send(
      JSON.stringify({
        type: 'move',
        payload: {
          x: x,
          y: y,
          userId: currentUser.userId,
          teleport: true, // Flag to indicate this is a teleport
        },
      })
    );
  };

  const handleCanvasClick = (_e: React.MouseEvent<HTMLCanvasElement>) => {
    // Single click is disabled - use double-click to teleport or arrow keys to move
  };

  const sendChatMessage = () => {
    if (
      !newMessage.trim() ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN ||
      !user
    ) {
      return;
    }

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

  const handleChatKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      // Handle ESC key for fullscreen exit
      if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
        return;
      }

      // Handle movement keys
      handleKeyDown(e);
    };

    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, [currentUser, space, isFullscreen]);

  // Fullscreen functionality
  const enterFullscreen = () => {
    const canvasContainer = document.querySelector(
      '.canvas-container'
    ) as HTMLElement;
    if (canvasContainer && canvasContainer.requestFullscreen) {
      canvasContainer.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen();
    }
    setIsFullscreen(false);
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-scroll chat to the latest message
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Zoom functions - scrolling handles navigation
  const zoomInCentered = () => {
    setZoom(Math.min(3, zoom + 0.25));
  };

  const zoomOutCentered = () => {
    setZoom(Math.max(0.25, zoom - 0.25));
  };

  // Helper function to center scroll on player
  const centerScrollOnPlayer = (
    playerX: number,
    playerY: number,
    smooth = false
  ) => {
    const canvas = canvasRef.current;
    const scrollContainer = canvas?.parentElement?.parentElement;
    if (canvas && scrollContainer) {
      const playerCanvasX = playerX * CELL_SIZE + CELL_SIZE / 2 + 500;
      const playerCanvasY = playerY * CELL_SIZE + CELL_SIZE / 2 + 500;

      const scrollLeft = playerCanvasX - scrollContainer.clientWidth / 2;
      const scrollTop = playerCanvasY - scrollContainer.clientHeight / 2;

      if (smooth) {
        scrollContainer.scrollTo({
          left: Math.max(0, scrollLeft),
          top: Math.max(0, scrollTop),
          behavior: 'smooth',
        });
      } else {
        scrollContainer.scrollLeft = Math.max(0, scrollLeft);
        scrollContainer.scrollTop = Math.max(0, scrollTop);
      }
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !space || !currentUser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 1;
    for (let x = 0; x <= space.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, space.height * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= space.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(space.width * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // Draw elements (all elements are obstacles/non-walkable)
    space.elements.forEach((element) => {
      const elemX = element.x * CELL_SIZE;
      const elemY = element.y * CELL_SIZE;
      const elemWidth = element.element.width * CELL_SIZE;
      const elemHeight = element.element.height * CELL_SIZE;

      // Use lighter red colors and rounded corners
      ctx.fillStyle = '#fca5a5'; // Light red color for obstacles
      ctx.strokeStyle = '#ef4444'; // Medium red border
      ctx.lineWidth = 2;

      // Draw rounded rectangle for obstacles
      const cornerRadius = 8;
      ctx.beginPath();
      ctx.roundRect(elemX, elemY, elemWidth, elemHeight, cornerRadius);
      ctx.fill();
      ctx.stroke();

      // Add text label showing element ID (E{elementId})
      ctx.fillStyle = '#7f1d1d'; // Dark red text
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Calculate center position for text
      const centerX = elemX + elemWidth / 2;
      const centerY = elemY + elemHeight / 2;

      ctx.fillText(`E${element.element.id}`, centerX, centerY);
    });

    // Draw other users
    users.forEach((user) => {
      // Quick validation without console.log for performance
      if (typeof user.x !== 'number' || typeof user.y !== 'number') {
        return;
      }

      const userX = user.x * CELL_SIZE + CELL_SIZE / 2;
      const userY = user.y * CELL_SIZE + CELL_SIZE / 2;

      // Draw user sprite or fallback to circle
      if (avatarImages.has(user.id)) {
        const avatarImg = avatarImages.get(user.id)!;

        // Check if it's a proper spritesheet (96x128 or larger)
        if (avatarImg.width >= 96 && avatarImg.height >= 128) {
          const currentFrame = Math.floor(
            avatarAnimationFrames.current.get(user.id) || 0
          );
          const row = getDirectionRow(user.direction);

          // Draw sprite from spritesheet (3 frames per direction, 4 directions)
          ctx.imageSmoothingEnabled = false; // Pixelated rendering
          ctx.drawImage(
            avatarImg,
            currentFrame * 32,
            row * 32,
            32,
            32, // Source: current animation frame and direction row
            userX - 16,
            userY - 16,
            32,
            32 // Destination: centered on user position
          );

          // Update animation frame (slower animation)
          avatarAnimationFrames.current.set(user.id, (currentFrame + 0.05) % 3);
        } else {
          // Single frame image, just draw it
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(avatarImg, userX - 16, userY - 16, 32, 32);
        }
      } else {
        // Fallback: draw circle
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(userX, userY, CELL_SIZE / 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw user label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `User ${String(user.id || 'Unknown').slice(-4)}`,
        userX,
        userY + 25
      );
    });

    // Draw current user
    const currentUserX = currentUser.x * CELL_SIZE + CELL_SIZE / 2;
    const currentUserY = currentUser.y * CELL_SIZE + CELL_SIZE / 2;

    // Draw current user sprite or fallback to circle
    if (avatarImages.has(currentUser.userId)) {
      const avatarImg = avatarImages.get(currentUser.userId)!;

      // Check if it's a proper spritesheet (96x128 or larger)
      if (avatarImg.width >= 96 && avatarImg.height >= 128) {
        const currentFrame = Math.floor(
          avatarAnimationFrames.current.get(currentUser.userId) || 0
        );
        const row = getDirectionRow(currentUser.direction);

        // Draw sprite from spritesheet (3 frames per direction, 4 directions)
        ctx.imageSmoothingEnabled = false; // Pixelated rendering
        ctx.drawImage(
          avatarImg,
          currentFrame * 32,
          row * 32,
          32,
          32, // Source: current animation frame and direction row
          currentUserX - 16,
          currentUserY - 16,
          32,
          32 // Destination: centered on user position
        );

        // Update animation frame (slower animation)
        avatarAnimationFrames.current.set(
          currentUser.userId,
          (currentFrame + 0.05) % 3
        );
      } else {
        // Single frame image, just draw it
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(avatarImg, currentUserX - 16, currentUserY - 16, 32, 32);
      }
    } else {
      // Fallback: draw circle with border
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(currentUserX, currentUserY, CELL_SIZE / 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw current user border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw current user label
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('You', currentUserX, currentUserY + 25);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Error</h1>
            <p className="mb-4">{error || 'Space not found'}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-400 hover:text-blue-300"
            >
              <ArrowLeft className="inline mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-slate-400 hover:text-white mb-2 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-white">{space.name}</h1>
            {currentUser && (
              <div className="text-sm text-slate-400 mt-1">
                <p>
                  Position: ({currentUser.x}, {currentUser.y})
                </p>
                <p>
                  User ID: {String(currentUser.userId || 'Unknown').slice(-8)}
                </p>
                <p>Space ID: {spaceId}</p>
              </div>
            )}
          </div>

          {/* Edit button for space owner only */}
          <div className="flex items-center gap-4">
            {isOwner && (
              <button
                onClick={() => navigate(`/space/${space.id}/edit`)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Edit Space
              </button>
            )}
            <div className="text-white">
              <p className="text-sm text-slate-400">Users online</p>
              <p className="text-2xl font-bold">
                {users.size + (currentUser ? 1 : 0)}
              </p>
              <div className="text-xs text-slate-500 mt-1">
                Other Users:{' '}
                {Array.from(users.entries())
                  .map(
                    ([id, user]) =>
                      `${String(id).slice(-4)}:(${user.x},${user.y})`
                  )
                  .join(', ') || 'None'}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
          {/* Zoom Controls */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={zoomOutCentered}
                className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                title="Zoom Out (Centered on Player)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-white text-sm px-3 py-1 bg-slate-700 rounded">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={zoomInCentered}
                className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                title="Zoom In (Centered on Player)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  // Center scroll on current player position
                  if (currentUser) {
                    centerScrollOnPlayer(currentUser.x, currentUser.y, true);
                  }
                }}
                className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                title="Reset Zoom & Center on Player"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                title={
                  isFullscreen ? 'Exit Fullscreen (ESC)' : 'Enter Fullscreen'
                }
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="text-slate-300 text-sm">
              Arrows to move • Double-click-teleport • Scroll to navigate • ESC
              exits fullscreen
            </div>
          </div>

          {/* Canvas Container with Scrollable Area */}
          <div
            className={`canvas-container ${
              isFullscreen
                ? 'fixed inset-0 z-50 flex bg-slate-900'
                : 'flex rounded-lg border border-slate-600 bg-slate-900 h-[60vh]'
            }`}
          >
            {/* Game Area (70% width in both normal and fullscreen modes) */}
            <div
              className="flex-[0.7] overflow-auto"
              style={{
                scrollBehavior: 'smooth',
                overflowX: 'auto',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  transition: 'transform 0.2s ease-out',
                  // Make the scrollable area much larger to allow full grid navigation
                  width: `${(space.width * CELL_SIZE + 1000) * zoom}px`, // Scale with zoom
                  height: `${(space.height * CELL_SIZE + 1000) * zoom}px`, // Scale with zoom
                  position: 'relative',
                  minWidth: '100%',
                  minHeight: '100%',
                }}
              >
                {/* Background padding area with subtle pattern */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(circle at center, rgba(30, 41, 59, 0.1) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    opacity: 0.3,
                  }}
                />

                {/* Canvas centered within the padded container */}
                <canvas
                  ref={canvasRef}
                  width={space.width * CELL_SIZE}
                  height={space.height * CELL_SIZE}
                  onClick={handleCanvasClick}
                  onDoubleClick={handleCanvasDoubleClick}
                  className="block shadow-lg"
                  title="Double-click to teleport, use arrow keys to walk"
                  style={{
                    position: 'absolute',
                    left: '500px', // Center the canvas within the padded area
                    top: '500px', // Center the canvas within the padded area
                    border: '2px solid rgba(59, 130, 246, 0.3)', // Subtle border to show game area
                    borderRadius: '4px',
                    cursor: 'default', // Normal cursor, no special pointer
                  }}
                />
              </div>
            </div>

            {/* Chat Panel (30% width - always show when currentUser exists) */}
            {currentUser && (
              <div className="flex-[0.3] bg-slate-800 border-l border-slate-600 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-600">
                  <h3 className="text-white font-semibold">Group Chat</h3>
                  <p className="text-slate-400 text-sm">
                    {users.size + 1} users online
                  </p>
                </div>

                {/* Chat Messages */}
                <div
                  ref={chatMessagesRef}
                  className="flex-1 overflow-y-auto p-4 space-y-3"
                >
                  {chatMessages.length === 0 ? (
                    <div className="text-slate-400 text-sm text-center py-8">
                      No messages yet. Say hello! 👋
                    </div>
                  ) : (
                    chatMessages.map((message, index) => (
                      <div key={message.id || index} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              message.userId === currentUser?.userId
                                ? 'bg-green-500'
                                : 'bg-orange-500'
                            }`}
                          />
                          <span className="text-slate-300 text-xs font-medium">
                            {message.displayName}
                          </span>
                          <span className="text-slate-500 text-xs">
                            {new Date(message.createdAt).toLocaleTimeString(
                              [],
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </span>
                        </div>
                        <div className="text-white text-sm ml-4 pl-2 border-l border-slate-600">
                          {message.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-slate-600">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleChatKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                      maxLength={2000}
                    />
                    <button
                      onClick={sendChatMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Send
                    </button>
                  </div>
                  <p className="text-slate-500 text-xs mt-2">
                    Press Enter to send • Chat history is saved
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex justify-center gap-8 text-white text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            <span>You</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white"></div>
            <span>Other Players</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-300 border-2 border-gray-700 rounded"></div>
            <span>Obstacles (Elements)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
