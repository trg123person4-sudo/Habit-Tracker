import { useEffect } from 'react';
import { useAuthStore } from './stores/auth-store.js';
import { useChatStore } from './stores/chat-store.js';
import { useSocket } from './hooks/useSocket.js';
import { api } from './lib/api-client.js';
import { getSocket } from './lib/socket-client.js';
import { AuthPage } from './components/auth/AuthPage.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { ChatHeader } from './components/layout/ChatHeader.js';
import { MembersPanel } from './components/layout/MembersPanel.js';
import { ThreadPanel } from './components/layout/ThreadPanel.js';
import { ConnectionBanner } from './components/common/ConnectionBanner.js';
import { MessageList } from './components/message/MessageList.js';
import { Composer } from './components/message/Composer.js';
import { QuickSwitcherModal } from './components/common/QuickSwitcherModal.js';
import { CatchUpModal } from './components/modals/CatchUpModal.js';
import { PinnedMessagesModal } from './components/modals/PinnedMessagesModal.js';
import { ConfettiEffect } from './components/common/ConfettiEffect.js';
import { ConversationDto } from '@realtime-chat/shared';

export function App() {
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();
  const {
    setConversations,
    conversations,
    activeConversationId,
    setActiveConversationId,
    isMobileDrawerOpen,
    setMobileDrawerOpen,
    isQuickSwitcherOpen,
    setQuickSwitcherOpen,
    messages,
    markConversationReadLocally,
    activeThreadMessage,
    confettiTriggerKey,
  } = useChatStore();

  // 1. Check session authentication on initial mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // 2. Connect Socket.IO listeners
  useSocket();

  // 3. Load user's conversations upon authentication
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    async function loadConversations() {
      try {
        const res = await api.get<{ conversations: ConversationDto[] }>('/conversations');
        if (isMounted) {
          setConversations(res.conversations);
          // Default to first conversation if none selected
          if (!activeConversationId && res.conversations.length > 0) {
            setActiveConversationId(res.conversations[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load conversations', err);
      }
    }

    loadConversations();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, setConversations, activeConversationId, setActiveConversationId]);

  // 4. Dynamic Browser Tab Title Tracking Unread Count
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const activeConv = conversations.find((c) => c.id === activeConversationId);

  useEffect(() => {
    const prefix = totalUnread > 0 ? `(${totalUnread}) ` : '';
    const convTitle = activeConv?.name ? ` — #${activeConv.name}` : '';
    document.title = `${prefix}PulseChat${convTitle}`;
  }, [totalUnread, activeConv]);

  // 5. Automatic Read Receipt Pointer Update
  useEffect(() => {
    if (!activeConversationId) return;
    const convMsgs = messages[activeConversationId] || [];
    if (convMsgs.length === 0) return;

    const latestMsg = convMsgs[convMsgs.length - 1];
    if (latestMsg && (activeConv?.unreadCount || 0) > 0) {
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('conversation:read', {
          conversationId: activeConversationId,
          messageId: latestMsg.id,
        });
      }
      markConversationReadLocally(activeConversationId);
    }
  }, [activeConversationId, messages, activeConv?.unreadCount, markConversationReadLocally]);

  // 6. Global Quick Switcher Keyboard Shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickSwitcherOpen(!isQuickSwitcherOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickSwitcherOpen, setQuickSwitcherOpen]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-xl animate-pulse">
            ⚡
          </div>
          <span className="text-xs text-slate-400 font-medium">Connecting to PulseChat...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100 antialiased font-sans">
      {/* Celebration Confetti Canvas */}
      <ConfettiEffect triggerKey={confettiTriggerKey} />

      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Mobile Slide-in Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative z-10 w-72 h-full shadow-2xl">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-slate-950">
        <ConnectionBanner />
        <ChatHeader />

        {activeConversationId ? (
          <>
            <MessageList conversationId={activeConversationId} />
            <Composer conversationId={activeConversationId} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            Select a channel or direct message from the sidebar to begin.
          </div>
        )}
      </main>

      {/* Dedicated Side-Panel Thread Drawer */}
      {activeThreadMessage && <ThreadPanel />}

      {/* Right Details / Members Panel */}
      <MembersPanel />

      {/* Quick Switcher & Global Search Modal */}
      <QuickSwitcherModal
        isOpen={isQuickSwitcherOpen}
        onClose={() => setQuickSwitcherOpen(false)}
      />

      {/* Catch-Up AI Summary Modal */}
      <CatchUpModal />

      {/* Pinned Messages Modal */}
      <PinnedMessagesModal />
    </div>
  );
}

export default App;
