import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { MachinesSidebar } from '../components/map-editor/MachinesSidebar';
import { MapCanvas } from '../components/map-editor/MapCanvas';
import { SimpleToolbar } from '../components/map-editor/SimpleToolbar';

interface MachineElement {
  id: string;
  name: string;
  imageUrl: string;
  fileName: string;
}

interface PlacedElement {
  id: string;
  machineId: string;
  x: number;
  y: number;
  imageUrl: string;
  name: string;
}

interface MapData {
  id: number;
  name: string;
  width: number;
  height: number;
  ownerId: number;
}

export const MapEditorPage = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  // State management
  const [map, setMap] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedMachine, setSelectedMachine] = useState<MachineElement | null>(
    null
  );
  const [selectedElement, setSelectedElement] = useState<PlacedElement | null>(
    null
  );
  const [placedElements, setPlacedElements] = useState<PlacedElement[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [showElements, setShowElements] = useState(true);
  const [undoStack, setUndoStack] = useState<PlacedElement[][]>([]);
  const [redoStack, setRedoStack] = useState<PlacedElement[][]>([]);

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

          // Load existing elements if any
          // TODO: Implement backend API to fetch placed elements
          // For now, start with empty elements
          setPlacedElements([]);

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

  // Add element to canvas
  const handleElementPlace = (element: PlacedElement) => {
    // Save current state for undo
    setUndoStack((prev) => [...prev, placedElements]);
    setRedoStack([]); // Clear redo stack when new action is performed

    setPlacedElements((prev) => [...prev, element]);
  };

  // Handle element selection
  const handleElementSelect = (element: PlacedElement | null) => {
    setSelectedElement(element);
  };

  // Save map
  const handleSave = async () => {
    try {
      // TODO: Implement backend API to save placed elements
      console.log('Saving map with elements:', placedElements);

      // For now, just show success message
      alert('Map saved successfully! (Currently saving to console)');
    } catch (error) {
      console.error('Failed to save map:', error);
      alert('Failed to save map');
    }
  };

  // Undo action
  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack((prev) => [...prev, placedElements]);
      setPlacedElements(previousState);
      setUndoStack((prev) => prev.slice(0, -1));
    }
  };

  // Redo action
  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack((prev) => [...prev, placedElements]);
      setPlacedElements(nextState);
      setRedoStack((prev) => prev.slice(0, -1));
    }
  };

  // Clear all elements
  const handleClear = () => {
    if (
      placedElements.length > 0 &&
      confirm('Are you sure you want to remove all elements?')
    ) {
      setUndoStack((prev) => [...prev, placedElements]);
      setRedoStack([]);
      setPlacedElements([]);
      setSelectedElement(null);
    }
  };

  // Zoom controls (placeholder - will be implemented in MapCanvas)
  const handleZoomIn = () => {
    // TODO: Implement zoom in MapCanvas
    console.log('Zoom in');
  };

  const handleZoomOut = () => {
    // TODO: Implement zoom in MapCanvas
    console.log('Zoom out');
  };

  const handleResetZoom = () => {
    // TODO: Implement reset zoom in MapCanvas
    console.log('Reset zoom');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading map editor...</p>
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
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">
              Map Editor - {map?.name}
            </h1>
            <p className="text-sm text-gray-400">
              Drag and drop machines from the sidebar to place them on the map
            </p>
          </div>
        </div>

        {/* Status info */}
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>{placedElements.length} elements</span>
          <span>•</span>
          <span>
            {selectedMachine
              ? `Selected: ${selectedMachine.name}`
              : 'No machine selected'}
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <SimpleToolbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onSave={handleSave}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        showElements={showElements}
        onToggleElements={() => setShowElements(!showElements)}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
      />

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Machines Sidebar */}
        <MachinesSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          selectedMachine={selectedMachine}
          onSelectMachine={setSelectedMachine}
        />

        {/* Map Canvas */}
        <div
          className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-[280px]' : 'ml-0'}`}
        >
          <MapCanvas
            backgroundImageUrl="/assets/maps_thumbnails/map1.png"
            selectedMachine={selectedMachine}
            onElementPlace={handleElementPlace}
            placedElements={showElements ? placedElements : []}
            onElementSelect={handleElementSelect}
            selectedElement={selectedElement}
          />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center gap-4">
          <span>Ready</span>
          {selectedElement && (
            <>
              <span>•</span>
              <span>
                Selected: {selectedElement.name} at (
                {Math.round(selectedElement.x)}, {Math.round(selectedElement.y)}
                )
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>Mouse: Click to place • Drag to move • Wheel to zoom</span>
        </div>
      </div>
    </div>
  );
};
