import { useState, useEffect } from 'react';
import {
  Package,
  Search,
  MousePointer,
  Paintbrush,
  Square,
  Eraser,
  Move,
  Eye,
} from 'lucide-react';

interface AssetElement {
  id: string;
  name: string;
  imageUrl: string;
  fileName: string;
  category: string;
}

interface TiledSidebarProps {
  width: number;
  onWidthChange: (width: number) => void;
  onElementSelect: (element: AssetElement) => void;
  selectedTool: string;
  onToolChange: (tool: string) => void;
}

const tools = [
  { id: 'select', name: 'Select', icon: MousePointer, shortcut: 'V' },
  { id: 'brush', name: 'Brush', icon: Paintbrush, shortcut: 'B' },
  { id: 'bucket', name: 'Bucket Fill', icon: Square, shortcut: 'G' },
  { id: 'eraser', name: 'Eraser', icon: Eraser, shortcut: 'E' },
  { id: 'move', name: 'Move', icon: Move, shortcut: 'M' },
  { id: 'eyedropper', name: 'Eyedropper', icon: Eye, shortcut: 'I' },
];

export const TiledSidebar: React.FC<TiledSidebarProps> = ({
  onWidthChange,
  onElementSelect,
  selectedTool,
  onToolChange,
}) => {
  const [assets, setAssets] = useState<AssetElement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        // Load machine assets
        const machineFiles = [
          '0a430dd7-57d1-4698-96a1-8fe2e9f02817.png',
          '0a430dd7-57d1-4698-96a1-8fe2e9f02817(1).png',
          'fad8efee-6161-4017-bb74-aa7428b5bd6e.png',
          'f96038bb-fed0-4073-804e-4416576626c9.png',
          'ddd39db5-0799-4666-a3fd-f66a8fed85bb.png',
          'ccbaa875-c393-4112-b480-b41147de3c91.png',
          'c3445ec4-9df5-44a3-83a9-45dbdd0fccab.png',
          'bf140bd1-728d-43df-a9d1-441f6535ae8e.png',
          'af43a744-ac8a-43e4-902b-4df318ca796e.png',
          'adf95a49-8831-43e1-9fa0-76932d88460b.png',
          '8aa9c3e9-c323-4f7d-9e9a-bd72142755ed.png',
          '7355604c-6e6c-4410-a5c2-f80ecb6de89a.png',
          '6caddc03-e728-4880-8d6d-fb1d528a1713.png',
          '59270724-a2eb-476a-be28-4c9a9b48d825.png',
          '552087b3-3853-481b-812e-ecbcd98bde52.png',
          '552087b3-3853-481b-812e-ecbcd98bde52(1).png',
          '4a2fd254-e880-4306-9a5b-b2f8898a9038.png',
          '457ff1a6-1e35-455a-b3d8-28bf4e631a9e.png',
          '44d84642-c405-4b66-9b95-12586c487056.png',
          '1c7877de-3406-4e0b-9f79-7228b3c1932e.png',
        ];

        const machineAssets: AssetElement[] = machineFiles.map(
          (fileName, index) => ({
            id: `machine-${index}`,
            name: fileName.replace(/\.[^/.]+$/, '').replace(/[()]/g, ''),
            imageUrl: `/machines/${fileName}`,
            fileName,
            category: 'machines',
          })
        );

        // Load furniture assets
        const furnitureFiles = [
          'chair-brown.svg',
          'desk-office.svg',
          'bookshelf.svg',
          'sofa-gray.svg',
          'table-wooden.svg',
        ];

        const furnitureAssets: AssetElement[] = furnitureFiles.map(
          (fileName, index) => ({
            id: `furniture-${index}`,
            name: fileName.replace(/\.[^/.]+$/, '').replace(/-/g, ' '),
            imageUrl: `/assets/furniture/${fileName}`,
            fileName,
            category: 'furniture',
          })
        );

        const allAssets = [...machineAssets, ...furnitureAssets];
        setAssets(allAssets);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load assets:', error);
        setIsLoading(false);
      }
    };

    loadAssets();
  }, []);

  // Handle resize
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 400) {
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  const categories = ['all', 'machines', 'furniture'];
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || asset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDragStart = (e: React.DragEvent, asset: AssetElement) => {
    e.dataTransfer.setData('application/json', JSON.stringify(asset));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="h-full flex relative">
      <div className="flex-1 flex flex-col">
        {/* Tools Section */}
        <div className="p-3 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Tools</h3>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onToolChange(tool.id)}
                className={`p-2 rounded text-xs transition-colors ${
                  selectedTool === tool.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title={`${tool.name} (${tool.shortcut})`}
              >
                <tool.icon className="w-4 h-4 mx-auto" />
              </button>
            ))}
          </div>
        </div>

        {/* Assets Section */}
        <div className="p-3 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-semibold text-white">Assets</h3>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 bg-gray-800 border border-gray-600 rounded text-xs text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-1 mb-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Asset Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="text-center text-gray-400 py-8 text-sm">
              Loading assets...
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative cursor-pointer rounded border-2 border-gray-600 hover:border-gray-500 bg-gray-800/50 hover:bg-gray-800 transition-all duration-200 overflow-hidden"
                  onClick={() => onElementSelect(asset)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, asset)}
                >
                  {/* Image Container */}
                  <div className="aspect-square p-2 flex items-center justify-center">
                    <img
                      src={asset.imageUrl}
                      alt={asset.name}
                      className="max-w-full max-h-full object-contain filter group-hover:brightness-110 transition-all"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>

                  {/* Name Label */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                    <p
                      className="text-xs text-white font-medium truncate"
                      title={asset.name}
                    >
                      {asset.name.length > 12
                        ? `${asset.name.substring(0, 12)}...`
                        : asset.name}
                    </p>
                  </div>

                  {/* Drag Indicator */}
                  <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold bg-black/50 px-1 py-0.5 rounded">
                      Drag
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredAssets.length === 0 && (
            <div className="text-center text-gray-400 py-8 text-sm">
              No assets found matching "{searchTerm}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700 text-xs text-gray-400">
          {assets.length} assets • {filteredAssets.length} visible
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="w-1 bg-gray-700 hover:bg-gray-600 cursor-col-resize flex-shrink-0"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};
