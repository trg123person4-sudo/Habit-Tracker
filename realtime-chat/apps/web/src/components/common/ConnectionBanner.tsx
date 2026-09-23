import { useChatStore } from '../../stores/chat-store.js';
import { WifiOff, RefreshCw } from 'lucide-react';

export function ConnectionBanner() {
  const { connectionStatus } = useChatStore();

  if (connectionStatus === 'connected') {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-500/15 border-b border-amber-500/30 text-amber-300 px-4 py-1.5 text-xs font-medium flex items-center justify-center gap-2 transition-all duration-300 backdrop-blur-sm"
    >
      {connectionStatus === 'reconnecting' ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
          <span>Connection interrupted. Reconnecting to PulseChat...</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-rose-300">You are currently offline. Changes will sync once reconnected.</span>
        </>
      )}
    </div>
  );
}
