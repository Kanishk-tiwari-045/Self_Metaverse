import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { MapTemplateSelector } from '../components/MapTemplateSelector';
import { MapsGrid } from '../components/dashboard/MapsGrid';
import { CreateMapModal } from '../components/dashboard/CreateMapModal';
import { EnterCodeModal } from '../components/dashboard/EnterCodeModal';
import { Plus, Key } from 'lucide-react';

interface MapSpace {
  id: number;
  name: string;
  dimensions: string;
  ownerId?: number;
  isOwner: boolean;
  thumbnail?: string | null;
  owner?: string;
}

export const NewDashboardPage = () => {
  const { token, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [recentMaps, setRecentMaps] = useState<MapSpace[]>([]);
  const [myMaps, setMyMaps] = useState<MapSpace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recent' | 'my-maps'>('recent');
  const [showCreateMapModal, setShowCreateMapModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showEnterCodeModal, setShowEnterCodeModal] = useState(false);
  const [isCreatingMap, setIsCreatingMap] = useState(false);
  const [enterCode, setEnterCode] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  const [newMap, setNewMap] = useState({
    name: '',
    width: 100,
    height: 100,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      const loadData = async () => {
        try {
          await Promise.all([fetchRecentMaps(), fetchMyMaps()]);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [isAuthenticated, user]);

  const fetchRecentMaps = async () => {
    try {
      // Fetch only maps that the user has actually joined
      const joinedMapsResponse = await fetch(
        'http://localhost:3000/api/v1/user/joined-maps',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const recentItems: MapSpace[] = [];

      if (joinedMapsResponse.ok) {
        const joinedData = await joinedMapsResponse.json();
        const formattedMaps = (joinedData.maps || []).map((map: any) => ({
          id: map.id,
          name: map.name || 'Untitled Map',
          dimensions:
            map.dimensions || `${map.width || 100}x${map.height || 100}`,
          ownerId: map.ownerId,
          isOwner: map.isOwner,
          thumbnail: map.thumbnail,
          owner: map.owner,
        }));
        recentItems.push(...formattedMaps);
      }

      setRecentMaps(recentItems);
    } catch (error) {
      console.error('Failed to fetch recent maps:', error);
      setRecentMaps([]);
    }
  };

  const fetchMyMaps = async () => {
    try {
      let endpoint = '';

      if (user?.role === 'admin') {
        endpoint = 'http://localhost:3000/api/v1/admin/maps';
      } else {
        endpoint = 'http://localhost:3000/api/v1/user/owned-maps';
      }

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const mapsArray = data.maps || data || [];
        const formattedMaps = mapsArray.map((map: any) => ({
          id: map.id,
          name: map.name || 'Untitled Map',
          dimensions: map.dimensions || `${map.width}x${map.height}`,
          ownerId: map.ownerId || parseInt(user?.id || '0'),
          isOwner: true,
          thumbnail: map.thumbnail,
          accessCode: map.accessCode,
          isTemplate: map.isTemplate,
        }));
        setMyMaps(formattedMaps);
      } else {
        setMyMaps([]);
      }
    } catch (error) {
      console.error('Failed to fetch my maps:', error);
      setMyMaps([]);
    }
  };

  const handleCreateMapClick = () => {
    if (user?.role === 'admin') {
      // Admins get the direct create modal
      setShowCreateMapModal(true);
    } else {
      // Regular users get template selector first
      setShowTemplateSelector(true);
    }
  };

  const handleTemplateCopied = () => {
    // Refresh the maps lists after a template is copied
    Promise.all([fetchRecentMaps(), fetchMyMaps()]);
  };

  const handleCreateMap = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingMap(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const isTemplate = formData.get('isTemplate') === 'on';

      const requestBody: any = {
        name: newMap.name,
        dimensions: `${newMap.width}x${newMap.height}`,
        defaultElements: [],
      };

      // Add template info for regular users
      if (selectedTemplate) {
        requestBody.templateId = selectedTemplate;
      }

      // For admin maps: if it's a template, don't add access code
      // If it's not a template, add access code for sharing
      if (user?.role === 'admin') {
        if (isTemplate) {
          // Templates don't need access codes
          requestBody.isTemplate = true;
        } else {
          // Regular admin maps that can be shared
          requestBody.accessCode = Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase();
          requestBody.isTemplate = false;
        }
      } else {
        // Regular user maps always get access codes for sharing
        requestBody.accessCode = Math.random()
          .toString(36)
          .substring(2, 10)
          .toUpperCase();
      }

      const endpoint =
        user?.role === 'admin'
          ? 'http://localhost:3000/api/v1/admin/map'
          : 'http://localhost:3000/api/v1/user/map';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        setShowCreateMapModal(false);
        setNewMap({ name: '', width: 100, height: 100 });
        setSelectedTemplate(null);

        // Show different success messages
        if (user?.role === 'admin' && isTemplate) {
          alert(
            `Template created successfully! Users can now use this template.`
          );
        } else {
          alert(
            `Map created successfully! Access code: ${requestBody.accessCode}`
          );
        }

        // Refresh both lists
        await Promise.all([fetchRecentMaps(), fetchMyMaps()]);
      } else {
        alert('Failed to create map');
      }
    } catch (error) {
      console.error('Failed to create map:', error);
      alert('Network error');
    } finally {
      setIsCreatingMap(false);
    }
  };

  const handleEnterWithCode = async () => {
    if (enterCode.trim()) {
      try {
        // Use the access code endpoint to find the map
        const response = await fetch(
          `http://localhost:3000/api/v1/maps/map/code/${enterCode.trim()}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const mapData = await response.json();
          // Record the visit and navigate to the map
          await fetch('http://localhost:3000/api/v1/user/visit-map', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ mapId: mapData.id }),
          });

          navigate(`/map/${mapData.id}`);
          setShowEnterCodeModal(false);
          setEnterCode('');
        } else {
          alert('Invalid access code. Please check and try again.');
        }
      } catch (error) {
        console.error('Failed to join map:', error);
        alert('Failed to join map. Please try again.');
      }
    }
  };

  const handleMapClick = (mapId: number) => {
    // Everyone (including owners) goes to play/view mode when clicking a map
    navigate(`/map/${mapId}`);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Top Section with Tabs and Buttons */}
        <div className="flex justify-between items-center mb-8">
          {/* Tabs */}
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('recent')}
              className={`pb-2 text-lg font-medium border-b-2 transition-colors ${
                activeTab === 'recent'
                  ? 'text-white border-blue-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setActiveTab('my-maps')}
              className={`pb-2 text-lg font-medium border-b-2 transition-colors ${
                activeTab === 'my-maps'
                  ? 'text-white border-blue-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              My Maps
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setShowEnterCodeModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors text-white"
            >
              <Key className="w-4 h-4" />
              Enter with Code
            </button>
            <button
              onClick={handleCreateMapClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Map
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <MapsGrid maps={[]} isLoading={true} onMapClick={handleMapClick} />
        ) : (
          <>
            {/* Maps Grid */}
            {(activeTab === 'recent' ? recentMaps : myMaps).length > 0 ? (
              <MapsGrid
                maps={activeTab === 'recent' ? recentMaps : myMaps}
                isLoading={false}
                onMapClick={handleMapClick}
              />
            ) : (
              /* Empty State - Dark mode */
              <div className="h-64 flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <p className="text-lg">
                    {activeTab === 'recent' ? 'No recent maps' : 'No maps yet'}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Template Selector for Regular Users */}
      <MapTemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onTemplateCopied={handleTemplateCopied}
      />

      {/* Create Map Modal */}
      <CreateMapModal
        isOpen={showCreateMapModal}
        onClose={() => {
          setShowCreateMapModal(false);
          setSelectedTemplate(null);
        }}
        onSubmit={handleCreateMap}
        newMap={newMap}
        setNewMap={setNewMap}
        selectedTemplate={selectedTemplate}
        isCreatingMap={isCreatingMap}
        userRole={user?.role}
      />

      {/* Enter with Code Modal */}
      <EnterCodeModal
        isOpen={showEnterCodeModal}
        onClose={() => setShowEnterCodeModal(false)}
        onSubmit={handleEnterWithCode}
        enterCode={enterCode}
        setEnterCode={setEnterCode}
      />
    </div>
  );
};
