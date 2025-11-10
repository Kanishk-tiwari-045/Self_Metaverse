import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Crown, UserX } from 'lucide-react';
import { JitsiParticipant } from '../../services/WorkAdventureVideoService';

interface ParticipantVideoProps {
  participant: JitsiParticipant;
  currentUserId: string;
  initiatorId: string | null;
  onKickParticipant: (participantId: string, displayName: string) => void;
  localStream?: MediaStream;
}

export const ParticipantVideo: React.FC<ParticipantVideoProps> = ({
  participant,
  currentUserId,
  initiatorId,
  onKickParticipant,
  localStream,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isCurrentUser = participant.userId === currentUserId;
  const canKick = initiatorId === currentUserId && !isCurrentUser;

  // Set up video stream
  useEffect(() => {
    if (videoRef.current) {
      const streamToUse = isCurrentUser ? localStream : participant.stream;
      if (streamToUse && participant.cameraEnabled) {
        videoRef.current.srcObject = streamToUse;
        videoRef.current.muted = isCurrentUser; // Mute local video to prevent echo
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [
    participant.stream,
    participant.cameraEnabled,
    localStream,
    isCurrentUser,
  ]);

  const handleKick = () => {
    onKickParticipant(participant.userId, participant.displayName);
  };

  return (
    <div className="relative w-full h-full bg-slate-800 rounded-lg overflow-hidden border border-slate-700/50 group aspect-video">
      {/* Video Element - Always maintain same container size */}
      {participant.cameraEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-semibold text-white">
                {participant.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <VideoOff className="w-6 h-6 text-slate-400 mx-auto" />
          </div>
        </div>
      )}

      {/* Participant Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Name and Role */}
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium truncate max-w-[120px]">
                {participant.displayName}
                {isCurrentUser && ' (You)'}
              </span>
              {participant.isInitiator && (
                <div title="Call Initiator">
                  <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                </div>
              )}
            </div>

            {/* Media Status */}
            <div className="flex items-center gap-1">
              {participant.micEnabled ? (
                <div className="p-1 bg-green-500/20 rounded">
                  <Mic className="w-3 h-3 text-green-400" />
                </div>
              ) : (
                <div className="p-1 bg-red-500/20 rounded">
                  <MicOff className="w-3 h-3 text-red-400" />
                </div>
              )}
              {participant.cameraEnabled ? (
                <div className="p-1 bg-green-500/20 rounded">
                  <Video className="w-3 h-3 text-green-400" />
                </div>
              ) : (
                <div className="p-1 bg-red-500/20 rounded">
                  <VideoOff className="w-3 h-3 text-red-400" />
                </div>
              )}
            </div>
          </div>

          {/* Kick Button - Only for initiator and not for themselves */}
          {canKick && (
            <button
              onClick={handleKick}
              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors opacity-0 group-hover:opacity-100"
              title={`Kick ${participant.displayName}`}
            >
              <UserX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Connection Quality Indicator (placeholder) */}
      <div className="absolute top-2 right-2">
        <div
          className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
          title="Good connection"
        />
      </div>
    </div>
  );
};
