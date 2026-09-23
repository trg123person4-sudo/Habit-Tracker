import { useState } from 'react';
import { PollDto } from '@realtime-chat/shared';
import { getSocket } from '../../lib/socket-client.js';
import { useAuthStore } from '../../stores/auth-store.js';
import { soundService } from '../../lib/sound-service.js';
import { CheckCircle2, BarChart3, Users } from 'lucide-react';

interface PollCardProps {
  messageId: string;
  poll: PollDto;
}

export function PollCard({ messageId, poll }: PollCardProps) {
  const { user } = useAuthStore();
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = (optionIndex: number) => {
    if (isVoting) return;
    const socket = getSocket();
    if (!socket || !socket.connected) return;

    setIsVoting(true);
    soundService.playReaction();

    socket.emit('message:poll_vote', { messageId, optionIndex }, () => {
      setIsVoting(false);
    });
  };

  const totalVotes = poll.totalVotes || 0;

  return (
    <div className="my-2.5 max-w-md w-full rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
      {/* Poll Header */}
      <div className="flex items-start gap-2.5 mb-3.5">
        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0">
          <BarChart3 className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-400">
            Interactive Poll
          </span>
          <h4 className="text-sm font-semibold text-white leading-snug break-words">
            {poll.question}
          </h4>
        </div>
      </div>

      {/* Poll Options */}
      <div className="space-y-2">
        {poll.options.map((option) => {
          const isUserVoted =
            option.userVoted || (user ? option.voterIds?.includes(user.id) : false);
          const percent = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

          return (
            <button
              key={option.index}
              type="button"
              disabled={isVoting}
              onClick={() => handleVote(option.index)}
              className={`group relative w-full text-left overflow-hidden rounded-xl border p-2.5 transition-all text-xs select-none ${
                isUserVoted
                  ? 'border-indigo-500/80 bg-indigo-950/30 hover:border-indigo-400'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950/90'
              }`}
            >
              {/* Animated Progress Bar fill */}
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
                  isUserVoted ? 'bg-indigo-600/30' : 'bg-slate-800/40'
                }`}
                style={{ width: `${percent}%` }}
              />

              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 truncate">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      isUserVoted
                        ? 'border-indigo-400 bg-indigo-500 text-white'
                        : 'border-slate-600 group-hover:border-slate-400'
                    }`}
                  >
                    {isUserVoted && <CheckCircle2 className="w-3.5 h-3.5 fill-white text-indigo-600" />}
                  </div>
                  <span
                    className={`truncate font-medium ${
                      isUserVoted ? 'text-white font-semibold' : 'text-slate-200'
                    }`}
                  >
                    {option.text}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-mono">
                  <span
                    className={`font-semibold ${
                      isUserVoted ? 'text-indigo-300' : 'text-slate-400'
                    }`}
                  >
                    {percent}%
                  </span>
                  <span className="text-slate-500">({option.votes})</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Poll Footer */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <span>
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          </span>
        </div>
        <span className="italic">Click an option to vote or change vote</span>
      </div>
    </div>
  );
}
