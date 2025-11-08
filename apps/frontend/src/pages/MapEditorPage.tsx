import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MapEditorToolbar } from '../components/map-editor/MapEditorToolbar';
import { TilesetPanel } from '../components/map-editor/TilesetPanel';
import { LayersPanel, MapLayer } from '../components/map-editor/LayersPanel';
import {
  TiledCanvasRenderer,
  TileData,
} from '../components/map-editor/TiledCanvasRenderer';
import {
  ArrowLeft,
  Settings,
  Save,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';

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

interface MapElement {
  id: number;
  elementId: number;
  x: number;
  y: number;
  layerId: string;
  element: {
    id: number;
    imageUrl: string;
    width: number;
    height: number;
    isStatic: boolean;
  };
}

interface Element {
  id: number;
  imageUrl: string;
  width: number;
  height: number;
  isStatic: boolean;
}

interface Space {
  id: number;
  name: string;
  width: number;
  height: number;
  dimensions: string;
}

interface SpaceElement {
  id: number;
  elementId: number;
  x: number;
  y: number;
  element: {
    id: number;
    imageUrl: string;
    width: number;
    height: number;
    isStatic: boolean;
  };
}

interface MapSpace {
  id: number;
  spaceId: number;
  spaceName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  elements: SpaceElement[];
}

interface MapData {
  id: number;
  name: string;
  width: number;
  height: number;
  ownerId: number;
  elements: MapElement[];
  mapSpaces: MapSpace[];
}

const CELL_SIZE = 32;

export const MapEditorPage = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [map, setMap] = useState<MapData | null>(null);
  const [availableElements, setAvailableElements] = useState<Element[]>([]);
  const [availableSpaces, setAvailableSpaces] = useState<Space[]>([]);
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [selectedTile, setSelectedTile] = useState<TilesetTile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<
    'tilesets' | 'layers' | 'elements' | 'spaces'
  >('tilesets');
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Layer management
  const [layers, setLayers] = useState<MapLayer[]>([
    {
      id: 'floor1',
      name: 'floor/floor1',
      displayName: 'Floor 1',
      isVisible: true,
      isLocked: false,
      isActive: false,
      depth: 0,
      opacity: 1,
    },
    {
      id: 'floor2',
      name: 'floor/floor2',
      displayName: 'Floor 2',
      isVisible: true,
      isLocked: false,
      isActive: false,
      depth: 0,
      opacity: 1,
    },
    {
      id: 'walls1',
      name: 'walls/walls1',
      displayName: 'Walls 1',
      isVisible: true,
      isLocked: false,
      isActive: false,
      depth: 0,
      opacity: 1,
    },
    {
      id: 'walls2',
      name: 'walls/walls2',
      displayName: 'Walls 2',
      isVisible: true,
      isLocked: false,
      isActive: false,
      depth: 0,
      opacity: 1,
    },
    {
      id: 'furniture1',
      name: 'furniture/furniture1',
      displayName: 'Furniture 1',
      isVisible: true,
      isLocked: false,
      isActive: true,
      depth: 0,
      opacity: 1,
    },
    {
      id: 'furniture2',
      name: 'furniture/furniture2',
      displayName: 'Furniture 2',
      isVisible: true,
      isLocked: false,
      isActive: false,
      depth: 0,
      opacity: 1,
    },
    {
      id: 'furniture3',
      name: 'furniture/furniture3',
      displayName: 'Furniture 3',
      isVisible: true,
      isLocked: false,
      isActive: false,
      depth: 0,
      opacity: 1,
    },
    {
      id: 'above1',
      name: 'above/above1',
      displayName: 'Above 1',
      isVisible: true,
      isLocked: false,
      isActive: false,
      depth: 1000000,
      opacity: 0.7,
    },
    {
      id: 'above2',
      name: 'above/above2',
      displayName: 'Above 2',
      isVisible: true,
      isLocked: false,
      isActive: false,
      depth: 1000000,
      opacity: 0.7,
    },
    {
      id: 'collisions',
      name: 'collisions',
      displayName: 'Collisions',
      isVisible: false,
      isLocked: false,
      isActive: false,
      depth: 0,
      opacity: 0.5,
    },
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string>('furniture1');

  useEffect(() => {
    fetchMapData();
    fetchAvailableElements();
    fetchAvailableSpaces();
  }, [mapId]);

  useEffect(() => {
    if (map) {
      drawCanvas();
    }
  }, [map, selectedElement, selectedSpace, mousePosition]);

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

  const fetchAvailableElements = async () => {
    try {
      const response = await fetch(
        'http://localhost:3000/api/v1/maps/elements',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableElements(data.elements);
      } else {
        console.error('Failed to fetch elements');
      }
    } catch (error) {
      console.error('Failed to fetch elements:', error);
    }
  };

  const fetchAvailableSpaces = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/space/all', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableSpaces(data.spaces || []);
      } else {
        console.error('Failed to fetch spaces');
      }
    } catch (error) {
      console.error('Failed to fetch spaces:', error);
    }
  };

  const handleCanvasClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!map) {
      console.log('No map loaded');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (selectedElement) {
      await handlePlaceElement(e);
    } else if (selectedSpace) {
      await handlePlaceMapSpace(e);
    }
  };

  const handlePlaceElement = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!map || !selectedElement) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const container = canvas.parentElement;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    const rawX = e.clientX - rect.left + scrollLeft;
    const rawY = e.clientY - rect.top + scrollTop;

    let x = Math.floor(rawX / CELL_SIZE);
    let y = Math.floor(rawY / CELL_SIZE);

    x = x - Math.floor(selectedElement.width / 2);
    y = y - Math.floor(selectedElement.height / 2);

    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + selectedElement.width > 32) x = 32 - selectedElement.width;
    if (y + selectedElement.height > 17) y = 17 - selectedElement.height;

    const wouldOverlap = map.elements.some((existingElement) => {
      const existingEndX = existingElement.x + existingElement.element.width;
      const existingEndY = existingElement.y + existingElement.element.height;
      const newEndX = x + selectedElement.width;
      const newEndY = y + selectedElement.height;

      return !(
        x >= existingEndX ||
        newEndX <= existingElement.x ||
        y >= existingEndY ||
        newEndY <= existingElement.y
      );
    });

    if (wouldOverlap) {
      alert('Cannot place element: would overlap with existing element');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/user/map/${mapId}/element`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            elementId: selectedElement.id.toString(),
            x,
            y,
          }),
        }
      );

      if (response.ok) {
        console.log('Element placed successfully');
        fetchMapData();
        setSelectedElement(null);
      } else {
        console.error('Failed to place element');
        const errorData = await response.text();
        alert(`Failed to place element: ${errorData}`);
      }
    } catch (error) {
      console.error('Failed to add element:', error);
      alert('Network error while placing element');
    }
  };

  const handlePlaceMapSpace = async (
    e: React.MouseEvent<HTMLCanvasElement>
  ) => {
    if (!map || !selectedSpace) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const container = canvas.parentElement;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    const rawX = e.clientX - rect.left + scrollLeft;
    const rawY = e.clientY - rect.top + scrollTop;

    let x = Math.floor(rawX / CELL_SIZE);
    let y = Math.floor(rawY / CELL_SIZE);

    const spaceWidth = selectedSpace.width;
    const spaceHeight = selectedSpace.height;

    x = x - Math.floor(spaceWidth / 2);
    y = y - Math.floor(spaceHeight / 2);

    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + spaceWidth > 32) x = 32 - spaceWidth;
    if (y + spaceHeight > 17) y = 17 - spaceHeight;

    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/user/map/${mapId}/space`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            spaceId: selectedSpace.id.toString(),
            x: x,
            y: y,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = 'Failed to place map space';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          errorMessage = `${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      fetchMapData();
      setSelectedSpace(null);
    } catch (error) {
      console.error('Error placing map space:', error);
      alert(
        `Failed to place map space: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleDeleteElement = async (elementId: number) => {
    if (!confirm('Are you sure you want to delete this element?')) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/user/map/${mapId}/element`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id: elementId.toString() }),
        }
      );

      if (response.ok) {
        console.log('Element deleted successfully');
        fetchMapData();
      } else {
        console.error('Failed to delete element');
      }
    } catch (error) {
      console.error('Failed to delete element:', error);
    }
  };

  const handleDeleteMapSpace = async (mapSpaceId: number) => {
    if (!confirm('Are you sure you want to remove this space from the map?'))
      return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/user/map/${mapId}/space`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id: mapSpaceId.toString() }),
        }
      );

      if (response.ok) {
        console.log('Space removed from map successfully');
        fetchMapData();
      } else {
        console.error('Failed to remove space from map');
      }
    } catch (error) {
      console.error('Failed to remove space from map:', error);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedElement && !selectedSpace) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const container = canvas.parentElement;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    const rawX = e.clientX - rect.left + scrollLeft;
    const rawY = e.clientY - rect.top + scrollTop;

    const gridX = Math.floor(rawX / CELL_SIZE);
    const gridY = Math.floor(rawY / CELL_SIZE);

    setMousePosition({ x: gridX, y: gridY });
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !map) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 1025, 550);

    // Draw grid (32 tiles wide x 17 tiles tall)
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 32; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, 17 * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= 17; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(32 * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // Draw existing elements
    map.elements.forEach((element) => {
      const elemX = element.x * CELL_SIZE;
      const elemY = element.y * CELL_SIZE;
      const elemWidth = element.element.width * CELL_SIZE;
      const elemHeight = element.element.height * CELL_SIZE;

      ctx.fillStyle = '#fca5a5';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;

      const cornerRadius = 8;
      ctx.beginPath();
      ctx.roundRect(elemX, elemY, elemWidth, elemHeight, cornerRadius);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#7f1d1d';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const centerX = elemX + elemWidth / 2;
      const centerY = elemY + elemHeight / 2;

      ctx.fillText(`E${element.element.id}`, centerX, centerY);
    });

    // Draw existing map spaces
    map.mapSpaces?.forEach((mapSpace) => {
      const spaceX = mapSpace.x * CELL_SIZE;
      const spaceY = mapSpace.y * CELL_SIZE;
      const spaceWidth = mapSpace.width * CELL_SIZE;
      const spaceHeight = mapSpace.height * CELL_SIZE;

      ctx.fillStyle = '#86efac';
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 2;

      const cornerRadius = 8;
      ctx.beginPath();
      ctx.roundRect(spaceX, spaceY, spaceWidth, spaceHeight, cornerRadius);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#15803d';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const centerX = spaceX + spaceWidth / 2;
      const centerY = spaceY + spaceHeight / 2;

      ctx.fillText(
        mapSpace.spaceName.length > 8
          ? mapSpace.spaceName.slice(0, 8) + '...'
          : mapSpace.spaceName,
        centerX,
        centerY
      );
    });

    // Draw space elements
    map.mapSpaces?.forEach((mapSpace) => {
      mapSpace.elements?.forEach((spaceElement) => {
        const elemX = (mapSpace.x + spaceElement.x) * CELL_SIZE;
        const elemY = (mapSpace.y + spaceElement.y) * CELL_SIZE;
        const elemWidth = spaceElement.element.width * CELL_SIZE;
        const elemHeight = spaceElement.element.height * CELL_SIZE;

        ctx.fillStyle = '#93c5fd';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;

        const cornerRadius = 8;
        ctx.beginPath();
        ctx.roundRect(elemX, elemY, elemWidth, elemHeight, cornerRadius);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1e40af';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const centerX = elemX + elemWidth / 2;
        const centerY = elemY + elemHeight / 2;

        ctx.fillText(`SE${spaceElement.element.id}`, centerX, centerY);
      });
    });

    // Draw preview
    if ((selectedElement || selectedSpace) && mousePosition) {
      let previewWidth, previewHeight, previewColor, previewText;

      if (selectedElement) {
        previewWidth = selectedElement.width;
        previewHeight = selectedElement.height;
        previewColor = 'rgba(252, 165, 165, 0.6)';
        previewText = `E${selectedElement.id}`;
      } else if (selectedSpace) {
        previewWidth = selectedSpace.width;
        previewHeight = selectedSpace.height;
        previewColor = 'rgba(134, 239, 172, 0.6)';
        previewText = 'Space';
      } else {
        return;
      }

      const previewX =
        (mousePosition.x - Math.floor(previewWidth / 2)) * CELL_SIZE;
      const previewY =
        (mousePosition.y - Math.floor(previewHeight / 2)) * CELL_SIZE;
      const previewPixelWidth = previewWidth * CELL_SIZE;
      const previewPixelHeight = previewHeight * CELL_SIZE;

      ctx.fillStyle = previewColor;
      ctx.strokeStyle = selectedSpace ? '#3b82f6' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      ctx.beginPath();
      ctx.roundRect(
        previewX,
        previewY,
        previewPixelWidth,
        previewPixelHeight,
        8
      );
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = selectedSpace ? '#1e40af' : '#7f1d1d';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        previewText,
        previewX + previewPixelWidth / 2,
        previewY + previewPixelHeight / 2
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!map) {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Map Not Found</h1>
            <p className="mb-4">
              The requested map could not be loaded or you don't have permission
              to edit it.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-400 hover:text-blue-300"
            >
              <ArrowLeft className="inline mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Fixed Toolbar - always visible */}
      <MapEditorToolbar
        selectedTool={selectedTool}
        onToolSelect={(tool) => {
          setSelectedTool(tool);
          // Handle special tool actions
          if (tool === 'grid') {
            setShowGrid(!showGrid);
          }
          // TODO: Add other tool handlers (undo, redo, etc.)
        }}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Tiled-style Sidebar */}
      {isSidebarOpen && (
        <div className="fixed left-12 top-0 h-full w-80 bg-white border-r border-gray-200 flex flex-col shadow-lg z-40">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 'tilesets', label: 'Tilesets', icon: '🎨' },
                { id: 'layers', label: 'Layers', icon: '📋' },
                { id: 'elements', label: 'Elements', icon: '🪑' },
                { id: 'spaces', label: 'Spaces', icon: '🏢' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'tilesets' && (
              <TilesetPanel
                selectedTile={selectedTile}
                onTileSelect={setSelectedTile}
              />
            )}

            {activeTab === 'layers' && (
              <LayersPanel
                layers={layers}
                activeLayerId={activeLayerId}
                onLayerSelect={setActiveLayerId}
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
            )}

            {activeTab === 'elements' && (
              <div className="p-4">
                <h3 className="font-medium mb-3">Legacy Elements</h3>
                <p className="text-sm text-gray-500">
                  Use Tilesets tab for the new Tiled-style workflow
                </p>
              </div>
            )}

            {activeTab === 'spaces' && (
              <div className="p-4">
                <h3 className="font-medium mb-3">Spaces</h3>
                <p className="text-sm text-gray-500">
                  Space management coming soon
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content area with proper margins */}
      <div
        className="transition-all duration-300"
        style={{
          marginLeft: isSidebarOpen ? '368px' : '48px', // 320px sidebar + 48px toolbar OR just 48px toolbar
        }}
      >
        <div className="w-full h-full p-4">
          {/* Header removed per request */}

          {/* Canvas Area */}
          {/* Canvas Container */}
          <div className="w-full h-full border border-slate-600 rounded-lg bg-slate-900 overflow-auto">
            <canvas
              ref={canvasRef}
              width={1025}
              height={550}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              className="block cursor-crosshair w-full h-full"
              style={{
                imageRendering: 'pixelated',
                cursor:
                  selectedElement || selectedSpace ? 'crosshair' : 'default',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
