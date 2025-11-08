import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  Save,
  Download,
  Upload,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Layers,
  Folder,
  Settings,
} from 'lucide-react';

// Import components
import { TiledSidebar } from '../components/map-editor/TiledSidebar';
import { TiledCanvas } from '../components/map-editor/TiledCanvas';
import { TiledLayers } from '../components/map-editor/TiledLayers';
import { TiledProperties } from '../components/map-editor/TiledProperties';

interface MapData {
  id: number;
  name: string;
  width: number;
  height: number;
  ownerId: number;
}

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

export const TiledMapEditor = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  // State
  const [map, setMap] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // UI State
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [layersPanelWidth, setLayersPanelWidth] = useState(250);
  const [propertiesPanelHeight, setPropertiesPanelHeight] = useState(200);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLayersPanelCollapsed, setIsLayersPanelCollapsed] = useState(false);
  const [isPropertiesPanelCollapsed, setIsPropertiesPanelCollapsed] =
    useState(false);

  // Editor State
  const [selectedTool, setSelectedTool] = useState('select');
  const [selectedElement, setSelectedElement] = useState<PlacedElement | null>(
    null
  );
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: 'background',
      name: 'Background',
      visible: true,
      locked: false,
      opacity: 1,
      elements: [],
    },
    {
      id: 'machines',
      name: 'Machines',
      visible: true,
      locked: false,
      opacity: 1,
      elements: [],
    },
    {
      id: 'furniture',
      name: 'Furniture',
      visible: true,
      locked: false,
      opacity: 1,
      elements: [],
    },
  ]);
  const [activeLayerId, setActiveLayerId] = useState('machines');
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);

  // History
  const [undoStack, setUndoStack] = useState<Layer[][]>([]);
  const [redoStack, setRedoStack] = useState<Layer[][]>([]);

  // Fetch map data
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/v1/maps/map/${mapId}`,
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
          setError('Failed to load map');
          setIsLoading(false);
        }
      } catch (err) {
        setError('Network error');
        setIsLoading(false);
      }
    };

    fetchMapData();
  }, [mapId, token]);

  // Handle actions
  const handleSave = async () => {
    try {
      console.log('Saving map with layers:', layers);
      // TODO: Implement save to backend
      alert('Map saved successfully!');
    } catch (error) {
      console.error('Failed to save map:', error);
      alert('Failed to save map');
    }
  };

  const handleExportTMX = () => {
    // TODO: Export to TMX format
    console.log('Exporting to TMX format');
  };

  const handleImportTMX = () => {
    // TODO: Import from TMX format
    console.log('Importing from TMX format');
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack((prev) => [...prev, layers]);
      setLayers(previousState);
      setUndoStack((prev) => prev.slice(0, -1));
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack((prev) => [...prev, layers]);
      setLayers(nextState);
      setRedoStack((prev) => prev.slice(0, -1));
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(5, prev * 1.2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.1, prev / 1.2));
  };

  const handleElementPlace = (element: PlacedElement) => {
    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (!activeLayer || activeLayer.locked) return;

    // Save state for undo
    setUndoStack((prev) => [...prev, layers]);
    setRedoStack([]);

    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === activeLayerId
          ? { ...layer, elements: [...layer.elements, element] }
          : layer
      )
    );
  };

  const handleElementUpdate = (
    elementId: string,
    updates: Partial<PlacedElement>
  ) => {
    setLayers((prev) =>
      prev.map((layer) => ({
        ...layer,
        elements: layer.elements.map((element) =>
          element.id === elementId ? { ...element, ...updates } : element
        ),
      }))
    );
  };

  const handleElementDelete = (elementId: string) => {
    setUndoStack((prev) => [...prev, layers]);
    setRedoStack([]);

    setLayers((prev) =>
      prev.map((layer) => ({
        ...layer,
        elements: layer.elements.filter((element) => element.id !== elementId),
      }))
    );

    if (selectedElement?.id === elementId) {
      setSelectedElement(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading Tiled Map Editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Top Menu Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="text-sm">
            <span className="font-medium text-white">
              {map?.name || 'Untitled Map'}
            </span>
            <span className="text-gray-400 ml-2">• Tiled Map Editor</span>
          </div>
        </div>

        {/* Menu Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
            title="Save Map (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
            Save
          </button>

          <div className="w-px h-5 bg-gray-600 mx-2" />

          <button
            onClick={handleExportTMX}
            className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Export to TMX"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleImportTMX}
            className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Import TMX"
          >
            <Upload className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-gray-600 mx-2" />

          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className={`p-1.5 rounded transition-colors ${
              undoStack.length > 0
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className={`p-1.5 rounded transition-colors ${
              redoStack.length > 0
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-gray-600 mx-2" />

          <button
            onClick={handleZoomOut}
            className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="px-2 py-1 text-xs text-gray-300 font-mono min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </div>

          <button
            onClick={handleZoomIn}
            className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-gray-600 mx-2" />

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded transition-colors ${
              showGrid
                ? 'text-blue-400 bg-blue-900/30'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
            title="Toggle Grid"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Assets */}
        <div
          className={`bg-gray-800 border-r border-gray-700 flex-shrink-0 transition-all duration-300 ${
            isSidebarCollapsed ? 'w-0' : ''
          }`}
          style={{ width: isSidebarCollapsed ? 0 : sidebarWidth }}
        >
          {!isSidebarCollapsed && (
            <TiledSidebar
              width={sidebarWidth}
              onWidthChange={setSidebarWidth}
              onElementSelect={(element: any) => {
                // Convert sidebar element to placed element format
                handleElementPlace({
                  id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  name: element.name,
                  x: 100,
                  y: 100,
                  width: 64,
                  height: 64,
                  imageUrl: element.imageUrl,
                  type: 'machine',
                  properties: {},
                });
              }}
              selectedTool={selectedTool}
              onToolChange={setSelectedTool}
            />
          )}
        </div>

        {/* Center - Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TiledCanvas
            mapImageUrl="/assets/maps_thumbnails/map1.png"
            layers={layers}
            activeLayerId={activeLayerId}
            selectedElement={selectedElement}
            onElementSelect={setSelectedElement}
            onElementPlace={handleElementPlace}
            onElementUpdate={handleElementUpdate}
            onElementDelete={handleElementDelete}
            zoom={zoom}
            showGrid={showGrid}
            selectedTool={selectedTool}
          />

          {/* Bottom Properties Panel */}
          {!isPropertiesPanelCollapsed && (
            <div
              className="bg-gray-800 border-t border-gray-700 flex-shrink-0"
              style={{ height: propertiesPanelHeight }}
            >
              <TiledProperties
                selectedElement={selectedElement}
                onElementUpdate={handleElementUpdate}
                height={propertiesPanelHeight}
                onHeightChange={setPropertiesPanelHeight}
              />
            </div>
          )}
        </div>

        {/* Right Sidebar - Layers & Tools */}
        <div
          className={`bg-gray-800 border-l border-gray-700 flex-shrink-0 transition-all duration-300 ${
            isLayersPanelCollapsed ? 'w-0' : ''
          }`}
          style={{ width: isLayersPanelCollapsed ? 0 : layersPanelWidth }}
        >
          {!isLayersPanelCollapsed && (
            <TiledLayers
              layers={layers}
              activeLayerId={activeLayerId}
              onLayersChange={setLayers}
              onActiveLayerChange={setActiveLayerId}
              width={layersPanelWidth}
              onWidthChange={setLayersPanelWidth}
            />
          )}
        </div>
      </div>

      {/* Panel Toggle Buttons */}
      <div className="fixed left-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-50">
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded shadow-lg transition-colors"
          title={isSidebarCollapsed ? 'Show Assets' : 'Hide Assets'}
        >
          <Folder className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      <div className="fixed right-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-50">
        <button
          onClick={() => setIsLayersPanelCollapsed(!isLayersPanelCollapsed)}
          className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded shadow-lg transition-colors"
          title={isLayersPanelCollapsed ? 'Show Layers' : 'Hide Layers'}
        >
          <Layers className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      <div className="fixed right-2 bottom-2 z-50">
        <button
          onClick={() =>
            setIsPropertiesPanelCollapsed(!isPropertiesPanelCollapsed)
          }
          className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded shadow-lg transition-colors"
          title={
            isPropertiesPanelCollapsed ? 'Show Properties' : 'Hide Properties'
          }
        >
          <Settings className="w-4 h-4 text-gray-300" />
        </button>
      </div>
    </div>
  );
};
