import { useRef, useEffect, useState } from 'react';
import { ChatMessage, CurrentUser, User } from '../../game/types';
import { MessageSquare, Users } from 'lucide-react';

interface MapViewSidebarProps {
  currentUser: CurrentUser | null;
  users: Map<string, User>;
  chatMessages: ChatMessage[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: () => void;
}

export const MapViewSidebar = ({
  currentUser,
  users,
  chatMessages,
  newMessage,
  setNewMessage,
  onSendMessage,
}: MapViewSidebarProps) => {
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle mention detection and filtering
  const handleInputChange = (value: string) => {
    setNewMessage(value);

    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1 && (atIndex === 0 || value[atIndex - 1] === ' ')) {
      const afterAt = value.substring(atIndex + 1);
      const spaceIndex = afterAt.indexOf(' ');
      const query =
        spaceIndex === -1 ? afterAt : afterAt.substring(0, spaceIndex);

      setMentionQuery(query);
      setMentionStartIndex(atIndex);
      setShowMentionDropdown(true);
      setSelectedMentionIndex(0);
    } else {
      setShowMentionDropdown(false);
      setMentionStartIndex(-1);
    }
  };

  // Get filtered users for mentions
  const getFilteredUsers = () => {
    return Array.from(users.values())
      .filter((user) => user.id !== currentUser?.userId) // Don't include self
      .filter((user) => {
        // Use real username for filtering
        const displayName = user.username || `User ${user.id}`;
        return displayName.toLowerCase().includes(mentionQuery.toLowerCase());
      })
      .slice(0, 5); // Limit to 5 suggestions
  };

  const handleMentionSelect = (userId: string) => {
    const beforeAt = newMessage.substring(0, mentionStartIndex);
    const afterMention = newMessage.substring(
      mentionStartIndex + 1 + mentionQuery.length
    );
    const newValue = `${beforeAt}@User${userId}${afterMention}`;
    setNewMessage(newValue);
    setShowMentionDropdown(false);
    setMentionStartIndex(-1);
    inputRef.current?.focus();
  };

  const handleChatKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentionDropdown) {
      const filteredUsers = getFilteredUsers();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev < filteredUsers.length - 1 ? prev + 1 : prev
        );
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : prev));
        return;
      } else if (e.key === 'Enter' && filteredUsers.length > 0) {
        e.preventDefault();
        handleMentionSelect(filteredUsers[selectedMentionIndex].id);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionDropdown(false);
        setMentionStartIndex(-1);
        return;
      }
      // For all other keys when dropdown is open, let them through normally
      // This includes space, letters, backspace, etc.
    }

    // Handle Enter key for sending messages when dropdown is NOT open
    if (e.key === 'Enter' && !e.shiftKey && !showMentionDropdown) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="fixed top-0 left-12 w-80 h-screen bg-slate-800 border-r border-slate-700 flex flex-col z-30">
      {/* Users Section */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Online Users</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-slate-700 rounded-lg">
            <span className="text-2xl font-bold text-white">
              {users.size + (currentUser ? 1 : 0)}
            </span>
          </div>
          <span className="text-sm text-slate-400">users in this map</span>
        </div>
      </div>

      {/* Chat Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-400" />
            <h3 className="text-white font-semibold">Chat</h3>
          </div>
        </div>

        {/* Chat Messages */}
        <div
          ref={chatMessagesRef}
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {chatMessages.length === 0 ? (
            <div className="text-slate-400 text-sm text-center py-8">
              No messages yet. Say hello! 👋
            </div>
          ) : (
            chatMessages.map((message) => {
              const isTagged = message.taggedUsers?.includes(
                currentUser?.userId || ''
              );
              return (
                <div
                  key={message.id || Math.random()}
                  className={`space-y-1 ${isTagged ? 'bg-blue-500/10 border border-blue-500/20 rounded-lg p-2' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        message.userId === currentUser?.userId
                          ? 'bg-green-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <span className="text-slate-300 text-xs font-medium">
                      {message.displayName}
                    </span>
                    {isTagged && (
                      <span className="text-blue-400 text-xs font-medium bg-blue-500/20 px-2 py-0.5 rounded">
                        @mentioned
                      </span>
                    )}
                    <span className="text-slate-500 text-xs">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div
                    className={`text-white text-sm ml-4 pl-2 border-l-2 ${isTagged ? 'border-blue-400' : 'border-slate-600'}`}
                  >
                    {message.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-slate-700 bg-slate-800 relative">
          {/* Mention Dropdown */}
          {showMentionDropdown && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-40 overflow-y-auto z-50">
              {getFilteredUsers().length > 0 ? (
                getFilteredUsers().map((user, index) => (
                  <button
                    key={user.id}
                    onClick={() => handleMentionSelect(user.id)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-600 transition-colors ${
                      index === selectedMentionIndex
                        ? 'bg-blue-600 text-white'
                        : 'text-white'
                    }`}
                  >
                    @{user.username || `User ${user.id}`}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-slate-400 text-sm">
                  No users found
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleChatKeyPress}
              placeholder="Type a message... @ to mention users"
              className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 text-sm"
              maxLength={2000}
            />
            <button
              onClick={onSendMessage}
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              Send
            </button>
          </div>
          <p className="text-slate-500 text-xs mt-2">
            Press Enter to send • @ to mention users
          </p>
        </div>
      </div>
    </div>
  );
};
