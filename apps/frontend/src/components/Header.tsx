import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/signin');
    setShowDropdown(false);
  };

  const handleAdminPanel = () => {
    navigate('/admin');
    setShowDropdown(false);
  };

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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        {/* Logo */}
        <div
          className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/dashboard')}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white"
          >
            <circle cx="6" cy="6" r="2" fill="currentColor" />
            <circle cx="18" cy="6" r="2" fill="currentColor" />
            <circle cx="6" cy="18" r="2" fill="currentColor" />
            <circle cx="18" cy="18" r="2" fill="currentColor" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
            <line
              x1="8"
              y1="6"
              x2="10"
              y2="12"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="14"
              y1="12"
              x2="16"
              y2="6"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="8"
              y1="18"
              x2="10"
              y2="12"
              stroke="currentColor"
              strokeWidth="2"
            />

            <line
              x1="14"
              y1="12"
              x2="16"
              y2="18"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Right section with Username and Create Space Button */}
        <div className="flex items-center gap-4">
          {/* Username with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              {user?.username + ' ▼'}
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-gray-700 rounded-lg shadow-lg border border-gray-600 z-50">
                <div className="py-2">
                  <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-600">
                    <div>{user?.username}</div>
                    {isAdmin && (
                      <div className="text-blue-400 text-xs">Admin</div>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={handleAdminPanel}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
                    >
                      Admin Panel
                    </button>
                  )}
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
