import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  Monitor,
} from 'lucide-react';

interface VideoControlsProps {
  micEnabled: boolean;
  cameraEnabled: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
  participantCount: number;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  micEnabled,
  cameraEnabled,
  onToggleMic,
  onToggleCamera,
  onEndCall,
  participantCount,
}) => {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Mic Control */}
      <button
        onClick={onToggleMic}
        className={`
          p-3 rounded-full transition-all duration-200 
          ${
            micEnabled
              ? 'bg-slate-700 hover:bg-slate-600 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }
        `}
        title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
      >
        {micEnabled ? (
          <Mic className="w-5 h-5" />
        ) : (
          <MicOff className="w-5 h-5" />
        )}
      </button>

      {/* Camera Control */}
      <button
        onClick={onToggleCamera}
        className={`
          p-3 rounded-full transition-all duration-200 
          ${
            cameraEnabled
              ? 'bg-slate-700 hover:bg-slate-600 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }
        `}
        title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
      >
        {cameraEnabled ? (
          <Video className="w-5 h-5" />
        ) : (
          <VideoOff className="w-5 h-5" />
        )}
      </button>

      {/* Participant Count Display */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-full">
        <Users className="w-4 h-4 text-slate-300" />
        <span className="text-sm text-slate-300">{participantCount}</span>
      </div>

      {/* Screen Share (Future Feature) */}
      <button
        disabled
        className="p-3 rounded-full bg-slate-800 text-slate-500 cursor-not-allowed"
        title="Screen share (coming soon)"
      >
        <Monitor className="w-5 h-5" />
      </button>

      {/* End Call */}
      <button
        onClick={onEndCall}
        className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 transform hover:scale-105"
        title="End call"
      >
        <PhoneOff className="w-5 h-5" />
      </button>
    </div>
  );
};
