import React, { useEffect, useRef } from 'react';
import { X, Users } from 'lucide-react';
import { ParticipantVideo } from './ParticipantVideo';
import { VideoControls } from './VideoControls';
import { JitsiParticipant } from '../../services/WorkAdventureVideoService';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: JitsiParticipant[];
  currentUserId: string;
  initiatorId: string | null;
  isSidebarOpen: boolean;
  localStream: MediaStream | null;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
  onKickParticipant: (participantId: string, displayName: string) => void;
  micEnabled: boolean;
  cameraEnabled: boolean;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  participants,
  currentUserId,
  initiatorId,
  isSidebarOpen,
  localStream,
  onToggleMic,
  onToggleCamera,
  onEndCall,
  onKickParticipant,
  micEnabled,
  cameraEnabled,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle click outside to close modal
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Calculate professional grid layout based on participant count
  const participantCount = participants.length;

  const getGridLayout = (count: number) => {
    if (count === 1) return 'grid-cols-1 grid-rows-1';
    if (count === 2) return 'grid-cols-2 grid-rows-1';
    if (count <= 4) return 'grid-cols-2 grid-rows-2';
    if (count <= 6) return 'grid-cols-3 grid-rows-2';
    if (count <= 9) return 'grid-cols-3 grid-rows-3';
    if (count <= 12) return 'grid-cols-4 grid-rows-3';
    return 'grid-cols-4 grid-rows-4';
  };

  const gridLayout = getGridLayout(participantCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur effect */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* Modal Container - Adapt to sidebar state */}
      <div
        ref={modalRef}
        className={`
          relative bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl
          transition-all duration-300 ease-in-out flex flex-col
          ${
            isSidebarOpen
              ? 'ml-6 w-[calc(100vw-4rem)] h-[calc(100vh-3rem)]'
              : 'w-[calc(100vw-2rem)] h-[calc(100vh-3rem)]'
          }
          max-w-6xl max-h-[90vh]
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Video Call</h2>
              <p className="text-xs text-slate-400">
                {participantCount} participant
                {participantCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
            title="Minimize call"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Participants Grid */}
        <div className="flex-1 p-3 overflow-hidden min-h-0">
          <div
            className={`
              grid gap-3 h-full w-full
              ${gridLayout}
            `}
          >
            {participants.map((participant) => (
              <div
                key={participant.userId}
                className="w-full h-full min-w-0 min-h-0 aspect-video"
                style={{ minHeight: '200px' }}
              >
                <ParticipantVideo
                  participant={participant}
                  currentUserId={currentUserId}
                  initiatorId={initiatorId}
                  onKickParticipant={onKickParticipant}
                  localStream={
                    participant.userId === currentUserId && localStream
                      ? localStream
                      : undefined
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* Controls Bar */}
        <div className="p-3 border-t border-slate-700/50 flex-shrink-0">
          <VideoControls
            micEnabled={micEnabled}
            cameraEnabled={cameraEnabled}
            onToggleMic={onToggleMic}
            onToggleCamera={onToggleCamera}
            onEndCall={onEndCall}
            participantCount={participantCount}
          />
        </div>
      </div>
    </div>
  );
};
