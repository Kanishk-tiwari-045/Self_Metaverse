import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

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

interface TilesetCategory {
  name: string;
  displayName: string;
  imageUrl: string;
  tiles: TilesetTile[];
  isExpanded: boolean;
}

interface TilesetPanelProps {
  selectedTile: TilesetTile | null;
  onTileSelect: (tile: TilesetTile | null) => void;
  onCategoryToggle?: (categoryName: string) => void;
}

export const TilesetPanel: React.FC<TilesetPanelProps> = ({
  selectedTile,
  onTileSelect,
  onCategoryToggle,
}) => {
  const [categories, setCategories] = useState<TilesetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Available tilesets from GameScene.ts
  const tilesetDefinitions = [
    { name: 'WA_Room_Builder', displayName: 'Room Builder', priority: 1 },
    { name: 'WA_Tables', displayName: 'Tables', priority: 2 },
    { name: 'WA_Seats', displayName: 'Seats', priority: 3 },
    { name: 'WA_Other_Furniture', displayName: 'Furniture', priority: 4 },
    { name: 'WA_Decoration', displayName: 'Decoration', priority: 5 },
    { name: 'WA_Miscellaneous', displayName: 'Miscellaneous', priority: 6 },
    { name: 'WA_User_Interface', displayName: 'UI Elements', priority: 7 },
    { name: 'WA_Exterior', displayName: 'Exterior', priority: 8 },
  ];

  useEffect(() => {
    extractTilesFromTilesets();
  }, []);

  const extractTilesFromTilesets = async () => {
    setIsLoading(true);

    try {
      const extractedCategories: TilesetCategory[] = [];

      for (const tileset of tilesetDefinitions) {
        const tiles = await extractTilesFromImage(tileset.name);

        if (tiles.length > 0) {
          extractedCategories.push({
            name: tileset.name,
            displayName: tileset.displayName,
            imageUrl: `/tilesets/${tileset.name}.png`,
            tiles,
            isExpanded: tileset.priority <= 4, // Auto-expand important categories
          });
        }
      }

      // Also extract from machines folder
      const machinesTiles = await extractMachineImages();
      if (machinesTiles.length > 0) {
        extractedCategories.push({
          name: 'machines',
          displayName: 'Machines & Equipment',
          imageUrl: '/machines/14425972-491d-4ebf-a7ba-9a1a788e2eea.png',
          tiles: machinesTiles,
          isExpanded: true,
        });
      }

      setCategories(extractedCategories);
    } catch (error) {
      console.error('Failed to extract tiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const extractTilesFromImage = async (
    tilesetName: string
  ): Promise<TilesetTile[]> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const tiles: TilesetTile[] = [];
        const tileSize = 32; // Standard tile size
        const cols = Math.floor(img.width / tileSize);
        const rows = Math.floor(img.height / tileSize);

        let tileId = 0;
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            // Skip empty tiles by checking if there's any content
            // For now, we'll include all tiles - can optimize later
            tiles.push({
              id: `${tilesetName}_${tileId}`,
              imageUrl: `/tilesets/${tilesetName}.png`,
              x: col * tileSize,
              y: row * tileSize,
              width: tileSize,
              height: tileSize,
              tilesetName,
              tileId,
            });
            tileId++;
          }
        }

        resolve(tiles);
      };
      img.onerror = () => resolve([]);
      img.src = `/tilesets/${tilesetName}.png`;
    });
  };

  const extractMachineImages = async (): Promise<TilesetTile[]> => {
    // For now, we'll use the known machine images
    // In production, you'd want to fetch this list from an API
    const machineFiles = [
      '14425972-491d-4ebf-a7ba-9a1a788e2eea.png',
      'af43a744-ac8a-43e4-902b-4df318ca796e.png',
      'adf95a49-8831-43e1-9fa0-76932d88460b.png',
      '8aa9c3e9-c323-4f7d-9e9a-bd72142755ed.png',
      'bf140bd1-728d-43df-a9d1-441f6535ae8e.png',
      '7355604c-6e6c-4410-a5c2-f80ecb6de89a.png',
      '6caddc03-e728-4880-8d6d-fb1d528a1713.png',
      '59270724-a2eb-476a-be28-4c9a9b48d825.png',
    ];

    const tiles: TilesetTile[] = [];

    machineFiles.forEach((filename, index) => {
      tiles.push({
        id: `machine_${index}`,
        imageUrl: `/machines/${filename}`,
        x: 0,
        y: 0,
        width: 32, // Assuming 32x32 for machines, will be scaled
        height: 32,
        tilesetName: 'machines',
        tileId: index,
      });
    });

    return tiles;
  };

  const toggleCategory = (categoryName: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.name === categoryName
          ? { ...cat, isExpanded: !cat.isExpanded }
          : cat
      )
    );
    onCategoryToggle?.(categoryName);
  };

  const renderTile = (tile: TilesetTile) => {
    const isSelected = selectedTile?.id === tile.id;

    return (
      <div
        key={tile.id}
        className={`
          relative w-8 h-8 border cursor-pointer transition-all hover:scale-110
          ${
            isSelected
              ? 'border-blue-500 bg-blue-100 ring-2 ring-blue-300'
              : 'border-gray-200 hover:border-gray-400'
          }
        `}
        onClick={() => onTileSelect(isSelected ? null : tile)}
        title={`Tile ${tile.tileId} from ${tile.tilesetName}`}
      >
        {tile.tilesetName === 'machines' ? (
          // For machine images, show the full image scaled down
          <img
            src={tile.imageUrl}
            alt={`Machine ${tile.tileId}`}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          // For tilesets, show the specific tile
          <div
            className="w-full h-full bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url(${tile.imageUrl})`,
              backgroundPosition: `-${tile.x}px -${tile.y}px`,
              backgroundSize: 'auto',
            }}
          />
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading tilesets...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">Tilesets</h3>
        <p className="text-xs text-gray-500 mt-1">
          Click to select tiles for placement
        </p>
      </div>

      <div className="p-2 space-y-2">
        {categories.map((category) => (
          <div
            key={category.name}
            className="border border-gray-200 rounded-lg"
          >
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full p-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <img
                  src={category.imageUrl}
                  alt={category.displayName}
                  className="w-4 h-4 object-cover"
                />
                <span className="text-sm font-medium">
                  {category.displayName}
                </span>
                <span className="text-xs text-gray-500">
                  ({category.tiles.length})
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  category.isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {category.isExpanded && (
              <div className="p-2 border-t border-gray-100">
                <div className="grid grid-cols-8 gap-1">
                  {category.tiles.slice(0, 64).map(renderTile)}
                </div>
                {category.tiles.length > 64 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    + {category.tiles.length - 64} more tiles
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedTile && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3">
          <div className="text-sm">
            <p className="font-medium">Selected Tile</p>
            <p className="text-xs text-gray-500">
              {selectedTile.tilesetName} - Tile {selectedTile.tileId}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-8 h-8 border border-gray-200">
                {renderTile(selectedTile)}
              </div>
              <button
                onClick={() => onTileSelect(null)}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
