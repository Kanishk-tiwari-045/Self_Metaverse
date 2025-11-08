import { MapLayer } from './LayersPanel';

export interface TileData {
  id: string;
  tileId: number;
  tilesetName: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sourceX: number;
  sourceY: number;
  layerId: string;
}

export interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
  showGrid: boolean;
  gridSize: number;
  selectedTool: string;
  layers: MapLayer[];
  tiles: TileData[];
}

export class TiledCanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: CanvasState;
  private tilesetImages: Map<string, HTMLImageElement> = new Map();
  private isDragging = false;
  private lastMousePos = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    // Set up canvas for crisp pixel art rendering
    this.ctx.imageSmoothingEnabled = false;

    this.state = {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      showGrid: true,
      gridSize: 32,
      selectedTool: 'select',
      layers: this.initializeLayers(),
      tiles: [],
    };

    this.preloadTilesetImages();
    this.setupEventListeners();
  }

  private initializeLayers(): MapLayer[] {
    return [
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
        id: 'walls2',
        name: 'walls/walls2',
        displayName: 'Walls Layer 2',
        isVisible: true,
        isLocked: false,
        isActive: false,
        depth: 3,
        opacity: 1,
      },
      {
        id: 'furniture1',
        name: 'furniture/furniture1',
        displayName: 'Furniture Layer 1',
        isVisible: true,
        isLocked: false,
        isActive: true, // Default active layer
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
        id: 'furniture3',
        name: 'furniture/furniture3',
        displayName: 'Furniture Layer 3',
        isVisible: true,
        isLocked: false,
        isActive: false,
        depth: 6,
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
      {
        id: 'above2',
        name: 'above/above2',
        displayName: 'Above Layer 2',
        isVisible: true,
        isLocked: false,
        isActive: false,
        depth: 8,
        opacity: 0.7,
      },
    ];
  }

  private async preloadTilesetImages() {
    const tilesets = [
      'WA_Room_Builder',
      'WA_Tables',
      'WA_Seats',
      'WA_Other_Furniture',
      'WA_Decoration',
      'WA_Miscellaneous',
      'WA_User_Interface',
      'WA_Exterior',
    ];

    for (const tileset of tilesets) {
      const img = new Image();
      img.src = `/tilesets/${tileset}.png`;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      this.tilesetImages.set(tileset, img);
    }
  }

  private setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleMouseDown(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.isDragging = true;
    this.lastMousePos = { x, y };

    // Handle tool-specific actions
    const worldPos = this.screenToWorld(x, y);
    const gridPos = this.worldToGrid(worldPos.x, worldPos.y);

    switch (this.state.selectedTool) {
      case 'brush':
        this.handleBrushTool(gridPos.x, gridPos.y);
        break;
      case 'eraser':
        this.handleEraserTool(gridPos.x, gridPos.y);
        break;
      case 'select':
        this.handleSelectTool(gridPos.x, gridPos.y);
        break;
    }
  }

  private handleMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.isDragging) {
      if (this.state.selectedTool === 'move' || e.button === 1) {
        // Pan the canvas
        const deltaX = x - this.lastMousePos.x;
        const deltaY = y - this.lastMousePos.y;
        this.state.offsetX += deltaX;
        this.state.offsetY += deltaY;
        this.render();
      } else {
        // Continue tool action
        const worldPos = this.screenToWorld(x, y);
        const gridPos = this.worldToGrid(worldPos.x, worldPos.y);

        if (this.state.selectedTool === 'brush') {
          this.handleBrushTool(gridPos.x, gridPos.y);
        } else if (this.state.selectedTool === 'eraser') {
          this.handleEraserTool(gridPos.x, gridPos.y);
        }
      }
    }

    this.lastMousePos = { x, y };
  }

  private handleMouseUp() {
    this.isDragging = false;
  }

  private handleWheel(e: WheelEvent) {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, this.state.scale * scaleFactor));

    // Zoom towards mouse position
    const worldPos = this.screenToWorld(mouseX, mouseY);
    this.state.scale = newScale;
    const newScreenPos = this.worldToScreen(worldPos.x, worldPos.y);

    this.state.offsetX += mouseX - newScreenPos.x;
    this.state.offsetY += mouseY - newScreenPos.y;

    this.render();
  }

  private screenToWorld(screenX: number, screenY: number) {
    return {
      x: (screenX - this.state.offsetX) / this.state.scale,
      y: (screenY - this.state.offsetY) / this.state.scale,
    };
  }

  private worldToScreen(worldX: number, worldY: number) {
    return {
      x: worldX * this.state.scale + this.state.offsetX,
      y: worldY * this.state.scale + this.state.offsetY,
    };
  }

  private worldToGrid(worldX: number, worldY: number) {
    return {
      x: Math.floor(worldX / this.state.gridSize),
      y: Math.floor(worldY / this.state.gridSize),
    };
  }

  private handleBrushTool(gridX: number, gridY: number) {
    // Implementation for placing tiles with brush tool
    console.log('Brush tool at grid:', gridX, gridY);
  }

  private handleEraserTool(gridX: number, gridY: number) {
    // Remove tiles at this position
    const activeLayer = this.state.layers.find((l) => l.isActive);
    if (!activeLayer) return;

    this.state.tiles = this.state.tiles.filter(
      (tile) =>
        !(
          tile.x === gridX * this.state.gridSize &&
          tile.y === gridY * this.state.gridSize &&
          tile.layerId === activeLayer.id
        )
    );
    this.render();
  }

  private handleSelectTool(gridX: number, gridY: number) {
    // Select tile at this position
    console.log('Select tool at grid:', gridX, gridY);
  }

  public render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Set up rendering context
    this.ctx.save();
    this.ctx.translate(this.state.offsetX, this.state.offsetY);
    this.ctx.scale(this.state.scale, this.state.scale);

    // Render grid
    if (this.state.showGrid) {
      this.renderGrid();
    }

    // Render tiles by layer (sorted by depth)
    const visibleLayers = this.state.layers
      .filter((layer) => layer.isVisible)
      .sort((a, b) => a.depth - b.depth);

    for (const layer of visibleLayers) {
      this.renderLayer(layer);
    }

    this.ctx.restore();
  }

  private renderGrid() {
    const startX =
      Math.floor(-this.state.offsetX / this.state.scale / this.state.gridSize) *
      this.state.gridSize;
    const startY =
      Math.floor(-this.state.offsetY / this.state.scale / this.state.gridSize) *
      this.state.gridSize;
    const endX =
      startX + this.canvas.width / this.state.scale + this.state.gridSize;
    const endY =
      startY + this.canvas.height / this.state.scale + this.state.gridSize;

    this.ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)';
    this.ctx.lineWidth = 1 / this.state.scale;

    this.ctx.beginPath();
    for (let x = startX; x <= endX; x += this.state.gridSize) {
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += this.state.gridSize) {
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
    }
    this.ctx.stroke();
  }

  private renderLayer(layer: MapLayer) {
    const layerTiles = this.state.tiles.filter(
      (tile) => tile.layerId === layer.id
    );

    this.ctx.globalAlpha = layer.opacity;

    for (const tile of layerTiles) {
      this.renderTile(tile);
    }

    this.ctx.globalAlpha = 1;
  }

  private renderTile(tile: TileData) {
    const img = this.tilesetImages.get(tile.tilesetName);
    if (!img) return;

    this.ctx.drawImage(
      img,
      tile.sourceX,
      tile.sourceY,
      tile.width,
      tile.height,
      tile.x,
      tile.y,
      tile.width,
      tile.height
    );
  }

  // Public API methods
  public updateState(newState: Partial<CanvasState>) {
    Object.assign(this.state, newState);
    this.render();
  }

  public getState(): CanvasState {
    return { ...this.state };
  }

  public setTool(tool: string) {
    this.state.selectedTool = tool;
  }

  public setShowGrid(show: boolean) {
    this.state.showGrid = show;
    this.render();
  }

  public addTile(tile: TileData) {
    this.state.tiles.push(tile);
    this.render();
  }

  public removeTileAt(x: number, y: number, layerId: string) {
    this.state.tiles = this.state.tiles.filter(
      (tile) => !(tile.x === x && tile.y === y && tile.layerId === layerId)
    );
    this.render();
  }

  public centerView(mapWidth: number, mapHeight: number) {
    this.state.offsetX = (this.canvas.width - mapWidth * this.state.scale) / 2;
    this.state.offsetY =
      (this.canvas.height - mapHeight * this.state.scale) / 2;
    this.render();
  }

  public fitToView(mapWidth: number, mapHeight: number) {
    const scaleX = this.canvas.width / mapWidth;
    const scaleY = this.canvas.height / mapHeight;
    this.state.scale = Math.min(scaleX, scaleY) * 0.8; // 80% to leave some padding
    this.centerView(mapWidth, mapHeight);
  }
}
