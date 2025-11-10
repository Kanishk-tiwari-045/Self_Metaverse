import React from 'react';
import { UserPlus, Clock } from 'lucide-react';
import { JoinRequest } from '../../services/WorkAdventureVideoService';

interface JoinRequestModalProps {
  isOpen: boolean;
  request: JoinRequest | null;
  onAccept: () => void;
  onDecline: () => void;
}

export const JoinRequestModal: React.FC<JoinRequestModalProps> = ({
  isOpen,
  request,
  onAccept,
  onDecline,
}) => {
  if (!isOpen || !request) return null;

  const timeAgo = Math.floor((Date.now() - request.timestamp) / 1000);
  const timeText =
    timeAgo < 60 ? 'just now' : `${Math.floor(timeAgo / 60)}m ago`;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Modal */}
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-2xl max-w-sm animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-lg">
            <UserPlus className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white">Join Request</h4>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{timeText}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-sm text-slate-300">
            <span className="font-medium text-white">
              {request.displayName}
            </span>{' '}
            wants to join this video call.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onDecline}
            className="flex-1 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors text-sm"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};
