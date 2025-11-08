import React from 'react';
import { Eye, EyeOff, Plus, Lock, Unlock } from 'lucide-react';

export interface MapLayer {
  id: string;
  name: string;
  displayName: string;
  isVisible: boolean;
  isLocked: boolean;
  isActive: boolean;
  depth: number;
  opacity: number;
}

interface LayersPanelProps {
  layers: MapLayer[];
  activeLayerId: string;
  onLayerSelect: (layerId: string) => void;
  onLayerToggleVisibility: (layerId: string) => void;
  onLayerToggleLock: (layerId: string) => void;
  onLayerOpacityChange: (layerId: string, opacity: number) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onLayerSelect,
  onLayerToggleVisibility,
  onLayerToggleLock,
  onLayerOpacityChange,
}) => {
  // Sort layers by depth (higher depth renders on top)
  const sortedLayers = [...layers].sort((a, b) => b.depth - a.depth);

  const getLayerIcon = (layerName: string) => {
    if (layerName.includes('floor')) return '🏢';
    if (layerName.includes('walls')) return '🧱';
    if (layerName.includes('furniture')) return '🪑';
    if (layerName.includes('above')) return '☁️';
    if (layerName.includes('collision')) return '🚫';
    return '📋';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Layers</h3>
          <button className="p-1 hover:bg-gray-100 rounded" title="Add Layer">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Manage map layers and visibility
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedLayers.map((layer) => {
          const isActive = layer.id === activeLayerId;

          return (
            <div
              key={layer.id}
              className={`
                border-b border-gray-100 transition-colors
                ${isActive ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}
              `}
            >
              <div
                className="p-3 cursor-pointer"
                onClick={() => onLayerSelect(layer.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm">{getLayerIcon(layer.name)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {layer.displayName}
                      </div>
                      <div className="text-xs text-gray-500">
                        Depth: {layer.depth}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Lock Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLayerToggleLock(layer.id);
                      }}
                      className={`
                        p-1 rounded transition-colors
                        ${
                          layer.isLocked
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }
                      `}
                      title={layer.isLocked ? 'Unlock Layer' : 'Lock Layer'}
                    >
                      {layer.isLocked ? (
                        <Lock className="w-3 h-3" />
                      ) : (
                        <Unlock className="w-3 h-3" />
                      )}
                    </button>

                    {/* Visibility Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLayerToggleVisibility(layer.id);
                      }}
                      className={`
                        p-1 rounded transition-colors
                        ${
                          layer.isVisible
                            ? 'text-blue-600 hover:bg-blue-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }
                      `}
                      title={layer.isVisible ? 'Hide Layer' : 'Show Layer'}
                    >
                      {layer.isVisible ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Opacity Slider */}
                {layer.isVisible && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-12">
                        Opacity:
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={layer.opacity}
                        onChange={(e) =>
                          onLayerOpacityChange(
                            layer.id,
                            parseFloat(e.target.value)
                          )
                        }
                        className="flex-1 h-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-xs text-gray-500 w-8">
                        {Math.round(layer.opacity * 100)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Active Layer Indicator */}
                {isActive && (
                  <div className="mt-2 text-xs text-blue-600 font-medium">
                    ✓ Active Layer
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Layer Management Footer */}
      <div className="border-t border-gray-200 p-2">
        <div className="text-xs text-gray-500 space-y-1">
          <div>• Click to select active layer</div>
          <div>• Use 👁️ to toggle visibility</div>
          <div>• Use 🔒 to lock/unlock editing</div>
        </div>
      </div>
    </div>
  );
};
