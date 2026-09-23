import { useState, useEffect } from 'react';
import { useChatStore } from '../../stores/chat-store.js';
import { api } from '../../lib/api-client.js';
import { CatchUpSummaryDto } from '@realtime-chat/shared';
import { Sparkles, X, CheckSquare, ListChecks, Loader2, ArrowRight } from 'lucide-react';

export function CatchUpModal() {
  const { isCatchUpOpen, setCatchUpOpen, activeConversationId, conversations } = useChatStore();
  const [data, setData] = useState<CatchUpSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  useEffect(() => {
    if (!isCatchUpOpen || !activeConversationId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setData(null);

    api
      .get<CatchUpSummaryDto>(`/ai/catchup/${activeConversationId}`)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to generate catch-up summary');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isCatchUpOpen, activeConversationId]);

  if (!isCatchUpOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="relative w-full max-w-lg rounded-2xl border border-indigo-500/40 bg-slate-900/95 shadow-2xl overflow-hidden text-white">
        {/* Glow Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950/80 p-5 border-b border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Catch Me Up</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI Summary
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Summary for #{activeConv?.name || 'conversation'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCatchUpOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 scrollbar-thin select-text">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-sm font-medium">Synthesizing discussion insights...</p>
              <span className="text-xs text-slate-500">
                Extracting key takeaways and action items
              </span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {!isLoading && data && (
            <>
              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Executive TL;DR
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {data.summary}
                </p>
                <div className="mt-2 text-[10px] text-slate-500">
                  Synthesized from {data.messageCount} recent messages
                </div>
              </div>

              {/* Bullet Points */}
              {data.bulletPoints && data.bulletPoints.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-indigo-300 uppercase tracking-wide">
                    <ListChecks className="w-4 h-4 text-indigo-400" />
                    <span>Key Takeaways</span>
                  </div>
                  <ul className="space-y-2">
                    {data.bulletPoints.map((point, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {data.actionItems && data.actionItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    <span>Action Items</span>
                  </div>
                  <div className="space-y-2">
                    {data.actionItems.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 text-xs text-slate-200 bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-lg"
                      >
                        <span className="w-4 h-4 rounded border border-emerald-500/50 flex items-center justify-center text-[10px] text-emerald-400 shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={() => setCatchUpOpen(false)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
