import { useState } from 'react';
import { Settings, ChevronUp, ChevronDown } from 'lucide-react';

interface PlacedElement {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl: string;
  type: 'machine' | 'furniture' | 'decoration';
  properties: Record<string, any>;
}

interface TiledPropertiesProps {
  selectedElement: PlacedElement | null;
  onElementUpdate: (elementId: string, updates: Partial<PlacedElement>) => void;
  height: number;
  onHeightChange: (height: number) => void;
}

export const TiledProperties: React.FC<TiledPropertiesProps> = ({
  selectedElement,
  onElementUpdate,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Handle property updates
  const handlePropertyChange = (key: string, value: any) => {
    if (!selectedElement) return;

    const newProperties = { ...selectedElement.properties, [key]: value };
    onElementUpdate(selectedElement.id, { properties: newProperties });
  };

  const handleBasicPropertyChange = (key: keyof PlacedElement, value: any) => {
    if (!selectedElement) return;
    onElementUpdate(selectedElement.id, { [key]: value });
  };

  // Add new custom property
  const [newPropertyKey, setNewPropertyKey] = useState('');
  const [newPropertyValue, setNewPropertyValue] = useState('');
  const [showAddProperty, setShowAddProperty] = useState(false);

  const handleAddProperty = () => {
    if (!newPropertyKey.trim() || !selectedElement) return;

    handlePropertyChange(newPropertyKey.trim(), newPropertyValue);
    setNewPropertyKey('');
    setNewPropertyValue('');
    setShowAddProperty(false);
  };

  const handleDeleteProperty = (key: string) => {
    if (!selectedElement) return;

    const newProperties = { ...selectedElement.properties };
    delete newProperties[key];
    onElementUpdate(selectedElement.id, { properties: newProperties });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Resize Handle */}
      <div className="h-1 bg-gray-700 hover:bg-gray-600 cursor-row-resize flex-shrink-0" />

      {/* Header */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between bg-gray-800">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-white">Properties</h3>
          {selectedElement && (
            <span className="text-xs text-gray-400">
              • {selectedElement.name}
            </span>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-3">
          {selectedElement ? (
            <div className="space-y-4">
              {/* Basic Properties */}
              <div>
                <h4 className="text-sm font-medium text-white mb-3">
                  Basic Properties
                </h4>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {/* Name */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={selectedElement.name}
                      onChange={(e) =>
                        handleBasicPropertyChange('name', e.target.value)
                      }
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Type
                    </label>
                    <select
                      value={selectedElement.type}
                      onChange={(e) =>
                        handleBasicPropertyChange('type', e.target.value)
                      }
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="machine">Machine</option>
                      <option value="furniture">Furniture</option>
                      <option value="decoration">Decoration</option>
                    </select>
                  </div>

                  {/* Position X */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      X Position
                    </label>
                    <input
                      type="number"
                      value={selectedElement.x}
                      onChange={(e) =>
                        handleBasicPropertyChange(
                          'x',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Position Y */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Y Position
                    </label>
                    <input
                      type="number"
                      value={selectedElement.y}
                      onChange={(e) =>
                        handleBasicPropertyChange(
                          'y',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Width */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Width
                    </label>
                    <input
                      type="number"
                      value={selectedElement.width}
                      onChange={(e) =>
                        handleBasicPropertyChange(
                          'width',
                          parseInt(e.target.value) || 1
                        )
                      }
                      min="1"
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Height */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Height
                    </label>
                    <input
                      type="number"
                      value={selectedElement.height}
                      onChange={(e) =>
                        handleBasicPropertyChange(
                          'height',
                          parseInt(e.target.value) || 1
                        )
                      }
                      min="1"
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Properties */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-white">
                    Custom Properties
                  </h4>
                  <button
                    onClick={() => setShowAddProperty(true)}
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded text-xs transition-colors"
                  >
                    Add Property
                  </button>
                </div>

                {/* Add Property Form */}
                {showAddProperty && (
                  <div className="mb-3 p-2 bg-gray-800 rounded border border-gray-600">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        value={newPropertyKey}
                        onChange={(e) => setNewPropertyKey(e.target.value)}
                        placeholder="Property name"
                        className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={newPropertyValue}
                        onChange={(e) => setNewPropertyValue(e.target.value)}
                        placeholder="Value"
                        className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={handleAddProperty}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setShowAddProperty(false)}
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Properties List */}
                <div className="space-y-2">
                  {Object.entries(selectedElement.properties || {}).map(
                    ([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={key}
                            readOnly
                            className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300"
                          />
                          <input
                            type="text"
                            value={value as string}
                            onChange={(e) =>
                              handlePropertyChange(key, e.target.value)
                            }
                            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <button
                          onClick={() => handleDeleteProperty(key)}
                          className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors"
                          title="Delete Property"
                        >
                          ×
                        </button>
                      </div>
                    )
                  )}

                  {Object.keys(selectedElement.properties || {}).length ===
                    0 && (
                    <div className="text-center text-gray-500 text-xs py-4">
                      No custom properties
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 text-sm py-8">
              Select an element to view its properties
            </div>
          )}
        </div>
      )}
    </div>
  );
};
