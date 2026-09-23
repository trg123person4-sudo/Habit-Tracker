import { useState } from 'react';
import { useChatStore } from '../../stores/chat-store.js';
import { useAuthStore } from '../../stores/auth-store.js';
import { api } from '../../lib/api-client.js';
import { Avatar } from '../common/Avatar.js';
import {
  X,
  Shield,
  Crown,
  Hash,
  Lock,
  Volume2,
  VolumeX,
  UserMinus,
} from 'lucide-react';

export function MembersPanel() {
  const [muteMenuMemberId, setMuteMenuMemberId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { user } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    isDetailsOpen,
    toggleDetails,
    presences,
    removeMemberFromConversation,
    updateMemberInConversation,
  } = useChatStore();

  if (!isDetailsOpen) return null;

  const conversation = conversations.find((c) => c.id === activeConversationId);
  if (!conversation) return null;

  const members = conversation.members || [];
  const currentMember = members.find((m) => m.userId === user?.id);
  const isChannel = conversation.type === 'CHANNEL';
  const isOwner = currentMember?.role === 'OWNER';
  const isAdmin = currentMember?.role === 'ADMIN' || isOwner;

  const handleKick = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to kick @${memberName} from #${conversation.name}?`)) {
      return;
    }

    try {
      setActionError(null);
      await api.delete(`/conversations/${conversation.id}/members/${memberId}`);
      removeMemberFromConversation(conversation.id, memberId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to kick member';
      setActionError(msg);
    }
  };

  const handleMute = async (memberId: string, durationMinutes: number) => {
    try {
      setActionError(null);
      const res = await api.patch<{ mutedUntil: string | null }>(
        `/conversations/${conversation.id}/members/${memberId}/mute`,
        { durationMinutes },
      );
      updateMemberInConversation(conversation.id, memberId, {
        mutedUntil: res.mutedUntil,
      });
      setMuteMenuMemberId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to mute member';
      setActionError(msg);
    }
  };

  return (
    <aside className="w-64 shrink-0 h-full border-l border-slate-800 bg-slate-950 flex flex-col select-none">
      {/* Header */}
      <div className="h-14 border-b border-slate-800 px-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Details</span>
        <button
          onClick={toggleDetails}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {actionError && (
          <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/50 text-xs text-rose-300">
            {actionError}
          </div>
        )}

        {/* About Section */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            About
          </h3>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              {conversation.isPrivate ? (
                <Lock className="w-4 h-4 text-slate-400" />
              ) : (
                <Hash className="w-4 h-4 text-slate-400" />
              )}
              <span>{conversation.name}</span>
            </div>
            {conversation.topic && (
              <p className="text-xs text-slate-400 leading-relaxed">{conversation.topic}</p>
            )}
          </div>
        </div>

        {/* Members List */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Members ({members.length})
          </h3>

          <div className="space-y-1">
            {members.map((m) => {
              const username = m.user?.username || 'user';
              const displayName = m.user?.displayName || username;
              const isOnline = presences[m.userId] === 'online';
              const isSelf = m.userId === user?.id;
              const isMuted = !!(m.mutedUntil && new Date(m.mutedUntil) > new Date());

              // Moderation permissions check
              const canModerate =
                isChannel &&
                !isSelf &&
                (isOwner ? m.role !== 'OWNER' : isAdmin ? m.role === 'MEMBER' : false);

              const isMenuOpen = muteMenuMemberId === m.id;

              return (
                <div
                  key={m.id}
                  className="relative group flex flex-col p-2 rounded-xl hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 truncate min-w-0">
                      <Avatar
                        name={displayName}
                        src={m.user?.avatarUrl}
                        size="sm"
                        presence={isOnline ? 'online' : 'offline'}
                      />
                      <div className="truncate">
                        <div className="text-xs font-medium text-slate-200 truncate flex items-center gap-1.5">
                          <span>{displayName}</span>
                          {m.role === 'OWNER' && (
                            <span title="Channel Owner">
                              <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                            </span>
                          )}
                          {m.role === 'ADMIN' && (
                            <span title="Channel Admin">
                              <Shield className="w-3 h-3 text-indigo-400 shrink-0" />
                            </span>
                          )}
                          {isMuted && (
                            <span
                              title="Member is muted"
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950/60 text-amber-400 border border-amber-500/40 flex items-center gap-0.5 shrink-0"
                            >
                              <VolumeX className="w-2.5 h-2.5" />
                              Muted
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">@{username}</div>
                      </div>
                    </div>

                    {/* Moderation Controls */}
                    {canModerate && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                        <button
                          onClick={() => setMuteMenuMemberId(isMenuOpen ? null : m.id)}
                          title={isMuted ? 'Change Mute / Unmute' : 'Mute member'}
                          className={`p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 ${
                            isMenuOpen ? 'bg-slate-800 text-white' : ''
                          }`}
                        >
                          {isMuted ? (
                            <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleKick(m.id, username)}
                          title="Kick member"
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mute Duration Popup Menu */}
                  {isMenuOpen && (
                    <div className="mt-2 p-2 rounded-xl bg-slate-900 border border-slate-700/80 shadow-xl space-y-1.5 text-xs animate-fade-in z-20">
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-1">
                        Mute Options
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          onClick={() => handleMute(m.id, 15)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 text-center font-medium transition-colors"
                        >
                          15m
                        </button>
                        <button
                          onClick={() => handleMute(m.id, 60)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 text-center font-medium transition-colors"
                        >
                          1h
                        </button>
                        <button
                          onClick={() => handleMute(m.id, 1440)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 text-center font-medium transition-colors"
                        >
                          24h
                        </button>
                      </div>
                      {isMuted && (
                        <button
                          onClick={() => handleMute(m.id, 0)}
                          className="w-full py-1 px-2 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600 hover:text-white font-medium text-center transition-colors flex items-center justify-center gap-1"
                        >
                          <Volume2 className="w-3 h-3" />
                          Unmute Member
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
