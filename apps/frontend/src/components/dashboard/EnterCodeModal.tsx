import React from 'react';

interface EnterCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  enterCode: string;
  setEnterCode: (code: string) => void;
}

export const EnterCodeModal: React.FC<EnterCodeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  enterCode,
  setEnterCode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Enter with Code
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Code
            </label>
            <input
              type="text"
              value={enterCode}
              onChange={(e) => setEnterCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 placeholder-gray-400"
              placeholder="Enter access code (e.g. ABC123)"
              maxLength={6}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={!enterCode.trim()}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              Join Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
