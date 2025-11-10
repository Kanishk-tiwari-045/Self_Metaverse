import React from 'react';
import { Mic, Video, Shield } from 'lucide-react';

interface PermissionRequestModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const PermissionRequestModal: React.FC<PermissionRequestModalProps> = ({
  isOpen,
  onAccept,
  onDecline,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-lg">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Permission Required
            </h3>
            <p className="text-sm text-slate-400">
              Enable camera and microphone for video calls
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-slate-300 mb-4">
            To join video calls in this room, we need access to your camera and
            microphone. This allows you to communicate with other participants.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
              <Mic className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-sm font-medium text-white">Microphone</div>
                <div className="text-xs text-slate-400">
                  Required for voice communication
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
              <Video className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-sm font-medium text-white">Camera</div>
                <div className="text-xs text-slate-400">
                  Required for video communication
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
          >
            Not now
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Allow access
          </button>
        </div>
      </div>
    </div>
  );
};
