import React from 'react';
import {
  Menu,
  Save,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid3X3,
  Eye,
  EyeOff,
} from 'lucide-react';

interface SimpleToolbarProps {
  onToggleSidebar: () => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showElements: boolean;
  onToggleElements: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const SimpleToolbar: React.FC<SimpleToolbarProps> = ({
  onToggleSidebar,
  onSave,
  onUndo,
  onRedo,
  onClear,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  showGrid,
  onToggleGrid,
  showElements,
  onToggleElements,
  canUndo,
  canRedo,
}) => {
  return (
    <div className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center gap-2">
      {/* Left side - Main actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="Toggle Machine Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-gray-600 mx-2" />

        <button
          onClick={onSave}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          title="Save Map"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>

      {/* Center - Edit actions */}
      <div className="flex items-center gap-1 ml-4">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-2 rounded-lg transition-colors ${
            canUndo
              ? 'text-gray-300 hover:text-white hover:bg-gray-700'
              : 'text-gray-600 cursor-not-allowed'
          }`}
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-2 rounded-lg transition-colors ${
            canRedo
              ? 'text-gray-300 hover:text-white hover:bg-gray-700'
              : 'text-gray-600 cursor-not-allowed'
          }`}
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-600 mx-2" />

        <button
          onClick={onClear}
          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors"
          title="Clear All Elements"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Right side - View controls */}
      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={onToggleGrid}
          className={`p-2 rounded-lg transition-colors ${
            showGrid
              ? 'text-blue-400 bg-blue-900/30 hover:bg-blue-900/50'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
          }`}
          title="Toggle Grid"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleElements}
          className={`p-2 rounded-lg transition-colors ${
            showElements
              ? 'text-green-400 bg-green-900/30 hover:bg-green-900/50'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
          }`}
          title="Toggle Elements Visibility"
        >
          {showElements ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </button>

        <div className="w-px h-6 bg-gray-600 mx-2" />

        <button
          onClick={onZoomOut}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={onResetZoom}
          className="px-2 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-sm font-mono min-w-[3rem] text-center"
          title="Reset Zoom (100%)"
        >
          100%
        </button>

        <button
          onClick={onZoomIn}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={onResetZoom}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
