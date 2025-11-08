import React from 'react';
import { MapCard } from './MapCard';

interface MapSpace {
  id: number;
  name: string;
  dimensions: string;
  ownerId?: number;
  isOwner: boolean;
  thumbnail?: string | null;
  owner?: string;
}

interface MapsGridProps {
  maps: MapSpace[];
  isLoading: boolean;
  onMapClick: (mapId: number, isOwner: boolean) => void;
}

export const MapsGrid: React.FC<MapsGridProps> = ({
  maps,
  isLoading,
  onMapClick,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div
              className="bg-slate-700 rounded-2xl mb-3"
              style={{ aspectRatio: '16 / 9' }}
            ></div>
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (maps.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <p className="text-lg">No maps yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {maps.map((map) => (
        <MapCard key={map.id} map={map} onClick={onMapClick} />
      ))}
    </div>
  );
};
