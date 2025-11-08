import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';

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

interface Element {
  id: number;
  imageUrl: string;
  width: number;
  height: number;
  isStatic: boolean;
}

interface SpaceData {
  id: number;
  name: string;
  width: number;
  height: number;
  elements: SpaceElement[];
}

const CELL_SIZE = 32;

export const SpaceEditorPage = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [space, setSpace] = useState<SpaceData | null>(null);
  const [availableElements, setAvailableElements] = useState<Element[]>([]);
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    fetchSpaceData();
    fetchAvailableElements();
  }, [spaceId]);

  useEffect(() => {
    if (space) {
      drawCanvas();
    }
  }, [space, selectedElement, mousePosition]);

  const fetchSpaceData = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/space/${spaceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSpace(data);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch space:', error);
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

  const handleCanvasClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!space || !selectedElement) {
      console.log('No space or selected element');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const container = canvas.parentElement;
    if (!container) return;

    // Get the scroll position of the container
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    // Calculate coordinates accounting for scroll
    const rawX = e.clientX - rect.left + scrollLeft;
    const rawY = e.clientY - rect.top + scrollTop;

    // Calculate grid position (center the element on click)
    let x = Math.floor(rawX / CELL_SIZE);
    let y = Math.floor(rawY / CELL_SIZE);

    // Center the element around the click point
    x = x - Math.floor(selectedElement.width / 2);
    y = y - Math.floor(selectedElement.height / 2);

    // Validate bounds (ensure the entire element fits within the space)
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + selectedElement.width > space.width)
      x = space.width - selectedElement.width;
    if (y + selectedElement.height > space.height)
      y = space.height - selectedElement.height;

    // Check if this position would cause overlap with existing elements
    const wouldOverlap = space.elements.some((existingElement) => {
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
      console.log('Cannot place element: would overlap with existing element');
      alert('Cannot place element: would overlap with existing element');
      return;
    }

    console.log(
      `Placing element ${selectedElement.id} (${selectedElement.width}x${selectedElement.height}) at (${x}, ${y})`
    );

    // Add element to space
    try {
      const response = await fetch(
        'http://localhost:3000/api/v1/space/element',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            spaceId: spaceId!,
            elementId: selectedElement.id.toString(),
            x,
            y,
          }),
        }
      );

      if (response.ok) {
        console.log('Element placed successfully');
        fetchSpaceData(); // Refresh space data
        setSelectedElement(null); // Deselect element after placement
      } else {
        console.error('Failed to place element, status:', response.status);
        const errorData = await response.text();
        console.error('Error response:', errorData);
        alert(`Failed to place element: ${errorData}`);
      }
    } catch (error) {
      console.error('Failed to add element:', error);
      alert('Network error while placing element');
    }
  };

  const handleDeleteElement = async (elementId: number) => {
    if (!confirm('Are you sure you want to delete this element?')) return;

    try {
      const response = await fetch(
        'http://localhost:3000/api/v1/space/element',
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
        fetchSpaceData(); // Refresh space data
      }
    } catch (error) {
      console.error('Failed to delete element:', error);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !space) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 1;
    for (let x = 0; x <= space.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, space.height * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= space.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(space.width * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // Draw elements
    space.elements.forEach((element) => {
      ctx.fillStyle = element.element.isStatic ? '#ef4444' : '#4a5568';
      ctx.fillRect(
        element.x * CELL_SIZE,
        element.y * CELL_SIZE,
        element.element.width * CELL_SIZE,
        element.element.height * CELL_SIZE
      );
      ctx.strokeStyle = '#718096';
      ctx.strokeRect(
        element.x * CELL_SIZE,
        element.y * CELL_SIZE,
        element.element.width * CELL_SIZE,
        element.element.height * CELL_SIZE
      );
    });

    // Draw element preview at mouse position
    if (selectedElement && mousePosition) {
      let previewX = Math.floor(mousePosition.x / CELL_SIZE);
      let previewY = Math.floor(mousePosition.y / CELL_SIZE);

      // Center the element around the cursor
      previewX = previewX - Math.floor(selectedElement.width / 2);
      previewY = previewY - Math.floor(selectedElement.height / 2);

      // Validate bounds
      if (previewX < 0) previewX = 0;
      if (previewY < 0) previewY = 0;
      if (previewX + selectedElement.width > space.width)
        previewX = space.width - selectedElement.width;
      if (previewY + selectedElement.height > space.height)
        previewY = space.height - selectedElement.height;

      // Check if this position would cause overlap
      const wouldOverlap = space.elements.some((existingElement) => {
        const existingEndX = existingElement.x + existingElement.element.width;
        const existingEndY = existingElement.y + existingElement.element.height;
        const newEndX = previewX + selectedElement.width;
        const newEndY = previewY + selectedElement.height;

        return !(
          previewX >= existingEndX ||
          newEndX <= existingElement.x ||
          previewY >= existingEndY ||
          newEndY <= existingElement.y
        );
      });

      // Draw preview with appropriate color
      ctx.fillStyle = wouldOverlap
        ? 'rgba(239, 68, 68, 0.5)'
        : 'rgba(16, 185, 129, 0.5)';
      ctx.fillRect(
        previewX * CELL_SIZE,
        previewY * CELL_SIZE,
        selectedElement.width * CELL_SIZE,
        selectedElement.height * CELL_SIZE
      );

      ctx.strokeStyle = wouldOverlap ? '#ef4444' : '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        previewX * CELL_SIZE,
        previewY * CELL_SIZE,
        selectedElement.width * CELL_SIZE,
        selectedElement.height * CELL_SIZE
      );
      ctx.setLineDash([]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedElement) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const container = canvas.parentElement;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    const x = e.clientX - rect.left + scrollLeft;
    const y = e.clientY - rect.top + scrollTop;

    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePosition(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Space not found</h1>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="inline mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-slate-400 hover:text-white mb-2 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-white">
              Edit: {space.name}
            </h1>
            <div className="text-slate-400">
              {selectedElement ? (
                <div>
                  <p>
                    Selected: Element #{selectedElement.id} (
                    {selectedElement.width}x{selectedElement.height}) -{' '}
                    {selectedElement.isStatic ? 'Static' : 'Walkable'}
                  </p>
                  <p className="text-sm">
                    Click on canvas to place. Element will be centered on your
                    click.
                  </p>
                </div>
              ) : (
                <p>Select an element from the palette to place it</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Element Palette */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">Elements</h2>
              <div className="space-y-2">
                {availableElements.map((element) => (
                  <button
                    key={element.id}
                    onClick={() => setSelectedElement(element)}
                    className={`w-full p-4 rounded-lg border-2 transition ${
                      selectedElement?.id === element.id
                        ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/25'
                        : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700'
                    }`}
                  >
                    <div className="text-white font-medium mb-1">
                      Element #{element.id}
                    </div>
                    <div className="text-slate-300 text-sm">
                      {element.width}x{element.height} •{' '}
                      {element.isStatic ? 'Static' : 'Walkable'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Placed Elements List */}
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700 mt-4">
              <h2 className="text-xl font-bold text-white mb-4">
                Placed Elements
              </h2>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {space.elements.map((element) => (
                  <div
                    key={element.id}
                    className="flex justify-between items-center p-2 rounded bg-slate-700/50"
                  >
                    <span className="text-white text-sm">
                      Element at ({element.x}, {element.y})
                    </span>
                    <button
                      onClick={() => handleDeleteElement(element.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {space.elements.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-4">
                    No elements placed yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
              <div className="max-h-[70vh] overflow-auto rounded-lg border border-slate-600 bg-slate-900">
                <canvas
                  ref={canvasRef}
                  width={space.width * CELL_SIZE}
                  height={space.height * CELL_SIZE}
                  onClick={handleCanvasClick}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  className={
                    selectedElement
                      ? 'cursor-crosshair block'
                      : 'cursor-default block'
                  }
                />
              </div>

              {/* Legend */}
              <div className="mt-4 flex justify-center gap-6 text-white text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500"></div>
                  <span>Static (Non-walkable)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-slate-600"></div>
                  <span>Walkable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
