import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MapSpace {
  id: number;
  name: string;
  dimensions: string;
  ownerId?: number;
  isOwner: boolean;
  thumbnail?: string | null;
  owner?: string;
}

interface MapCardProps {
  map: MapSpace;
  onClick: (mapId: number, isOwner: boolean) => void;
}

export const MapCard: React.FC<MapCardProps> = ({ map, onClick }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div
      className="group cursor-pointer"
      onClick={() => onClick(map.id, map.isOwner)}
    >
      {/* Map Thumbnail with 16:9 aspect ratio */}
      <div
        className="relative mb-3 overflow-hidden transform hover:scale-105 hover:shadow-xl transition-all duration-300 ease-out group"
        style={{
          aspectRatio: '16 / 9',
          backgroundImage: `url('/assets/maps_thumbnails/map1.png')`,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          borderRadius: '16px',
        }}
      >
        {/* Hover overlay with enter icon */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 ease-out flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out">
            <div className="bg-white p-3 rounded-full shadow-lg">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-gray-800"
              >
                <path
                  d="M16 12H4M16 12L10.999 7M16 12L10.999 17.001M16 4H18C19.105 4 20 4.895 20 6V18C20 19.105 19.105 20 18 20H16"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* OWNER Badge */}
        {map.isOwner && (
          <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
            👑 OWNER
          </div>
        )}
      </div>

      {/* Map Name with More Options */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white truncate flex-1">
          {map.name}
        </h3>
        <div className="relative" ref={dropdownRef}>
          <button
            className="p-1 hover:bg-slate-700 rounded transition-colors ml-2 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
          >
            <MoreHorizontal className="w-4 h-4 text-slate-400 hover:text-slate-200" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const mapUrl = `${window.location.origin}/map/${map.id}`;
                  navigator.clipboard.writeText(mapUrl);
                  alert('Map URL copied to clipboard!');
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors"
              >
                📋 Copy URL
              </button>
              {map.isOwner && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/map/${map.id}/edit`);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors"
                  >
                    ✏️ Edit Map
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        confirm(
                          `Are you sure you want to delete "${map.name}"? This action cannot be undone.`
                        )
                      ) {
                        // TODO: Implement delete functionality
                        alert('Delete functionality coming soon!');
                      }
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                  >
                    🗑️ Delete Map
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
