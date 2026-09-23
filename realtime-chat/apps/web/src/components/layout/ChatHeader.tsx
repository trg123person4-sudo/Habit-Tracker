import { useState } from 'react';
import { useChatStore } from '../../stores/chat-store.js';
import { useAuthStore } from '../../stores/auth-store.js';
import { soundService } from '../../lib/sound-service.js';
import {
  Hash,
  Lock,
  Users,
  Menu,
  Search,
  Sparkles,
  Pin,
  Volume2,
  VolumeX,
} from 'lucide-react';

export function ChatHeader() {
  const { user } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    toggleDetails,
    setMobileDrawerOpen,
    setQuickSwitcherOpen,
    setCatchUpOpen,
    setPinnedOpen,
    presences,
  } = useChatStore();

  const [soundEnabled, setSoundEnabled] = useState(soundService.isEnabled());

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    soundService.setEnabled(nextState);
    setSoundEnabled(nextState);
    if (nextState) {
      soundService.playReaction();
    }
  };

  const conversation = conversations.find((c) => c.id === activeConversationId);

  if (!conversation) {
    return (
      <header className="h-14 border-b border-slate-800 bg-slate-900/50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-slate-400 text-sm font-medium">Select a conversation</span>
        </div>
      </header>
    );
  }

  const memberCount = conversation.members?.length || 0;
  const isDM = conversation.type === 'DM';
  const otherMember = isDM ? conversation.members?.find((m) => m.userId !== user?.id) : null;
  const otherPresence = otherMember?.userId
    ? presences[otherMember.userId] || 'offline'
    : 'offline';

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-4 flex items-center justify-between select-none">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="md:hidden p-1.5 -ml-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 truncate">
          {conversation.isPrivate ? (
            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <Hash className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <h2 className="text-sm font-bold text-white tracking-tight truncate">
            {conversation.name}
          </h2>
        </div>

        {isDM ? (
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                otherPresence === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
              }`}
            />
            <span
              className={
                otherPresence === 'online' ? 'text-emerald-400 font-medium' : 'text-slate-400'
              }
            >
              {otherPresence === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
        ) : (
          conversation.topic && (
            <>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <p className="text-xs text-slate-400 truncate hidden sm:inline max-w-xs md:max-w-md">
                {conversation.topic}
              </p>
            </>
          )
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Catch Me Up AI Button */}
        <button
          onClick={() => setCatchUpOpen(true)}
          title="Catch me up: AI channel summary"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:border-indigo-500/50 transition-all shadow-sm active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
          <span className="hidden sm:inline">Catch Up</span>
        </button>

        {/* Pinned Messages Button */}
        <button
          onClick={() => setPinnedOpen(true)}
          title="Pinned messages in this channel"
          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
        >
          <Pin className="w-4 h-4" />
        </button>

        {/* Sound FX Toggle */}
        <button
          onClick={handleToggleSound}
          title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-slate-300" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {/* Quick Switcher & Global Search */}
        <button
          onClick={() => setQuickSwitcherOpen(true)}
          title="Quick Switcher & Semantic Search (Ctrl+K)"
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Search</span>
        </button>

        {/* Members Panel Toggle */}
        <button
          onClick={toggleDetails}
          title="Conversation Members & Details"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Users className="w-3.5 h-3.5" />
          <span>{memberCount}</span>
        </button>
      </div>
    </header>
  );
}
