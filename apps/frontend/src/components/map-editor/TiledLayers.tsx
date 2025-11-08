import { useState, useEffect } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

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

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  elements: PlacedElement[];
}

interface TiledLayersProps {
  layers: Layer[];
  activeLayerId: string;
  onLayersChange: (layers: Layer[]) => void;
  onActiveLayerChange: (layerId: string) => void;
  width: number;
  onWidthChange: (width: number) => void;
}

export const TiledLayers: React.FC<TiledLayersProps> = ({
  layers,
  activeLayerId,
  onLayersChange,
  onActiveLayerChange,
  onWidthChange,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [newLayerName, setNewLayerName] = useState('');
  const [showAddLayer, setShowAddLayer] = useState(false);

  // Handle resize
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 200 && newWidth <= 400) {
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  const handleLayerToggleVisible = (layerId: string) => {
    onLayersChange(
      layers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };

  const handleLayerToggleLocked = (layerId: string) => {
    onLayersChange(
      layers.map((layer) =>
        layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
      )
    );
  };

  const handleLayerOpacityChange = (layerId: string, opacity: number) => {
    onLayersChange(
      layers.map((layer) =>
        layer.id === layerId ? { ...layer, opacity } : layer
      )
    );
  };

  const handleLayerMove = (layerId: string, direction: 'up' | 'down') => {
    const currentIndex = layers.findIndex((layer) => layer.id === layerId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= layers.length) return;

    const newLayers = [...layers];
    [newLayers[currentIndex], newLayers[newIndex]] = [
      newLayers[newIndex],
      newLayers[currentIndex],
    ];
    onLayersChange(newLayers);
  };

  const handleAddLayer = () => {
    if (!newLayerName.trim()) return;

    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: newLayerName.trim(),
      visible: true,
      locked: false,
      opacity: 1,
      elements: [],
    };

    onLayersChange([...layers, newLayer]);
    setNewLayerName('');
    setShowAddLayer(false);
  };

  const handleDeleteLayer = (layerId: string) => {
    if (layers.length <= 1) return; // Keep at least one layer

    const layerToDelete = layers.find((layer) => layer.id === layerId);
    if (!layerToDelete) return;

    if (layerToDelete.elements.length > 0) {
      if (
        !confirm(`Delete layer "${layerToDelete.name}" and all its elements?`)
      ) {
        return;
      }
    }

    const newLayers = layers.filter((layer) => layer.id !== layerId);
    onLayersChange(newLayers);

    // Set new active layer if deleted layer was active
    if (activeLayerId === layerId && newLayers.length > 0) {
      onActiveLayerChange(newLayers[0].id);
    }
  };

  const handleLayerRename = (layerId: string, newName: string) => {
    onLayersChange(
      layers.map((layer) =>
        layer.id === layerId ? { ...layer, name: newName } : layer
      )
    );
  };

  return (
    <div className="h-full flex relative">
      {/* Resize Handle */}
      <div
        className="w-1 bg-gray-700 hover:bg-gray-600 cursor-col-resize flex-shrink-0"
        onMouseDown={handleMouseDown}
      />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Layers</h3>
            </div>

            <button
              onClick={() => setShowAddLayer(true)}
              className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Add Layer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add Layer Form */}
          {showAddLayer && (
            <div className="mb-3 p-2 bg-gray-800 rounded border border-gray-600">
              <input
                type="text"
                value={newLayerName}
                onChange={(e) => setNewLayerName(e.target.value)}
                placeholder="Layer name"
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddLayer();
                  if (e.key === 'Escape') setShowAddLayer(false);
                }}
                autoFocus
              />
              <div className="flex gap-1 mt-2">
                <button
                  onClick={handleAddLayer}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddLayer(false)}
                  className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Layers List */}
        <div className="flex-1 overflow-y-auto">
          {layers.map((layer, index) => (
            <div
              key={layer.id}
              className={`border-b border-gray-700 ${
                layer.id === activeLayerId
                  ? 'bg-blue-900/30'
                  : 'hover:bg-gray-800/50'
              } transition-colors`}
            >
              <div
                className="p-3 cursor-pointer"
                onClick={() => onActiveLayerChange(layer.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={layer.name}
                      onChange={(e) =>
                        handleLayerRename(layer.id, e.target.value)
                      }
                      className="w-full bg-transparent text-sm text-white font-medium focus:outline-none focus:bg-gray-800 px-1 py-0.5 rounded"
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {layer.elements.length} elements
                    </p>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    {/* Layer Move Buttons */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLayerMove(layer.id, 'up');
                      }}
                      disabled={index === layers.length - 1}
                      className={`p-1 rounded transition-colors ${
                        index === layers.length - 1
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                      title="Move Up"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLayerMove(layer.id, 'down');
                      }}
                      disabled={index === 0}
                      className={`p-1 rounded transition-colors ${
                        index === 0
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                      title="Move Down"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {/* Visibility Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLayerToggleVisible(layer.id);
                      }}
                      className={`p-1 rounded transition-colors ${
                        layer.visible
                          ? 'text-blue-400 hover:bg-blue-900/30'
                          : 'text-gray-500 hover:text-gray-400 hover:bg-gray-700'
                      }`}
                      title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                    >
                      {layer.visible ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3" />
                      )}
                    </button>

                    {/* Lock Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLayerToggleLocked(layer.id);
                      }}
                      className={`p-1 rounded transition-colors ${
                        layer.locked
                          ? 'text-red-400 hover:bg-red-900/30'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                      title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                    >
                      {layer.locked ? (
                        <Lock className="w-3 h-3" />
                      ) : (
                        <Unlock className="w-3 h-3" />
                      )}
                    </button>

                    {/* Delete Layer */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLayer(layer.id);
                      }}
                      disabled={layers.length <= 1}
                      className={`p-1 rounded transition-colors ${
                        layers.length <= 1
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-gray-400 hover:text-red-400 hover:bg-red-900/30'
                      }`}
                      title="Delete Layer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Opacity Slider */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400 min-w-[3rem]">Opacity:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={layer.opacity}
                    onChange={(e) =>
                      handleLayerOpacityChange(
                        layer.id,
                        parseFloat(e.target.value)
                      )
                    }
                    className="flex-1 h-1 bg-gray-700 rounded appearance-none slider"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-gray-300 min-w-[2rem]">
                    {Math.round(layer.opacity * 100)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700 text-xs text-gray-400">
          {layers.length} layers • Active:{' '}
          {layers.find((l) => l.id === activeLayerId)?.name || 'None'}
        </div>
      </div>
    </div>
  );
};
