import { MessageSquare, Users, Video, PhoneCall } from 'lucide-react';

interface MapViewToolbarProps {
  isChatOpen: boolean;
  onToggleChat: () => void;
  isVideoModalOpen: boolean;
  onToggleVideoModal: () => void;
  isInCall: boolean;
  onJoinCall: () => void;
  usersOnline: number;
}

export const MapViewToolbar = ({
  isChatOpen,
  onToggleChat,
  isVideoModalOpen,
  onToggleVideoModal,
  isInCall,
  onJoinCall,
  usersOnline,
}: MapViewToolbarProps) => {
  return (
    <div className="fixed top-0 left-0 w-12 h-full bg-slate-800 border-r border-slate-700 flex flex-col items-center py-4 gap-4 z-40">
      {/* Chat Button */}
      <button
        onClick={onToggleChat}
        className={`p-2 rounded-lg transition-colors relative ${
          isChatOpen
            ? 'bg-blue-600 text-white'
            : 'hover:bg-slate-700 text-slate-300'
        }`}
        title="Chat"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {/* Join Video Call Button */}
      {!isInCall ? (
        <button
          onClick={onJoinCall}
          className="p-2 rounded-lg transition-colors relative hover:bg-slate-700 text-slate-300 hover:text-white"
          title="Join Video Call"
        >
          <PhoneCall className="w-5 h-5" />
        </button>
      ) : (
        /* Video Modal Toggle Button */
        <button
          onClick={onToggleVideoModal}
          className={`p-2 rounded-lg transition-colors relative ${
            isVideoModalOpen
              ? 'bg-green-600 text-white'
              : 'hover:bg-slate-700 text-slate-300'
          }`}
          title="Video Call"
        >
          <Video className="w-5 h-5" />
        </button>
      )}

      {/* Users Count */}
      <div className="flex flex-col items-center gap-1">
        <Users className="w-5 h-5 text-slate-400" />
        <span className="text-xs font-bold text-white">{usersOnline}</span>
      </div>

      {/* Connection Indicator */}
      <div className="mt-auto">
        <div
          className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
          title="Connected"
        ></div>
      </div>
    </div>
  );
};
