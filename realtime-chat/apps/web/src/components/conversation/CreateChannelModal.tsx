import { useState } from 'react';
import { api } from '../../lib/api-client.js';
import { useChatStore } from '../../stores/chat-store.js';
import { X, Hash, Lock } from 'lucide-react';
import { ConversationDto } from '@realtime-chat/shared';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateChannelModal({ isOpen, onClose }: CreateChannelModalProps) {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { conversations, setConversations, setActiveConversationId } = useChatStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const res = await api.post<{ conversation: ConversationDto }>('/conversations', {
        type: 'CHANNEL',
        name: name.trim().toLowerCase().replace(/\s+/g, '-'),
        topic: topic.trim() || undefined,
        isPrivate,
      });

      setConversations([res.conversation, ...conversations]);
      setActiveConversationId(res.conversation.id);
      onClose();
      setName('');
      setTopic('');
      setIsPrivate(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Create a channel</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Channel Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">#</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. project-apollo"
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2 pl-8 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Topic <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What is this channel about?"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
            <div className="flex items-center gap-3">
              {isPrivate ? (
                <Lock className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <Hash className="w-5 h-5 text-indigo-400 shrink-0" />
              )}
              <div>
                <div className="text-sm font-medium text-white">Make private</div>
                <div className="text-xs text-slate-400">
                  {isPrivate
                    ? 'Only invited users will be able to view and join'
                    : 'Anyone in your workspace can view and join'}
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 shadow-lg shadow-indigo-600/30"
            >
              {loading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
