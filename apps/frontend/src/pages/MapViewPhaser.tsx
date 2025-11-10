import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MapViewToolbar } from '../components/map/MapViewToolbar';
import { MapViewSidebar } from '../components/map/MapViewSidebar';
import {
  VideoCallModal,
  FloatingVideoCard,
  PermissionRequestModal,
  JoinRequestModal,
  KickConfirmationModal,
} from '../components/video-call';
import Phaser from 'phaser';
import { GameScene } from '../game/GameScene';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  WorkAdventureVideoService,
  JitsiParticipant,
  JoinRequest,
} from '../services/WorkAdventureVideoService';
import { User, CurrentUser, ChatMessage, MapData } from '../game/types';

// Video call related state
interface VideoCallState {
  isModalOpen: boolean;
  isInCall: boolean;
  showPermissionModal: boolean;
  showJoinRequestModal: boolean;
  showKickModal: boolean;
  currentJoinRequest: JoinRequest | null;
  participantToKick: { id: string; name: string } | null;
}

const MapViewPhaser = () => {
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

  // Video call state
  const [videoCallState, setVideoCallState] = useState<VideoCallState>({
    isModalOpen: false,
    isInCall: false,
    showPermissionModal: false,
    showJoinRequestModal: false,
    showKickModal: false,
    currentJoinRequest: null,
    participantToKick: null,
  });
  const [participants, setParticipants] = useState<JitsiParticipant[]>([]);

  // WorkAdventure video service
  const videoService = useMemo(
    () =>
      new WorkAdventureVideoService(
        (type: string, payload: any) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, payload }));
          }
        },
        () => {
          // onParticipantsUpdate callback
          const currentParticipants = videoService.getParticipants();
          console.log(
            '[MapViewPhaser] Participants updated:',
            currentParticipants
          );
          setParticipants(currentParticipants);
        },
        (request: JoinRequest) => {
          // onJoinRequest callback
          console.log('[MapViewPhaser] Join request received:', request);
          setVideoCallState((prev) => ({
            ...prev,
            showJoinRequestModal: true,
            currentJoinRequest: request,
          }));
        },
        (kickedBy: string) => {
          // onKickNotification callback
          console.log(
            `[MapViewPhaser] Kicked by ${kickedBy} - returning to map`
          );

          // Reset video call state immediately
          setVideoCallState((prev) => ({
            ...prev,
            isInCall: false,
            isModalOpen: false,
            showPermissionModal: false,
            showJoinRequestModal: false,
            showKickModal: false,
            currentJoinRequest: null,
            participantToKick: null,
          }));

          // Show timed notification
          const notification = document.createElement('div');
          notification.className =
            'fixed top-4 right-4 z-[100] bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg max-w-sm animate-slide-in-right';
          notification.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <div>
            <div class="font-semibold">Removed from Call</div>
            <div class="text-sm text-red-100">You have been removed by ${kickedBy}</div>
          </div>
        </div>
      `;

          document.body.appendChild(notification);

          // Auto-remove notification after 5 seconds
          setTimeout(() => {
            if (notification.parentNode) {
              notification.style.animation =
                'slide-out-right 0.3s ease-in forwards';
              setTimeout(() => {
                document.body.removeChild(notification);
              }, 300);
            }
          }, 5000);
        }
      ),
    []
  );

  // Video call handlers
  const handleVideoJoinRequest = useCallback(
    (payload: any) => {
      console.log('[WorkAdventureVideo] Handling video-join-request:', payload);
      videoService.handleJoinRequest(payload);
    },
    [videoService]
  );

  const handleVideoJoinAccepted = useCallback(
    async (payload: any) => {
      console.log(
        '[WorkAdventureVideo] Handling video-join-accepted:',
        payload
      );
      await videoService.handleJoinAccepted(payload);

      // If we were accepted, update UI state
      if (payload.userId === user?.id.toString()) {
        console.log('[MapViewPhaser] We were accepted into the call!');
        setVideoCallState((prev) => ({
          ...prev,
          isInCall: true,
          isModalOpen: true, // Show modal when joining
        }));
      }
    },
    [videoService, user]
  );

  const handleVideoJoinDeclined = useCallback(
    (payload: any) => {
      console.log(
        '[WorkAdventureVideo] Handling video-join-declined:',
        payload
      );
      videoService.handleJoinDeclined(payload);
    },
    [videoService]
  );

  const handleVideoJoin = useCallback(
    async (payload: any) => {
      console.log('[WorkAdventureVideo] Handling video-join:', payload);
      await videoService.handleParticipantJoin(payload);
    },
    [videoService]
  );

  const handleVideoLeave = useCallback(
    (payload: any) => {
      console.log('[WorkAdventureVideo] Handling video-leave:', payload);
      videoService.handleParticipantLeave(payload);
    },
    [videoService]
  );

  const handleVideoOffer = useCallback(
    async (payload: any) => {
      console.log('[WorkAdventureVideo] Handling video-offer:', payload);
      await videoService.handleOffer(payload);
    },
    [videoService]
  );

  const handleVideoAnswer = useCallback(
    async (payload: any) => {
      console.log('[WorkAdventureVideo] Handling video-answer:', payload);
      await videoService.handleAnswer(payload);
    },
    [videoService]
  );

  const handleVideoIceCandidate = useCallback(
    async (payload: any) => {
      console.log(
        '[WorkAdventureVideo] Handling video-ice-candidate:',
        payload
      );
      await videoService.handleIceCandidate(payload);
    },
    [videoService]
  );

  const handleVideoMediaState = useCallback(
    (payload: any) => {
      console.log('[WorkAdventureVideo] Handling video-media-state:', payload);
      videoService.handleMediaStateChange(payload);
    },
    [videoService]
  );

  const handleVideoKick = useCallback(
    (payload: any) => {
      console.log('[WorkAdventureVideo] Handling video-kick:', payload);
      videoService.handleKick(payload);
    },
    [videoService, user]
  );

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
    onVideoJoinRequest: handleVideoJoinRequest,
    onVideoJoinAccepted: handleVideoJoinAccepted,
    onVideoJoinDeclined: handleVideoJoinDeclined,
    onVideoJoin: handleVideoJoin,
    onVideoLeave: handleVideoLeave,
    onVideoOffer: handleVideoOffer,
    onVideoAnswer: handleVideoAnswer,
    onVideoIceCandidate: handleVideoIceCandidate,
    onVideoMediaState: handleVideoMediaState,
    onVideoKick: handleVideoKick,
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

  // Video call functionality
  const handleJoinCall = async () => {
    if (!user) {
      alert('You must be logged in to join calls.');
      return;
    }

    // Show permission modal first
    setVideoCallState((prev) => ({ ...prev, showPermissionModal: true }));
  };

  const handlePermissionAccept = async () => {
    try {
      // Request permissions
      const permissions = await videoService.requestPermissions(true, true);

      if (!permissions.audio && !permissions.video) {
        alert('Camera and microphone access is required for video calls.');
        setVideoCallState((prev) => ({ ...prev, showPermissionModal: false }));
        return;
      }

      // Join room
      const roomName = `room-${mapId}`;
      const displayName = user!.username || `User ${user!.id}`;

      // Check if there are existing participants (need to request to join)
      const existingParticipants = participants.length > 0;

      console.log(
        `[MapViewPhaser] Joining video call. Existing participants: ${existingParticipants}`
      );

      await videoService.joinRoom(
        roomName,
        user!.id.toString(),
        displayName,
        existingParticipants
      );

      setVideoCallState((prev) => ({
        ...prev,
        isInCall: true,
        showPermissionModal: false,
        isModalOpen: true, // Show modal by default when joining
      }));
    } catch (error) {
      console.error('Failed to join video call:', error);
      alert(
        'Failed to join the call. Please check your camera and microphone permissions.'
      );
      setVideoCallState((prev) => ({ ...prev, showPermissionModal: false }));
    }
  };

  const handlePermissionDecline = () => {
    setVideoCallState((prev) => ({ ...prev, showPermissionModal: false }));
  };

  const handleToggleVideoModal = () => {
    setVideoCallState((prev) => ({ ...prev, isModalOpen: !prev.isModalOpen }));
  };

  const handleEndCall = () => {
    videoService.leaveRoom();
    setVideoCallState((prev) => ({
      ...prev,
      isInCall: false,
      isModalOpen: false,
    }));
  };

  const handleToggleMic = () => {
    videoService.toggleMicrophone();
  };

  const handleToggleCamera = () => {
    videoService.toggleCamera();
  };

  const handleKickParticipant = (
    participantId: string,
    displayName: string
  ) => {
    setVideoCallState((prev) => ({
      ...prev,
      showKickModal: true,
      participantToKick: { id: participantId, name: displayName },
    }));
  };

  const handleKickConfirm = () => {
    if (videoCallState.participantToKick) {
      videoService.kickParticipant(videoCallState.participantToKick.id);
      setVideoCallState((prev) => ({
        ...prev,
        showKickModal: false,
        participantToKick: null,
      }));
    }
  };

  const handleKickCancel = () => {
    setVideoCallState((prev) => ({
      ...prev,
      showKickModal: false,
      participantToKick: null,
    }));
  };

  const handleJoinRequestAccept = () => {
    if (videoCallState.currentJoinRequest) {
      console.log(
        `[MapViewPhaser] Accepting join request from ${videoCallState.currentJoinRequest.userId}`
      );
      videoService.acceptJoinRequest(videoCallState.currentJoinRequest.userId);
      setVideoCallState((prev) => ({
        ...prev,
        showJoinRequestModal: false,
        currentJoinRequest: null,
      }));
    }
  };

  const handleJoinRequestDecline = () => {
    if (videoCallState.currentJoinRequest) {
      videoService.declineJoinRequest(videoCallState.currentJoinRequest.userId);
      setVideoCallState((prev) => ({
        ...prev,
        showJoinRequestModal: false,
        currentJoinRequest: null,
      }));
    }
  };

  // Cleanup video service on component unmount
  useEffect(() => {
    return () => {
      if (videoService.isActive()) {
        videoService.leaveRoom();
      }
    };
  }, [videoService]);

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
        isVideoModalOpen={videoCallState.isModalOpen}
        onToggleVideoModal={handleToggleVideoModal}
        isInCall={videoCallState.isInCall}
        onJoinCall={handleJoinCall}
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

      {/* Video Call Modal */}
      <VideoCallModal
        isOpen={videoCallState.isModalOpen}
        onClose={handleToggleVideoModal}
        participants={participants}
        currentUserId={user?.id.toString() || ''}
        initiatorId={videoService.getInitiatorId()}
        isSidebarOpen={isSidebarOpen}
        localStream={videoService.getLocalStream()}
        onToggleMic={handleToggleMic}
        onToggleCamera={handleToggleCamera}
        onEndCall={handleEndCall}
        onKickParticipant={handleKickParticipant}
        micEnabled={videoService.isMicEnabled()}
        cameraEnabled={videoService.isCameraEnabled()}
      />

      {/* Floating Video Card - Only show when in call but modal is closed */}
      {videoCallState.isInCall && !videoCallState.isModalOpen && (
        <FloatingVideoCard
          isVisible={true}
          localStream={videoService.getLocalStream()}
          displayName={user?.username || 'You'}
          micEnabled={videoService.isMicEnabled()}
          cameraEnabled={videoService.isCameraEnabled()}
          onToggleMic={handleToggleMic}
          onToggleCamera={handleToggleCamera}
          onEndCall={handleEndCall}
          onExpand={handleToggleVideoModal}
        />
      )}

      {/* Main Phaser Game Area - Full screen with margin for toolbar/sidebar */}
      <div
        className="transition-all duration-300"
        style={{
          marginLeft: isSidebarOpen ? '368px' : '48px', // 48px toolbar + 320px sidebar OR just toolbar
          marginRight: '0px', // No right sidebar now - video calls use modals/floating cards
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

      {/* Permission Request Modal */}
      <PermissionRequestModal
        isOpen={videoCallState.showPermissionModal}
        onAccept={handlePermissionAccept}
        onDecline={handlePermissionDecline}
      />

      {/* Join Request Modal */}
      <JoinRequestModal
        isOpen={videoCallState.showJoinRequestModal}
        request={videoCallState.currentJoinRequest}
        onAccept={handleJoinRequestAccept}
        onDecline={handleJoinRequestDecline}
      />

      {/* Kick Confirmation Modal */}
      <KickConfirmationModal
        isOpen={videoCallState.showKickModal}
        participantName={videoCallState.participantToKick?.name || ''}
        onConfirm={handleKickConfirm}
        onCancel={handleKickCancel}
      />
    </div>
  );
};

export { MapViewPhaser };
