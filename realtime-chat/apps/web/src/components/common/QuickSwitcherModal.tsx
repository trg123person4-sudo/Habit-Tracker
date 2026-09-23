import { useState, useEffect, useRef } from 'react';
import { Search, Hash, Lock, User as UserIcon, MessageSquare, ArrowRight, X } from 'lucide-react';
import { useChatStore } from '../../stores/chat-store.js';
import { api } from '../../lib/api-client.js';
import { SearchResultDto } from '@realtime-chat/shared';
import { cn } from '../../lib/utils.js';

interface QuickSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickSwitcherModal({ isOpen, onClose }: QuickSwitcherModalProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'conversations' | 'messages'>('conversations');
  const [searchResults, setSearchResults] = useState<SearchResultDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const { conversations, setActiveConversationId, activeConversationId } = useChatStore();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSearchResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Search messages debounced
  useEffect(() => {
    if (activeTab !== 'messages') return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get<{ results: SearchResultDto[] }>(
          `/search?q=${encodeURIComponent(trimmed)}&limit=15`,
        );
        setSearchResults(res.results || []);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeTab]);

  // Filter conversations locally
  const filteredConversations = conversations.filter((c) => {
    if (!query.trim()) return true;
    return (c.name || '').toLowerCase().includes(query.toLowerCase());
  });

  const totalItems =
    activeTab === 'conversations' ? filteredConversations.length : searchResults.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (totalItems || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (totalItems || 1)) % (totalItems || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeTab === 'conversations' && filteredConversations[selectedIndex]) {
        setActiveConversationId(filteredConversations[selectedIndex].id);
        onClose();
      } else if (activeTab === 'messages' && searchResults[selectedIndex]) {
        setActiveConversationId(searchResults[selectedIndex].conversation.id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeTab === 'conversations'
                ? 'Jump to channel or direct message...'
                : 'Search all messages for words or phrases...'
            }
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-3 py-1.5 gap-2">
          <button
            onClick={() => setActiveTab('conversations')}
            className={cn(
              'px-3 py-1 text-xs font-semibold rounded-lg transition-colors',
              activeTab === 'conversations'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800',
            )}
          >
            Channels & DMs
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={cn(
              'px-3 py-1 text-xs font-semibold rounded-lg transition-colors',
              activeTab === 'messages'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800',
            )}
          >
            Search Messages
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {activeTab === 'conversations' ? (
            filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No matching channels or conversations found.
              </div>
            ) : (
              filteredConversations.map((conv, idx) => {
                const isSelected = idx === selectedIndex;
                const isCurrentActive = conv.id === activeConversationId;

                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setActiveConversationId(conv.id);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors',
                      isSelected ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800',
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {conv.type === 'CHANNEL' ? (
                        conv.isPrivate ? (
                          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                        )
                      ) : (
                        <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="font-medium text-sm truncate">{conv.name}</span>
                      {isCurrentActive && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          Current
                        </span>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 opacity-0 group-hover:opacity-100" />
                  </button>
                );
              })
            )
          ) : isSearching ? (
            <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
              Searching messages...
            </div>
          ) : query.trim().length < 2 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Type at least 2 characters to search across conversations.
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching messages found for "{query}".
            </div>
          ) : (
            searchResults.map((res, idx) => {
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={res.message.id}
                  onClick={() => {
                    setActiveConversationId(res.conversation.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'w-full p-2.5 rounded-xl text-left transition-colors space-y-1 border border-transparent',
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500/50 text-white'
                      : 'hover:bg-slate-800/60 text-slate-300',
                  )}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-indigo-400 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      {res.conversation.type === 'CHANNEL' ? '#' : '@'}
                      {res.conversation.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      @{res.message.sender?.username}
                    </span>
                  </div>
                  <div
                    className="text-xs text-slate-300 line-clamp-2 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: res.highlight }}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500 select-none">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300 mr-1">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300 mr-1">
                ↓
              </kbd>
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300 mr-1">
                ↵
              </kbd>
              Select
            </span>
          </div>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300 mr-1">
              Esc
            </kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
