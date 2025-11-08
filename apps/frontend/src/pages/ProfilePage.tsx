import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { AvatarPreview } from '../components/AvatarPreview';

interface ProfileData {
  id: number;
  username: string;
  role: 'admin' | 'user';
  avatarId: number | null;
  avatar: {
    id: number;
    imageUrl: string;
    name: string;
  } | null;
  createdAt: string;
  activityLast7Days: number;
  stats: {
    spacesCreated: number;
    mapsCreated: number;
    elementsCreated: number;
  };
}

export const ProfilePage: React.FC = () => {
  const { token, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Password update states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete account states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await fetch(
        'http://localhost:3000/api/v1/user/profile',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to fetch profile data (${response.status})`
        );
      }

      const data = await response.json();
      setProfileData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch(
        'http://localhost:3000/api/v1/user/password',
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update password');
      }

      alert('Password updated successfully');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : 'An error occurred'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch(
        'http://localhost:3000/api/v1/user/account',
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      alert('Account deleted successfully');
      logout();
      navigate('/signin');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-white text-xl">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-red-400 text-xl">
            Error: {error || 'Failed to load profile'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Profile Header */}
        <div className="card-gather p-8 mb-8">
          <div className="flex items-start gap-8">
            {/* Avatar Display */}
            <div className="flex-shrink-0">
              {profileData.avatar && profileData.avatar.imageUrl ? (
                <div className="w-32 h-32 rounded-xl border-2 border-blue-500 overflow-hidden bg-slate-800 flex items-center justify-center">
                  <AvatarPreview
                    textureUrl={profileData.avatar.imageUrl}
                    canvasSize={128}
                    direction={0}
                    animate={false}
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-xl bg-slate-700 border-2 border-slate-600 flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-slate-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-grow">
              <h1 className="text-3xl font-bold text-white mb-2">
                {profileData.username}
              </h1>
              <p className="text-slate-400 text-lg mb-4">
                @{profileData.username}
              </p>

              <div className="flex items-center gap-4 mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isAdmin
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {isAdmin ? 'Admin' : 'User'}
                </span>
                <span className="text-slate-400 text-sm">
                  Member since {formatDate(profileData.createdAt)}
                </span>
              </div>

              <div className="text-slate-300 text-sm">
                Activity (Last 7 Days): {profileData.activityLast7Days} visit
                {profileData.activityLast7Days !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('/avatar-selection')}
                className="btn-gather btn-primary text-sm"
              >
                Edit Avatar
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="btn-gather btn-secondary text-sm"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Admin-only cards */}
          {isAdmin && (
            <div className="card-gather p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-400 text-sm font-medium">
                  Spaces Created
                </h3>
                <svg
                  className="w-8 h-8 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
              <div className="text-4xl font-bold text-white">
                {profileData.stats.spacesCreated}
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="card-gather p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-400 text-sm font-medium">
                  Maps Created
                </h3>
                <svg
                  className="w-8 h-8 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <div className="text-4xl font-bold text-white">
                {profileData.stats.mapsCreated}
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="card-gather p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-400 text-sm font-medium">
                  Elements Created
                </h3>
                <svg
                  className="w-8 h-8 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="text-4xl font-bold text-white">
                {profileData.stats.elementsCreated}
              </div>
            </div>
          )}
        </div>

        {/* Profile Details */}
        <div className="card-gather p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Profile Details
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-slate-700">
              <span className="text-slate-400">Username</span>
              <span className="text-white font-medium">
                {profileData.username}
              </span>
            </div>

            <div className="flex justify-between py-3 border-b border-slate-700">
              <span className="text-slate-400">Avatar Name</span>
              <span className="text-white font-medium">
                {profileData.avatar?.name || 'Not set'}
              </span>
            </div>

            {profileData.avatar && (
              <div className="flex justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400">Avatar</span>
                <span className="text-white font-medium">
                  {profileData.avatar.name}
                </span>
              </div>
            )}

            <div className="flex justify-between py-3 border-b border-slate-700">
              <span className="text-slate-400">Account Type</span>
              <span className="text-white font-medium">
                {isAdmin ? 'Administrator' : 'User'}
              </span>
            </div>

            <div className="flex justify-between py-3 border-b border-slate-700">
              <span className="text-slate-400">Activity (Last 7 Days)</span>
              <span className="text-white font-medium">
                {profileData.activityLast7Days} visit
                {profileData.activityLast7Days !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex justify-between py-3">
              <span className="text-slate-400">Member Since</span>
              <span className="text-white font-medium">
                {formatDate(profileData.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card-gather p-8 border-2 border-red-900">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Danger Zone</h2>
          <p className="text-slate-400 mb-6">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn-gather btn-danger"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Password Update Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
      >
        {passwordError && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
            {passwordError}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-slate-300 mb-2 text-sm font-medium">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-gather"
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-2 text-sm font-medium">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-gather"
              placeholder="Enter new password (min 6 characters)"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-2 text-sm font-medium">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-gather"
              placeholder="Confirm new password"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleUpdatePassword}
            disabled={passwordLoading}
            className="btn-gather btn-primary flex-1"
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
          <button
            onClick={() => {
              setShowPasswordModal(false);
              setPasswordError('');
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }}
            className="btn-gather btn-secondary"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
      >
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          <p className="font-bold mb-2">
            Warning: This action cannot be undone!
          </p>
          <p className="text-sm">
            All your data including spaces, maps, and elements will be
            permanently deleted.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-slate-300 mb-2 text-sm font-medium">
            Type <span className="font-bold text-white">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            className="input-gather"
            placeholder="Type DELETE to confirm"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleDeleteAccount}
            disabled={deleteLoading || deleteConfirmation !== 'DELETE'}
            className="btn-gather btn-danger flex-1"
          >
            {deleteLoading ? 'Deleting...' : 'Delete My Account'}
          </button>
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteConfirmation('');
            }}
            className="btn-gather btn-secondary"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
