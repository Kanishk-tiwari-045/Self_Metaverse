import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MapEditorToolbar } from '../components/map-editor/MapEditorToolbar';
import { TilesetPanel } from '../components/map-editor/TilesetPanel';
import { LayersPanel, MapLayer } from '../components/map-editor/LayersPanel';
import { TiledCanvasRenderer } from '../components/map-editor/TiledCanvasRenderer';
import {
  ArrowLeft,
  Save,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface MapData {
  id: number;
  name: string;
  width: number;
  height: number;
  ownerId: number;
}

interface TilesetTile {
  id: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tilesetName: string;
  tileId: number;
}

// const CELL_SIZE = 32; // TODO: Use for grid calculations

export const MapEditorPage = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRendererRef = useRef<TiledCanvasRenderer | null>(null);

  const [map, setMap] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [isTilesetPanelOpen, setIsTilesetPanelOpen] = useState(true);
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(true);
  const [selectedTile, setSelectedTile] = useState<TilesetTile | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  // Initialize layers with proper Tiled structure
  const [layers, setLayers] = useState<MapLayer[]>([
    {
      id: 'floor1',
      name: 'floor/floor1',
      displayName: 'Floor Layer 1',
      isVisible: true,
      isLocked: false,
      isActive: false,
      depth: 0,
      opacity: 1,
    },
    {
      id: 'floor2',
      name: 'floor/floor2',
      displayName: 'Floor Layer 2',
      isVisible: true,
      isLocked: false,
      isActive: false,
      depth: 1,
      opacity: 1,
    },
    {
      id: 'walls1',
      name: 'walls/walls1',
      displayName: 'Walls Layer 1',
      isVisible: true,
      isLocked: false,
      isActive: false,
      depth: 2,
      opacity: 1,
    },
    {
      id: 'furniture1',
      name: 'furniture/furniture1',
      displayName: 'Furniture Layer 1',
      isVisible: true,
      isLocked: false,
      isActive: true,
      depth: 4,
      opacity: 1,
    },
    {
      id: 'furniture2',
      name: 'furniture/furniture2',
      displayName: 'Furniture Layer 2',
      isVisible: true,
      isLocked: false,
      isActive: false,
      depth: 5,
      opacity: 1,
    },
    {
      id: 'above1',
      name: 'above/above1',
      displayName: 'Above Layer 1',
      isVisible: true,
      isLocked: false,
      isActive: false,
      depth: 7,
      opacity: 0.7,
    },
  ]);

  const [activeLayerId, setActiveLayerId] = useState<string>('furniture1');

  useEffect(() => {
    fetchMapData();
  }, [mapId]);

  useEffect(() => {
    // Initialize canvas renderer
    if (canvasRef.current && !canvasRendererRef.current) {
      canvasRendererRef.current = new TiledCanvasRenderer(canvasRef.current);
      canvasRendererRef.current.updateState({
        layers,
        showGrid,
      });
    }
  }, []);

  useEffect(() => {
    // Update canvas renderer when layers change
    if (canvasRendererRef.current) {
      canvasRendererRef.current.updateState({
        layers,
        showGrid,
      });
    }
  }, [layers, showGrid]);

  const fetchMapData = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/maps/map/${mapId}/edit`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMap(data);
        setIsLoading(false);
      } else {
        console.error('Failed to fetch map:', response.status);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch map:', error);
      setIsLoading(false);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Handle tile placement based on selected tool and tile
    if (selectedTile && canvasRendererRef.current) {
      console.log(
        'Placing tile:',
        selectedTile,
        'at position:',
        e.clientX,
        e.clientY
      );
      // TODO: Implement tile placement logic
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Handle hover preview
    // TODO: Show tile preview at mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    console.log('Mouse move:', x, y);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map editor...</p>
        </div>
      </div>
    );
  }

  if (!map) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load map</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Left Toolbar */}
      <MapEditorToolbar
        selectedTool={selectedTool}
        onToolSelect={(tool) => {
          if (tool === 'grid') {
            setShowGrid((prev) => !prev);
            canvasRendererRef.current?.setShowGrid(!showGrid);
          } else {
            setSelectedTool(tool);
            canvasRendererRef.current?.setTool(tool);
          }
        }}
        isSidebarOpen={isTilesetPanelOpen}
        onToggleSidebar={() => setIsTilesetPanelOpen(!isTilesetPanelOpen)}
      />

      {/* Left Panel - Tilesets */}
      <div
        className={`transition-all duration-300 bg-white border-r border-gray-200 shadow-lg ${
          isTilesetPanelOpen ? 'w-80' : 'w-0 overflow-hidden'
        }`}
      >
        {isTilesetPanelOpen && (
          <>
            <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center px-3">
              <span className="text-xs font-medium text-gray-600">
                🎨 Tilesets
              </span>
            </div>
            <div className="h-[calc(100vh-2rem)]">
              <TilesetPanel
                selectedTile={selectedTile}
                onTileSelect={setSelectedTile}
              />
            </div>
          </>
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Menu Bar */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>

            <div className="h-6 w-px bg-gray-200" />

            <div className="text-sm">
              <span className="text-gray-500">Editing:</span>
              <span className="font-medium text-gray-900 ml-1">
                {map?.name || 'Untitled Map'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <button
              className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
              title="Zoom In"
              onClick={() => {
                // TODO: Implement zoom functionality
              }}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
              title="Zoom Out"
              onClick={() => {
                // TODO: Implement zoom functionality
              }}
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <div className="h-6 w-px bg-gray-200 mx-1" />

            {/* File Operations */}
            <button
              className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
              title="Save Map"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
              title="Export Map"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
              title="Import Map"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas and Right Panel Container */}
        <div className="flex-1 flex">
          {/* Canvas Area */}
          <div className="flex-1 bg-gray-100 p-4">
            <div className="w-full h-full bg-white border border-gray-300 rounded-lg shadow-inner overflow-hidden">
              <canvas
                ref={canvasRef}
                width={1200}
                height={800}
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMove}
                className="block w-full h-full"
                style={{
                  imageRendering: 'pixelated',
                  cursor: selectedTile ? 'crosshair' : 'default',
                }}
              />
            </div>

            {/* Status Bar */}
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>Tool: {selectedTool}</span>
                {selectedTile && (
                  <span>
                    Selected: {selectedTile.tilesetName} - {selectedTile.tileId}
                  </span>
                )}
                <span>
                  Layer: {layers.find((l) => l.isActive)?.displayName}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span>Grid: {showGrid ? 'On' : 'Off'}</span>
                <span>
                  Size: {map?.width}×{map?.height}
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel - Layers */}
          <div
            className={`transition-all duration-300 bg-white border-l border-gray-200 shadow-lg ${
              isLayersPanelOpen ? 'w-80' : 'w-0 overflow-hidden'
            }`}
          >
            {isLayersPanelOpen && (
              <>
                <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center justify-between px-3">
                  <span className="text-xs font-medium text-gray-600">
                    📋 Layers
                  </span>
                  <button
                    onClick={() => setIsLayersPanelOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <div className="h-[calc(100vh-5rem)]">
                  <LayersPanel
                    layers={layers}
                    activeLayerId={activeLayerId}
                    onLayerSelect={(layerId) => {
                      setActiveLayerId(layerId);
                      setLayers((prev) =>
                        prev.map((layer) => ({
                          ...layer,
                          isActive: layer.id === layerId,
                        }))
                      );
                    }}
                    onLayerToggleVisibility={(layerId) => {
                      setLayers((prev) =>
                        prev.map((layer) =>
                          layer.id === layerId
                            ? { ...layer, isVisible: !layer.isVisible }
                            : layer
                        )
                      );
                    }}
                    onLayerToggleLock={(layerId) => {
                      setLayers((prev) =>
                        prev.map((layer) =>
                          layer.id === layerId
                            ? { ...layer, isLocked: !layer.isLocked }
                            : layer
                        )
                      );
                    }}
                    onLayerOpacityChange={(layerId, opacity) => {
                      setLayers((prev) =>
                        prev.map((layer) =>
                          layer.id === layerId ? { ...layer, opacity } : layer
                        )
                      );
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Floating Layers Toggle (when panel is closed) */}
        {!isLayersPanelOpen && (
          <button
            onClick={() => setIsLayersPanelOpen(true)}
            className="fixed right-4 top-20 bg-white border border-gray-200 rounded-lg shadow-lg p-2 hover:bg-gray-50 z-10"
            title="Show Layers Panel"
          >
            <span className="text-sm">📋</span>
          </button>
        )}
      </div>
    </div>
  );
};
