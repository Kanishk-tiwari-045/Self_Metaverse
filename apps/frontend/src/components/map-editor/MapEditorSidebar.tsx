import React, { useState } from 'react';
import {
  Users,
  Search,
  Archive,
  Users2,
  Lamp,
  Monitor,
  Sofa,
  MoreHorizontal,
} from 'lucide-react';

interface MapElement {
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

interface Space {
  id: number;
  name: string;
  width: number;
  height: number;
  dimensions: string;
}

interface MapSpace {
  id: number;
  spaceId: number;
  x: number;
  y: number;
  spaceName: string;
}

interface MapEditorSidebarProps {
  activeTab: 'elements' | 'spaces';
  setActiveTab: (tab: 'elements' | 'spaces') => void;
  availableElements: Element[];
  availableSpaces: Space[];
  selectedElement: Element | null;
  selectedSpace: Space | null;
  setSelectedElement: (element: Element | null) => void;
  setSelectedSpace: (space: Space | null) => void;
  map: {
    elements?: MapElement[];
    mapSpaces?: MapSpace[];
  } | null;
  handleDeleteElement: (elementId: number) => void;
  handleDeleteMapSpace: (mapSpaceId: number) => void;
}

export const MapEditorSidebar: React.FC<MapEditorSidebarProps> = ({
  availableElements,
  availableSpaces,
  selectedElement,
  selectedSpace,
  setSelectedElement,
  setSelectedSpace,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', icon: Archive, label: 'All' },
    { id: 'furniture', icon: Sofa, label: 'Furniture' },
    { id: 'tech', icon: Monitor, label: 'Tech' },
    { id: 'decor', icon: Lamp, label: 'Decor' },
    { id: 'spaces', icon: Users2, label: 'Spaces' },
    { id: 'more', icon: MoreHorizontal, label: 'More' },
  ];

  // Filter elements and spaces based on search term
  const filteredElements = availableElements.filter((element) =>
    `Element #${element.id}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSpaces = availableSpaces.filter((space) =>
    space.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed left-12 top-0 h-full w-80 bg-white border-r border-gray-200 flex shadow-lg z-40">
      {/* Main Sidebar Content */}
      <div className="flex-1 flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for objects"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs">
                Wall decor
              </div>
            )}
          </div>
        </div>

        {/* Category Icons */}
        <div className="flex justify-center gap-2 p-4 border-b border-gray-200">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-2 rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={category.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto">
          {/* Elements and Spaces Grid */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Show filtered spaces first */}
              {filteredSpaces.map((space) => (
                <div
                  key={`space-${space.id}`}
                  onClick={() => {
                    setSelectedSpace(space);
                    setSelectedElement(null);
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    selectedSpace?.id === space.id
                      ? 'bg-blue-100 border-blue-300'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {/* Space Thumbnail */}
                  <div className="w-full h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mb-2 flex items-center justify-center">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 text-center">
                    {space.name}
                  </p>
                </div>
              ))}

              {/* Show filtered elements */}
              {filteredElements.map((element) => (
                <div
                  key={`element-${element.id}`}
                  onClick={() => {
                    setSelectedElement(element);
                    setSelectedSpace(null);
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    selectedElement?.id === element.id
                      ? 'bg-purple-100 border-purple-300'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {/* Element Thumbnail */}
                  <div className="w-full h-20 bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                    <img
                      src={element.imageUrl}
                      alt={`Element #${element.id}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-900 text-center">
                    Element #{element.id}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Item Info at Bottom */}
        {(selectedElement || selectedSpace) && (
          <div className="p-4 bg-gray-100 border-t border-gray-200">
            <p className="text-gray-900 text-sm font-medium mb-1">Selected:</p>
            <p className="text-gray-600 text-sm">
              {selectedElement
                ? `Element #${selectedElement.id} (${selectedElement.width}×${selectedElement.height})`
                : `${selectedSpace?.name} (${selectedSpace?.width}×${selectedSpace?.height})`}
            </p>
            <button
              onClick={() => {
                setSelectedElement(null);
                setSelectedSpace(null);
              }}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              Click to deselect
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
