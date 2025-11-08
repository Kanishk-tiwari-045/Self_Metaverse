import React, { useState, useRef, useEffect } from 'react';

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

interface MapCanvasProps {
  backgroundImageUrl?: string;
  selectedMachine: MachineElement | null;
  onElementPlace: (element: PlacedElement) => void;
  placedElements: PlacedElement[];
  onElementSelect: (element: PlacedElement | null) => void;
  selectedElement: PlacedElement | null;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  backgroundImageUrl = '/assets/maps_thumbnails/map1.png',
  selectedMachine,
  onElementPlace,
  placedElements,
  onElementSelect,
  selectedElement,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [backgroundImage, setBackgroundImage] =
    useState<HTMLImageElement | null>(null);
  const [machineImages, setMachineImages] = useState<
    Map<string, HTMLImageElement>
  >(new Map());

  // Load background image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setBackgroundImage(img);
    };
    img.src = backgroundImageUrl;
  }, [backgroundImageUrl]);

  // Preload machine images
  useEffect(() => {
    const loadImage = (imageUrl: string) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
          console.warn(`Failed to load image: ${imageUrl}`);
          resolve(img); // Still resolve to prevent blocking
        };
        img.src = imageUrl;
      });
    };

    const loadAllImages = async () => {
      const imageMap = new Map<string, HTMLImageElement>();

      // Load images for placed elements
      for (const element of placedElements) {
        if (!imageMap.has(element.imageUrl)) {
          const img = await loadImage(element.imageUrl);
          imageMap.set(element.imageUrl, img);
        }
      }

      // Load selected machine image if any
      if (selectedMachine && !imageMap.has(selectedMachine.imageUrl)) {
        const img = await loadImage(selectedMachine.imageUrl);
        imageMap.set(selectedMachine.imageUrl, img);
      }

      setMachineImages(imageMap);
    };

    loadAllImages();
  }, [placedElements, selectedMachine]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Clear canvas with dark background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save context for transformations
    ctx.save();

    // Apply zoom and pan transformations
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Draw background map image
    if (backgroundImage && backgroundImage.complete) {
      const imgWidth = backgroundImage.width;
      const imgHeight = backgroundImage.height;

      // Center the background image
      const x = (canvas.width / zoom - imgWidth) / 2;
      const y = (canvas.height / zoom - imgHeight) / 2;

      ctx.drawImage(backgroundImage, x, y);
    }

    // Draw placed elements
    placedElements.forEach((element) => {
      const img = machineImages.get(element.imageUrl);
      if (img && img.complete) {
        const elementSize = 64; // Standard size for elements

        // Highlight selected element
        if (selectedElement?.id === element.id) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 3;
          ctx.strokeRect(
            element.x - 2,
            element.y - 2,
            elementSize + 4,
            elementSize + 4
          );
        }

        ctx.drawImage(img, element.x, element.y, elementSize, elementSize);
      }
    });

    // Restore context
    ctx.restore();
  }, [
    backgroundImage,
    machineImages,
    placedElements,
    selectedElement,
    zoom,
    panOffset,
  ]);

  // Handle mouse events
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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const pos = getMousePosition(e);

    // Check if clicking on an existing element
    const clickedElement = placedElements.find((element) => {
      const elementSize = 64;
      return (
        pos.x >= element.x &&
        pos.x <= element.x + elementSize &&
        pos.y >= element.y &&
        pos.y <= element.y + elementSize
      );
    });

    if (clickedElement) {
      onElementSelect(clickedElement);
      if (e.button === 0) {
        // Left mouse button
        setIsDragging(true);
        setDragOffset({
          x: pos.x - clickedElement.x,
          y: pos.y - clickedElement.y,
        });
      }
    } else {
      onElementSelect(null);

      // Place new element if machine is selected and left mouse button
      if (selectedMachine && e.button === 0) {
        const newElement: PlacedElement = {
          id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          machineId: selectedMachine.id,
          x: pos.x - 32, // Center the element on cursor
          y: pos.y - 32,
          imageUrl: selectedMachine.imageUrl,
          name: selectedMachine.name,
        };
        onElementPlace(newElement);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedElement) {
      const pos = getMousePosition(e);
      const newX = pos.x - dragOffset.x;
      const newY = pos.y - dragOffset.y;

      // Update element position (you would typically update this through a callback)
      // For now, we'll just trigger a re-render by updating the element
      const updatedElement = { ...selectedElement, x: newX, y: newY };
      onElementSelect(updatedElement);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));
    setZoom(newZoom);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData('application/json');
      const machine = JSON.parse(data) as MachineElement;

      const pos = getMousePosition(e as any); // Cast to MouseEvent for position calculation

      const newElement: PlacedElement = {
        id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        machineId: machine.id,
        x: pos.x - 32, // Center the element on drop position
        y: pos.y - 32,
        imageUrl: machine.imageUrl,
        name: machine.name,
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
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Zoom indicator */}
      <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
        Zoom: {Math.round(zoom * 100)}%
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg text-sm max-w-xs">
        <p className="font-medium mb-1">Controls:</p>
        <ul className="text-xs space-y-1 text-gray-300">
          <li>• Click to place selected machine</li>
          <li>• Drag elements to move them</li>
          <li>• Mouse wheel to zoom</li>
          <li>• Drag machines from sidebar</li>
        </ul>
      </div>
    </div>
  );
};
