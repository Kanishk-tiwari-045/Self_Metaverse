import React, { useState, useEffect } from 'react';
import { Package, Search, X } from 'lucide-react';

interface MachineElement {
  id: string;
  name: string;
  imageUrl: string;
  fileName: string;
}

interface MachinesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMachine: MachineElement | null;
  onSelectMachine: (machine: MachineElement) => void;
}

export const MachinesSidebar: React.FC<MachinesSidebarProps> = ({
  isOpen,
  onClose,
  selectedMachine,
  onSelectMachine,
}) => {
  const [machines, setMachines] = useState<MachineElement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMachines = async () => {
      try {
        // Get list of machine images from the machines folder
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

        const machineElements: MachineElement[] = machineFiles.map(
          (fileName, index) => ({
            id: `machine-${index}`,
            name: fileName.replace(/\.[^/.]+$/, '').replace(/[()]/g, ''), // Remove extension and parentheses
            imageUrl: `/machines/${fileName}`,
            fileName,
          })
        );

        setMachines(machineElements);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load machines:', error);
        setIsLoading(false);
      }
    };

    loadMachines();
  }, []);

  const filteredMachines = machines.filter((machine) =>
    machine.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMachineClick = (machine: MachineElement) => {
    onSelectMachine(machine);
  };

  const handleDragStart = (e: React.DragEvent, machine: MachineElement) => {
    e.dataTransfer.setData('application/json', JSON.stringify(machine));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-transform duration-300 z-10 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      style={{ width: '280px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold">Machine Elements</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search machines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Machines Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center text-gray-400 py-8">
            Loading machines...
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredMachines.map((machine) => (
              <div
                key={machine.id}
                className={`group relative cursor-pointer rounded-lg border-2 transition-all duration-200 overflow-hidden ${
                  selectedMachine?.id === machine.id
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-600 hover:border-gray-500 bg-gray-800/50 hover:bg-gray-800'
                }`}
                onClick={() => handleMachineClick(machine)}
                draggable
                onDragStart={(e) => handleDragStart(e, machine)}
              >
                {/* Image Container */}
                <div className="aspect-square p-3 flex items-center justify-center">
                  <img
                    src={machine.imageUrl}
                    alt={machine.name}
                    className="max-w-full max-h-full object-contain filter group-hover:brightness-110 transition-all"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>

                {/* Name Label */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p
                    className="text-xs text-white font-medium truncate"
                    title={machine.name}
                  >
                    {machine.name.length > 15
                      ? `${machine.name.substring(0, 15)}...`
                      : machine.name}
                  </p>
                </div>

                {/* Selection Indicator */}
                {selectedMachine?.id === machine.id && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                  </div>
                )}

                {/* Drag Indicator */}
                <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">
                    Drag to place
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredMachines.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            No machines found matching "{searchTerm}"
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
        {machines.length} machines available • Drag to place on map
      </div>
    </div>
  );
};
