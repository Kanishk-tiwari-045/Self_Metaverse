import React, { useRef, useEffect, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Maximize2,
} from 'lucide-react';

interface FloatingVideoCardProps {
  isVisible: boolean;
  localStream: MediaStream | null;
  displayName: string;
  micEnabled: boolean;
  cameraEnabled: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
  onExpand: () => void;
}

export const FloatingVideoCard: React.FC<FloatingVideoCardProps> = ({
  isVisible,
  localStream,
  displayName,
  micEnabled,
  cameraEnabled,
  onToggleMic,
  onToggleCamera,
  onEndCall,
  onExpand,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 }); // Top-right by default
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Set up video stream
  useEffect(() => {
    if (videoRef.current && localStream && cameraEnabled) {
      videoRef.current.srcObject = localStream;
      videoRef.current.muted = true; // Always mute local video to prevent echo
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [localStream, cameraEnabled]);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Keep within screen bounds
      const maxX = window.innerWidth - 200; // Card width
      const maxY = window.innerHeight - 150; // Card height

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Auto-position in top-right when first shown
  useEffect(() => {
    if (isVisible) {
      setPosition({
        x: window.innerWidth - 220, // 200px width + 20px margin
        y: 20,
      });
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      ref={cardRef}
      className={`
        fixed z-50 w-[200px] h-[150px] bg-slate-900/95 backdrop-blur-md border border-slate-700/50 
        rounded-lg overflow-hidden shadow-2xl transition-transform duration-200
        ${isDragging ? 'scale-105 cursor-grabbing' : 'cursor-grab hover:scale-102'}
      `}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Video Container */}
      <div className="relative w-full h-full">
        {cameraEnabled ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-sm font-semibold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <VideoOff className="w-4 h-4 text-slate-400 mx-auto" />
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-200 group">
          {/* Top Bar - Name and Expand */}
          <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white font-medium truncate">
                {displayName} (You)
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExpand();
                }}
                className="p-1 text-white hover:bg-white/20 rounded transition-colors"
                title="Expand to full view"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-center gap-1">
              {/* Mic Control */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMic();
                }}
                className={`
                  p-1.5 rounded transition-all duration-200 text-xs
                  ${
                    micEnabled
                      ? 'bg-slate-700/80 hover:bg-slate-600 text-white'
                      : 'bg-red-500/80 hover:bg-red-600 text-white'
                  }
                `}
                title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
              >
                {micEnabled ? (
                  <Mic className="w-3 h-3" />
                ) : (
                  <MicOff className="w-3 h-3" />
                )}
              </button>

              {/* Camera Control */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCamera();
                }}
                className={`
                  p-1.5 rounded transition-all duration-200 text-xs
                  ${
                    cameraEnabled
                      ? 'bg-slate-700/80 hover:bg-slate-600 text-white'
                      : 'bg-red-500/80 hover:bg-red-600 text-white'
                  }
                `}
                title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {cameraEnabled ? (
                  <Video className="w-3 h-3" />
                ) : (
                  <VideoOff className="w-3 h-3" />
                )}
              </button>

              {/* End Call */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEndCall();
                }}
                className="p-1.5 rounded bg-red-500/80 hover:bg-red-600 text-white transition-all duration-200"
                title="End call"
              >
                <PhoneOff className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Connection Indicator */}
        <div className="absolute top-2 right-2">
          <div
            className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
            title="Connected"
          />
        </div>
      </div>
    </div>
  );
};
