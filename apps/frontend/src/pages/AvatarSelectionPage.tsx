import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shuffle, ArrowLeft, ChevronRight } from 'lucide-react';
import { AvatarPreview } from '../components/AvatarPreview';
import { AvatarData, AvatarTexture, SelectedAvatar } from '../types/avatar';
import { useAuth } from '../contexts/AuthContext';

export const AvatarSelectionPage: React.FC = () => {
  const [avatarData, setAvatarData] = useState<AvatarData | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<SelectedAvatar | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [direction, setDirection] = useState(0);
  const [currentCollectionIndex, setCurrentCollectionIndex] = useState(0);
  const [currentTextureIndex, setCurrentTextureIndex] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, token, user } = useAuth();

  // Get user data from signup page or check if user is already authenticated (from profile)
  const userData = location.state;

  useEffect(() => {
    // Allow if userData (from signup) OR user is already authenticated (from profile)
    if (!userData && !user) {
      navigate('/signup', { replace: true });
      return;
    }
    loadAvatarData();
  }, [userData, user, navigate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!avatarData) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          navigateWithKeyboard('left');
          break;
        case 'ArrowRight':
          event.preventDefault();
          navigateWithKeyboard('right');
          break;
        case 'ArrowUp':
          event.preventDefault();
          navigateWithKeyboard('up');
          break;
        case 'ArrowDown':
          event.preventDefault();
          navigateWithKeyboard('down');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [avatarData, currentCollectionIndex, currentTextureIndex]);

  const loadAvatarData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3000/api/v1/avatars');

      if (!response.ok) {
        throw new Error('Failed to load avatar data');
      }

      const data: AvatarData = await response.json();
      setAvatarData(data);

      // Select first avatar by default
      const firstTexture = data.avatars.collections[0]?.textures[0];
      if (firstTexture) {
        setSelectedAvatar({
          id: firstTexture.id,
          textureUrl: firstTexture.url,
          name: firstTexture.name,
          gender: firstTexture.gender,
        });
        setCurrentCollectionIndex(0);
        setCurrentTextureIndex(0);
      }
    } catch (err) {
      console.error('Error loading avatar data:', err);
      setError('Failed to load avatar customization data');
    } finally {
      setIsLoading(false);
    }
  };

  const selectAvatar = (
    texture: AvatarTexture,
    collectionIndex?: number,
    textureIndex?: number
  ) => {
    setSelectedAvatar({
      id: texture.id,
      textureUrl: texture.url,
      name: texture.name,
      gender: texture.gender,
    });

    if (collectionIndex !== undefined) {
      setCurrentCollectionIndex(collectionIndex);
    }
    if (textureIndex !== undefined) {
      setCurrentTextureIndex(textureIndex);
    }
  };

  const navigateWithKeyboard = (
    direction: 'up' | 'down' | 'left' | 'right'
  ) => {
    if (!avatarData) return;

    const collection = avatarData.avatars.collections[currentCollectionIndex];
    if (!collection) return;

    const textures = collection.textures;
    const itemsPerRow = 6; // Based on grid-cols-6
    let newIndex = currentTextureIndex;

    switch (direction) {
      case 'left':
        newIndex = Math.max(0, currentTextureIndex - 1);
        break;
      case 'right':
        newIndex = Math.min(textures.length - 1, currentTextureIndex + 1);
        break;
      case 'up':
        newIndex = Math.max(0, currentTextureIndex - itemsPerRow);
        break;
      case 'down':
        newIndex = Math.min(
          textures.length - 1,
          currentTextureIndex + itemsPerRow
        );
        break;
    }

    if (newIndex !== currentTextureIndex && textures[newIndex]) {
      selectAvatar(textures[newIndex], currentCollectionIndex, newIndex);

      // Scroll the selected avatar into view
      const element = document.getElementById(
        `avatar-${textures[newIndex].id}`
      );
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  const randomizeAvatar = () => {
    if (!avatarData) return;

    const allTextures = avatarData.avatars.collections.flatMap(
      (c) => c.textures
    );
    const randomTexture =
      allTextures[Math.floor(Math.random() * allTextures.length)];
    selectAvatar(randomTexture);
  };

  const handleContinue = async () => {
    if (!selectedAvatar) return;

    try {
      setIsLoading(true);

      // Check if this is post-signup flow (userData exists) or profile flow (user already authenticated)
      if (userData) {
        // Post-signup flow: create new user with avatar selection
        const response = await fetch(
          'http://localhost:3000/api/v1/avatars/user',
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userData.userId,
              avatarId: selectedAvatar.id,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to update avatar');
        }

        // Update auth context and navigate to dashboard
        login(data.token, {
          id: data.user.id,
          username: data.user.username,
          role: data.user.role,
          avatarId: data.user.avatar?.id,
        });
        navigate('/dashboard', { replace: true });
      } else if (user) {
        // Profile flow: update existing user's avatar
        const response = await fetch(
          'http://localhost:3000/api/v1/user/avatar-info',
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              avatarId: selectedAvatar.id,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to update avatar');
        }

        // Navigate back to profile
        navigate('/profile', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update avatar');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !avatarData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl max-w-6xl w-full min-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(userData ? '/signup' : '/profile')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">
              Choose Your Avatar
            </h1>
          </div>
          {userData && <div className="text-sm text-white/70">Step 2 of 2</div>}
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <div className="flex-1 flex flex-col lg:flex-row p-6 gap-8 min-h-0">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center gap-4 lg:w-80">
            <div className="bg-white/5 rounded-2xl p-6 flex flex-col items-center gap-4">
              {selectedAvatar && (
                <AvatarPreview
                  textureUrl={selectedAvatar.textureUrl}
                  canvasSize={128}
                  direction={direction}
                  animate={false}
                  className="border-2 border-white/20 rounded-lg"
                />
              )}

              {selectedAvatar && (
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white">
                    {selectedAvatar.name}
                  </h3>
                  <p className="text-sm text-white/70 capitalize">
                    {selectedAvatar.gender}
                  </p>
                </div>
              )}

              {/* Direction Controls */}
              <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                {[0, 1, 2, 3].map((dir) => (
                  <button
                    key={dir}
                    onClick={() => setDirection(dir)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      direction === dir
                        ? 'bg-blue-500 text-white'
                        : 'text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {['Down', 'Left', 'Right', 'Up'][dir]}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={randomizeAvatar}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <Shuffle className="w-4 h-4" />
              Randomize
            </button>
          </div>

          {/* Avatar Grid */}
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-lg font-semibold text-white mb-4">
              Select Character
            </h3>
            <p className="text-sm text-white/60 mb-4">
              Use arrow keys to navigate • Click to select
            </p>

            <div className="flex-1 overflow-y-auto">
              {avatarData?.avatars.collections.map(
                (collection, collectionIndex) => (
                  <div key={collection.name} className="mb-6">
                    <h4 className="text-sm text-white/70 mb-3">
                      {collection.name}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {collection.textures.map((texture, textureIndex) => (
                        <button
                          key={texture.id}
                          id={`avatar-${texture.id}`}
                          onClick={() =>
                            selectAvatar(texture, collectionIndex, textureIndex)
                          }
                          className={`relative group bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-all ${
                            selectedAvatar?.id === texture.id
                              ? 'ring-2 ring-blue-400 bg-white/20'
                              : ''
                          }`}
                        >
                          <AvatarPreview
                            textureUrl={texture.url}
                            canvasSize={64}
                            direction={0}
                            animate={false}
                            className="w-full h-16"
                          />
                          <div className="mt-2 text-xs text-white/80 text-center">
                            {texture.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/20">
          <div className="flex justify-between">
            <button
              onClick={() => navigate(userData ? '/signup' : '/profile')}
              className="px-6 py-3 text-white/70 hover:text-white transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleContinue}
              disabled={!selectedAvatar || isLoading}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  {userData ? 'Creating Account...' : 'Saving Avatar...'}
                </>
              ) : (
                <>
                  {userData ? (
                    <>
                      Continue to Dashboard
                      <ChevronRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Save Avatar
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
