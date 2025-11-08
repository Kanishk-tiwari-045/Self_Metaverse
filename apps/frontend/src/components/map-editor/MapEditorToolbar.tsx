import React from 'react';
import {
  Undo,
  Redo,
  Send,
  HelpCircle,
  Layers,
  MousePointer,
  Paintbrush,
  Square,
  Eraser,
  Pipette,
  Move,
  Grid3X3,
} from 'lucide-react';

interface MapEditorToolbarProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const MapEditorToolbar: React.FC<MapEditorToolbarProps> = ({
  selectedTool,
  onToolSelect,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const tools = [
    { id: 'select', icon: MousePointer, title: 'Select Tool (S)' },
    { id: 'brush', icon: Paintbrush, title: 'Brush Tool (B)' },
    { id: 'bucket', icon: Square, title: 'Bucket Fill (F)' },
    { id: 'eraser', icon: Eraser, title: 'Eraser (E)' },
    { id: 'eyedropper', icon: Pipette, title: 'Eyedropper (I)' },
    { id: 'move', icon: Move, title: 'Move Tool (M)' },
  ];

  return (
    <div
      className="fixed left-0 top-0 bg-gray-800 z-50"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between',
        padding: '20px 0',
        width: '64px',
      }}
    >
      {/* Top section tools */}
      <div className="flex flex-col gap-2 items-center">
        {/* Catalog Button */}
        <button
          onClick={onToggleSidebar}
          className={`p-2 transition-colors rounded ${
            isSidebarOpen
              ? 'text-blue-400 bg-gray-700'
              : 'text-white hover:text-blue-400'
          }`}
          title="Toggle Tileset Panel"
        >
          <Layers className="w-6 h-6" />
        </button>

        <div className="w-8 h-px bg-gray-600 my-1" />

        {/* Tiled-style Tools */}
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = selectedTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => onToolSelect(tool.id)}
              className={`p-2 transition-colors rounded ${
                isActive
                  ? 'text-blue-400 bg-gray-700'
                  : 'text-white hover:text-blue-400 hover:bg-gray-700'
              }`}
              title={tool.title}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}

        <div className="w-8 h-px bg-gray-600 my-1" />

        {/* Grid Toggle */}
        <button
          onClick={() => onToolSelect('grid')}
          className={`p-2 transition-colors rounded ${
            selectedTool === 'grid'
              ? 'text-blue-400 bg-gray-700'
              : 'text-white hover:text-blue-400 hover:bg-gray-700'
          }`}
          title="Toggle Grid (G)"
        >
          <Grid3X3 className="w-5 h-5" />
        </button>

        {/* Undo/Redo */}
        <button
          onClick={() => onToolSelect('undo')}
          className="p-2 transition-colors text-white hover:text-blue-400 hover:bg-gray-700 rounded"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-5 h-5" />
        </button>

        <button
          onClick={() => onToolSelect('redo')}
          className="p-2 transition-colors text-white hover:text-blue-400 hover:bg-gray-700 rounded"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom section tools */}
      <div className="flex flex-col gap-4 items-center">
        <button
          onClick={() => onToolSelect('send')}
          className={`p-2 transition-colors rounded ${
            selectedTool === 'send'
              ? 'text-blue-400'
              : 'text-white hover:text-blue-400'
          }`}
          title="Send"
        >
          <Send className="w-6 h-6" />
        </button>

        <button
          onClick={() => onToolSelect('help')}
          className={`p-2 transition-colors rounded ${
            selectedTool === 'help'
              ? 'text-blue-400'
              : 'text-white hover:text-blue-400'
          }`}
          title="Help"
        >
          <HelpCircle className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
