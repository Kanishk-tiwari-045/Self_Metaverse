import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import {
  Package,
  Image,
  ArrowLeft,
  Globe,
  Settings,
  Trash2,
} from 'lucide-react';

interface AdminElement {
  id: number;
  width: number;
  height: number;
  imageUrl: string;
  isStatic: boolean;
}

interface AdminAvatar {
  id: number;
  name: string;
  imageUrl: string;
}

interface AdminSpace {
  id: number;
  name: string;
  dimensions: string;
  ownerId: number;
}

export const AdminPanelPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'elements' | 'avatars' | 'spaces'>(
    'elements'
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Resource state
  const [elements, setElements] = useState<AdminElement[]>([]);
  const [avatars, setAvatars] = useState<AdminAvatar[]>([]);
  const [spaces, setSpaces] = useState<AdminSpace[]>([]);

  // Element Form State
  const [elementForm, setElementForm] = useState({
    imageUrl: '',
    width: 1,
    height: 1,
    static: false,
  });

  // Avatar Form State
  const [avatarForm, setAvatarForm] = useState({
    name: '',
    imageUrl: '',
  });

  // Space Form State
  const [spaceForm, setSpaceForm] = useState({
    name: '',
    width: 20,
    height: 20,
  });

  // Fetch admin's resources
  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const [elementsRes, avatarsRes, spacesRes] = await Promise.all([
        fetch('http://localhost:3000/api/v1/admin/elements', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3000/api/v1/admin/avatars', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3000/api/v1/space/all', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (elementsRes.ok) {
        const elementsData = await elementsRes.json();
        setElements(elementsData);
      }

      if (avatarsRes.ok) {
        const avatarsData = await avatarsRes.json();
        setAvatars(avatarsData);
      }

      if (spacesRes.ok) {
        const spacesData = await spacesRes.json();
        setSpaces(spacesData.spaces || []);
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleCreateElement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch(
        'http://localhost:3000/api/v1/admin/element',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(elementForm),
        }
      );

      if (response.ok) {
        alert('Element created successfully!');
        setShowCreateModal(false);
        setElementForm({ imageUrl: '', width: 1, height: 1, static: false });
        fetchResources(); // Refresh the list
      } else {
        alert('Failed to create element');
      }
    } catch (error) {
      console.error('Error creating element:', error);
      alert('Network error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch(
        'http://localhost:3000/api/v1/admin/avatar',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(avatarForm),
        }
      );

      if (response.ok) {
        alert('Avatar created successfully!');
        setShowCreateModal(false);
        setAvatarForm({ name: '', imageUrl: '' });
        fetchResources(); // Refresh the list
      } else {
        alert('Failed to create avatar');
      }
    } catch (error) {
      console.error('Error creating avatar:', error);
      alert('Network error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('http://localhost:3000/api/v1/space', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: spaceForm.name,
          dimensions: `${spaceForm.width}x${spaceForm.height}`,
        }),
      });

      if (response.ok) {
        alert('Space created successfully!');
        setShowCreateModal(false);
        setSpaceForm({ name: '', width: 20, height: 20 });
        fetchResources(); // Refresh the list
      } else {
        alert('Failed to create space');
      }
    } catch (error) {
      console.error('Error creating space:', error);
      alert('Network error');
    } finally {
      setIsCreating(false);
    }
  };

  // Handler functions for space actions
  const handleJoinSpace = (spaceId: number) => {
    navigate(`/space/${spaceId}`);
  };

  const handleSpaceSettings = (spaceId: number) => {
    navigate(`/space/${spaceId}/edit`);
  };

  const handleDeleteSpace = async (spaceId: number) => {
    if (!confirm('Are you sure you want to delete this space?')) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/space/${spaceId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        alert('Space deleted successfully!');
        fetchResources(); // Refresh the list
      } else {
        alert('Failed to delete space');
      }
    } catch (error) {
      console.error('Error deleting space:', error);
      alert('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-slate-300 hover:text-white flex items-center gap-2 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Content Management
          </h2>
          <p className="text-slate-400">
            Create and manage elements, avatars, and spaces for the metaverse
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-slate-800 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('elements')}
            className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
              activeTab === 'elements'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            Elements
          </button>
          <button
            onClick={() => setActiveTab('avatars')}
            className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
              activeTab === 'avatars'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Image className="w-4 h-4" />
            Avatars
          </button>
          <button
            onClick={() => setActiveTab('spaces')}
            className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
              activeTab === 'spaces'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            Spaces
          </button>
        </div>

        {/* Content */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg">
          <div className="p-6 border-b border-slate-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">
                {activeTab === 'elements' && 'Space Elements'}
                {activeTab === 'avatars' && 'User Avatars'}
                {activeTab === 'spaces' && 'User Spaces'}
              </h3>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create New
              </button>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12 text-slate-400">
                <p>Loading {activeTab}...</p>
              </div>
            ) : (
              <>
                {/* Elements List */}
                {activeTab === 'elements' && (
                  <div className="space-y-4">
                    {elements.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <p>No elements created yet</p>
                        <p className="text-sm mt-2">
                          Click "Create New" to add your first element
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {elements.map((element) => (
                          <div
                            key={element.id}
                            className="bg-slate-700 rounded-lg p-4 border border-slate-600"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium">
                                Element #{element.id}
                              </span>
                              <span
                                className={`px-2 py-1 text-xs rounded ${
                                  element.isStatic
                                    ? 'bg-red-500 text-white'
                                    : 'bg-green-500 text-white'
                                }`}
                              >
                                {element.isStatic ? 'Static' : 'Walkable'}
                              </span>
                            </div>
                            <p className="text-slate-300 text-sm">
                              Size: {element.width}x{element.height}
                            </p>
                            {element.imageUrl && (
                              <p className="text-slate-400 text-xs mt-1 truncate">
                                Image: {element.imageUrl}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Avatars List */}
                {activeTab === 'avatars' && (
                  <div className="space-y-4">
                    {avatars.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <p>No avatars created yet</p>
                        <p className="text-sm mt-2">
                          Click "Create New" to add your first avatar
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {avatars.map((avatar) => (
                          <div
                            key={avatar.id}
                            className="bg-slate-700 rounded-lg p-4 border border-slate-600"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium">
                                {avatar.name}
                              </span>
                              <span className="text-slate-400 text-sm">
                                #{avatar.id}
                              </span>
                            </div>
                            {avatar.imageUrl && (
                              <p className="text-slate-400 text-xs truncate">
                                {avatar.imageUrl}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Spaces List */}
                {activeTab === 'spaces' && (
                  <div className="space-y-4">
                    {spaces.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <p>No spaces created yet</p>
                        <p className="text-sm mt-2">
                          Click "Create New" to add your first space
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {spaces.map((space) => (
                          <div
                            key={space.id}
                            className="bg-slate-700 rounded-lg p-4 border border-slate-600"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium">
                                {space.name}
                              </span>
                              <span className="text-slate-400 text-sm">
                                #{space.id}
                              </span>
                            </div>
                            <p className="text-slate-300 text-sm mb-3">
                              Dimensions: {space.dimensions}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleJoinSpace(space.id)}
                                className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm"
                              >
                                Join Space
                              </button>
                              <button
                                onClick={() => handleSpaceSettings(space.id)}
                                className="p-2 text-slate-400 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
                                title="Settings"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSpace(space.id)}
                                className="p-2 text-slate-400 hover:text-red-400 border border-slate-600 rounded-lg hover:bg-red-900/20 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
          <div className="bg-slate-800 rounded-xl max-w-md w-full p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              Create New{' '}
              {activeTab === 'elements'
                ? 'Element'
                : activeTab === 'avatars'
                  ? 'Avatar'
                  : 'Space'}
            </h3>

            {activeTab === 'elements' && (
              <form onSubmit={handleCreateElement} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={elementForm.imageUrl}
                    onChange={(e) =>
                      setElementForm({
                        ...elementForm,
                        imageUrl: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white placeholder-slate-400"
                    placeholder="https://example.com/element.png"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Width
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={elementForm.width}
                      onChange={(e) =>
                        setElementForm({
                          ...elementForm,
                          width: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Height
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={elementForm.height}
                      onChange={(e) =>
                        setElementForm({
                          ...elementForm,
                          height: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="static"
                    checked={elementForm.static}
                    onChange={(e) =>
                      setElementForm({
                        ...elementForm,
                        static: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-slate-700 border-slate-600"
                  />
                  <label htmlFor="static" className="text-sm text-slate-300">
                    Static (non-walkable)
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2 px-4 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'avatars' && (
              <form onSubmit={handleCreateAvatar} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Avatar Name
                  </label>
                  <input
                    type="text"
                    value={avatarForm.name}
                    onChange={(e) =>
                      setAvatarForm({ ...avatarForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white placeholder-slate-400"
                    placeholder="Cool Avatar"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={avatarForm.imageUrl}
                    onChange={(e) =>
                      setAvatarForm({ ...avatarForm, imageUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white placeholder-slate-400"
                    placeholder="https://example.com/avatar.png"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2 px-4 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'spaces' && (
              <form onSubmit={handleCreateSpace} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Space Name
                  </label>
                  <input
                    type="text"
                    value={spaceForm.name}
                    onChange={(e) =>
                      setSpaceForm({ ...spaceForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white placeholder-slate-400"
                    placeholder="My Awesome Space"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Width
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      value={spaceForm.width}
                      onChange={(e) =>
                        setSpaceForm({
                          ...spaceForm,
                          width: parseInt(e.target.value) || 20,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white placeholder-slate-400"
                      placeholder="20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Height
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      value={spaceForm.height}
                      onChange={(e) =>
                        setSpaceForm({
                          ...spaceForm,
                          height: parseInt(e.target.value) || 20,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white placeholder-slate-400"
                      placeholder="20"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2 px-4 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
