import React from 'react';

interface CreateMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newMap: {
    name: string;
    width: number;
    height: number;
  };
  setNewMap: React.Dispatch<
    React.SetStateAction<{
      name: string;
      width: number;
      height: number;
    }>
  >;
  selectedTemplate: number | null;
  isCreatingMap: boolean;
  userRole?: string;
}

export const CreateMapModal: React.FC<CreateMapModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  newMap,
  setNewMap,
  selectedTemplate,
  isCreatingMap,
  userRole,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {selectedTemplate ? 'Create Map from Template' : 'Create New Map'}
        </h3>
        <form onSubmit={onSubmit} className="space-y-4">
          {selectedTemplate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                Creating from template #{selectedTemplate}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Map Name
            </label>
            <input
              type="text"
              value={newMap.name}
              onChange={(e) => setNewMap({ ...newMap, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 placeholder-gray-400"
              placeholder="My Awesome Map"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                value={newMap.width}
                onChange={(e) =>
                  setNewMap({
                    ...newMap,
                    width: parseInt(e.target.value) || 100,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 placeholder-gray-400"
                placeholder="100"
                required
                style={{
                  colorScheme: 'light',
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                value={newMap.height}
                onChange={(e) =>
                  setNewMap({
                    ...newMap,
                    height: parseInt(e.target.value) || 100,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 placeholder-gray-400"
                placeholder="100"
                required
                style={{
                  colorScheme: 'light',
                }}
              />
            </div>
          </div>
          {/* Template checkbox for admins only */}
          {userRole === 'admin' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isTemplate"
                id="isTemplate"
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="isTemplate" className="text-sm text-gray-700">
                Make this map available as a template for other users
              </label>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingMap}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isCreatingMap ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
