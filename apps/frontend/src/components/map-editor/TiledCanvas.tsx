import { useRef, useEffect, useState, useCallback } from 'react';

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

interface TiledCanvasProps {
  mapImageUrl: string;
  layers: Layer[];
  activeLayerId: string;
  selectedElement: PlacedElement | null;
  onElementSelect: (element: PlacedElement | null) => void;
  onElementPlace: (element: PlacedElement) => void;
  onElementUpdate: (elementId: string, updates: Partial<PlacedElement>) => void;
  onElementDelete: (elementId: string) => void;
  zoom: number;
  showGrid: boolean;
  selectedTool: string;
}

export const TiledCanvas: React.FC<TiledCanvasProps> = ({
  mapImageUrl,
  layers,
  selectedElement,
  onElementSelect,
  onElementPlace,
  onElementUpdate,
  onElementDelete,
  zoom,
  showGrid,
  selectedTool,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [elementImages, setElementImages] = useState<
    Map<string, HTMLImageElement>
  >(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  const GRID_SIZE = 32;

  // Load map background image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setMapImage(img);
    img.onerror = () =>
      console.warn(`Failed to load map image: ${mapImageUrl}`);
    img.src = mapImageUrl;
  }, [mapImageUrl]);

  // Preload element images
  useEffect(() => {
    const loadElementImages = async () => {
      const imageMap = new Map<string, HTMLImageElement>();
      const allElements = layers.flatMap((layer) => layer.elements);

      for (const element of allElements) {
        if (!imageMap.has(element.imageUrl)) {
          try {
            const img = await loadImage(element.imageUrl);
            imageMap.set(element.imageUrl, img);
          } catch (error) {
            console.warn(`Failed to load element image: ${element.imageUrl}`);
          }
        }
      }

      setElementImages(imageMap);
    };

    loadElementImages();
  }, [layers]);

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Render canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Clear canvas
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save context for transformations
    ctx.save();

    // Apply pan and zoom transformations
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Calculate visible area for performance
    const visibleRect = {
      x: -panOffset.x / zoom,
      y: -panOffset.y / zoom,
      width: canvas.width / zoom,
      height: canvas.height / zoom,
    };

    // Draw map background
    if (mapImage && mapImage.complete) {
      const mapX = (canvas.width / zoom - mapImage.width) / 2;
      const mapY = (canvas.height / zoom - mapImage.height) / 2;

      // Only draw if visible
      if (
        mapX < visibleRect.x + visibleRect.width &&
        mapX + mapImage.width > visibleRect.x &&
        mapY < visibleRect.y + visibleRect.height &&
        mapY + mapImage.height > visibleRect.y
      ) {
        ctx.drawImage(mapImage, mapX, mapY);
      }
    }

    // Draw grid
    if (showGrid && zoom > 0.5) {
      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 0.5 / zoom;

      const startX = Math.floor(visibleRect.x / GRID_SIZE) * GRID_SIZE;
      const endX =
        Math.ceil((visibleRect.x + visibleRect.width) / GRID_SIZE) * GRID_SIZE;
      const startY = Math.floor(visibleRect.y / GRID_SIZE) * GRID_SIZE;
      const endY =
        Math.ceil((visibleRect.y + visibleRect.height) / GRID_SIZE) * GRID_SIZE;

      ctx.beginPath();
      for (let x = startX; x <= endX; x += GRID_SIZE) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += GRID_SIZE) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
    }

    // Draw layers (bottom to top)
    layers.forEach((layer) => {
      if (!layer.visible) return;

      ctx.globalAlpha = layer.opacity;

      layer.elements.forEach((element) => {
        // Skip if not visible in current view
        if (
          element.x > visibleRect.x + visibleRect.width ||
          element.x + element.width < visibleRect.x ||
          element.y > visibleRect.y + visibleRect.height ||
          element.y + element.height < visibleRect.y
        ) {
          return;
        }

        const img = elementImages.get(element.imageUrl);
        if (img && img.complete) {
          // Highlight selected element
          if (selectedElement?.id === element.id) {
            ctx.strokeStyle = '#3182ce';
            ctx.lineWidth = 3 / zoom;
            ctx.strokeRect(
              element.x - 2,
              element.y - 2,
              element.width + 4,
              element.height + 4
            );

            // Draw selection handles
            const handleSize = 8 / zoom;
            ctx.fillStyle = '#3182ce';
            ctx.fillRect(
              element.x - handleSize / 2,
              element.y - handleSize / 2,
              handleSize,
              handleSize
            );
            ctx.fillRect(
              element.x + element.width - handleSize / 2,
              element.y - handleSize / 2,
              handleSize,
              handleSize
            );
            ctx.fillRect(
              element.x - handleSize / 2,
              element.y + element.height - handleSize / 2,
              handleSize,
              handleSize
            );
            ctx.fillRect(
              element.x + element.width - handleSize / 2,
              element.y + element.height - handleSize / 2,
              handleSize,
              handleSize
            );
          }

          // Draw element
          ctx.drawImage(
            img,
            element.x,
            element.y,
            element.width,
            element.height
          );
        }
      });

      ctx.globalAlpha = 1;
    });

    ctx.restore();
  }, [
    mapImage,
    elementImages,
    layers,
    selectedElement,
    zoom,
    showGrid,
    panOffset,
  ]);

  // Re-render when dependencies change
  useEffect(() => {
    render();
  }, [render]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => render();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  // Mouse position helpers
  const getMousePosition = (e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: ((e.clientX - rect.left) * scaleX - panOffset.x) / zoom,
      y: ((e.clientY - rect.top) * scaleY - panOffset.y) / zoom,
    };
  };

  const snapToGrid = (value: number): number => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  // Find element at position
  const getElementAtPosition = (pos: {
    x: number;
    y: number;
  }): PlacedElement | null => {
    // Search from top layer to bottom
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible) continue;

      for (let j = layer.elements.length - 1; j >= 0; j--) {
        const element = layer.elements[j];
        if (
          pos.x >= element.x &&
          pos.x <= element.x + element.width &&
          pos.y >= element.y &&
          pos.y <= element.y + element.height
        ) {
          return element;
        }
      }
    }
    return null;
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePosition(e);

    if (selectedTool === 'select' || selectedTool === 'move') {
      const clickedElement = getElementAtPosition(pos);

      if (clickedElement) {
        onElementSelect(clickedElement);

        if (e.button === 0) {
          // Left click
          setIsDragging(true);
          setDragOffset({
            x: pos.x - clickedElement.x,
            y: pos.y - clickedElement.y,
          });
        }
      } else {
        onElementSelect(null);

        // Start panning
        if (e.button === 0) {
          setIsPanning(true);
          setLastPanPoint({ x: e.clientX, y: e.clientY });
        }
      }
    }

    // Handle delete with selected tool
    if (selectedTool === 'eraser' && e.button === 0) {
      const clickedElement = getElementAtPosition(pos);
      if (clickedElement) {
        onElementDelete(clickedElement.id);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePosition(e);

    if (isDragging && selectedElement) {
      const newX = snapToGrid(pos.x - dragOffset.x);
      const newY = snapToGrid(pos.y - dragOffset.y);

      onElementUpdate(selectedElement.id, { x: newX, y: newY });
    } else if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;

      setPanOffset((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    // Zoom is handled by parent component
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData('application/json');
      const asset = JSON.parse(data);

      const pos = getMousePosition(e as any);
      const snappedX = snapToGrid(pos.x - 32); // Center on cursor
      const snappedY = snapToGrid(pos.y - 32);

      const newElement: PlacedElement = {
        id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: asset.name,
        x: snappedX,
        y: snappedY,
        width: 64,
        height: 64,
        imageUrl: asset.imageUrl,
        type: asset.category === 'machines' ? 'machine' : 'furniture',
        properties: {},
      };

      onElementPlace(newElement);
    } catch (error) {
      console.error('Failed to place element from drag and drop:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' && selectedElement) {
      onElementDelete(selectedElement.id);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-gray-800"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Canvas Info Overlay */}
      <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm">
        Tool: {selectedTool} • Zoom: {Math.round(zoom * 100)}% • Grid:{' '}
        {showGrid ? 'ON' : 'OFF'}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm max-w-xs">
        <p className="font-medium mb-1">Controls:</p>
        <ul className="text-xs space-y-1 text-gray-300">
          <li>• Drag assets from sidebar to place</li>
          <li>• Click to select elements</li>
          <li>• Drag elements to move them</li>
          <li>• Delete key to remove selected</li>
          <li>• Mouse drag to pan view</li>
        </ul>
      </div>
    </div>
  );
};
