import { useState } from 'react';
import { useChatStore } from '../../stores/chat-store.js';
import { useAuthStore } from '../../stores/auth-store.js';
import { Avatar } from '../common/Avatar.js';
import { CreateChannelModal } from '../conversation/CreateChannelModal.js';
import { Hash, Lock, Plus, LogOut, Search } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export function Sidebar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    setQuickSwitcherOpen,
    presences,
  } = useChatStore();
  const { user, logout } = useAuthStore();

  const channels = conversations.filter((c) => c.type === 'CHANNEL');
  const directMessages = conversations.filter((c) => c.type === 'DM');

  return (
    <>
      <aside className="w-64 shrink-0 flex flex-col h-full bg-slate-950 border-r border-slate-800 select-none">
        {/* Workspace Brand / Header */}
        <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-indigo-600/30">
              ⚡
            </div>
            <span className="font-bold text-slate-100 text-base tracking-tight">PulseChat</span>
          </div>
        </div>

        {/* Quick Switcher Trigger */}
        <div className="px-3 pt-3">
          <button
            onClick={() => setQuickSwitcherOpen(true)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Jump to...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 font-mono text-[10px] text-slate-400">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Scrollable Conversation Lists */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-6">
          {/* Channels Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Channels
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                title="Create Channel"
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              {channels.map((channel) => {
                const isActive = channel.id === activeConversationId;
                const hasUnread = (channel.unreadCount || 0) > 0;

                return (
                  <button
                    key={channel.id}
                    onClick={() => setActiveConversationId(channel.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors group',
                      isActive
                        ? 'bg-indigo-600 text-white font-medium shadow-sm shadow-indigo-600/20'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white',
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {channel.isPrivate ? (
                        <Lock className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
                      ) : (
                        <Hash className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
                      )}
                      <span className={cn('truncate', hasUnread && !isActive && 'font-bold text-white')}>
                        {channel.name}
                      </span>
                    </div>

                    {hasUnread && !isActive && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500 text-white rounded-full min-w-[18px] text-center">
                        {channel.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Messages Section */}
          <div>
            <div className="px-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Direct Messages
              </span>
            </div>

            <div className="space-y-0.5">
              {directMessages.map((dm) => {
                const isActive = dm.id === activeConversationId;
                const hasUnread = (dm.unreadCount || 0) > 0;
                const otherMember = dm.members?.find((m) => m.userId !== user?.id);
                const otherUserId = otherMember?.userId;
                const presence = otherUserId ? presences[otherUserId] || 'offline' : 'offline';

                return (
                  <button
                    key={dm.id}
                    onClick={() => setActiveConversationId(dm.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors group',
                      isActive
                        ? 'bg-indigo-600 text-white font-medium shadow-sm'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white',
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Avatar name={dm.name || 'DM'} size="sm" presence={presence} />
                      <span className={cn('truncate', hasUnread && !isActive && 'font-bold text-white')}>
                        {dm.name}
                      </span>
                    </div>

                    {hasUnread && !isActive && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500 text-white rounded-full min-w-[18px] text-center">
                        {dm.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Current User Bar Footer */}
        {user && (
          <div className="h-16 border-t border-slate-800 bg-slate-950/80 px-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <Avatar
                name={user.displayName || user.username}
                src={user.avatarUrl}
                size="md"
                presence="online"
              />
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate">
                  {user.displayName || user.username}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {user.statusMessage || `@${user.username}`}
                </div>
              </div>
            </div>

            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>

      <CreateChannelModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
