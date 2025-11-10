import React from 'react';
import { UserX, AlertTriangle } from 'lucide-react';

interface KickConfirmationModalProps {
  isOpen: boolean;
  participantName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const KickConfirmationModal: React.FC<KickConfirmationModalProps> = ({
  isOpen,
  participantName,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-red-500/30 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Remove Participant
            </h3>
            <p className="text-sm text-slate-400">
              This action cannot be undone
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-slate-300">
            Are you sure you want to remove{' '}
            <span className="font-semibold text-white">{participantName}</span>{' '}
            from this video call?
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
          >
            No, cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            <UserX className="w-4 h-4" />
            Yes, remove
          </button>
        </div>
      </div>
    </div>
  );
};
