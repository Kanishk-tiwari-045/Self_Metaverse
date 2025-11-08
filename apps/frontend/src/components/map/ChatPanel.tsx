import { useRef, useEffect } from 'react';
import { ChatMessage, CurrentUser, User } from '../../game/types';

interface ChatPanelProps {
  currentUser: CurrentUser;
  users: Map<string, User>;
  chatMessages: ChatMessage[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: () => void;
}

export const ChatPanel = ({
  currentUser,
  users,
  chatMessages,
  newMessage,
  setNewMessage,
  onSendMessage,
}: ChatPanelProps) => {
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleChatKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="flex-[0.3] bg-slate-800 border-l border-slate-600 flex flex-col">
      <div className="p-4 border-b border-slate-600">
        <h3 className="text-white font-semibold">Map Chat</h3>
        <p className="text-slate-400 text-sm">{users.size + 1} users online</p>
      </div>

      <div
        ref={chatMessagesRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {chatMessages.length === 0 ? (
          <div className="text-slate-400 text-sm text-center py-8">
            No messages yet. Say hello! 👋
          </div>
        ) : (
          chatMessages.map((message) => (
            <div key={message.id || Math.random()} className="space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    message.userId === currentUser?.userId
                      ? 'bg-green-500'
                      : 'bg-orange-500'
                  }`}
                />
                <span className="text-slate-300 text-xs font-medium">
                  {message.displayName}
                </span>
                <span className="text-slate-500 text-xs">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="text-white text-sm ml-4 pl-2 border-l border-slate-600">
                {message.text}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-slate-600">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleChatKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 text-sm"
            maxLength={2000}
          />
          <button
            onClick={onSendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-slate-500 text-xs mt-2">
          Press Enter to send • Chat history is saved
        </p>
      </div>
    </div>
  );
};
