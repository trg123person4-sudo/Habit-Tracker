import { useState, useRef, useEffect } from 'react';
import { Trash2, Send, Loader2 } from 'lucide-react';

interface VoiceRecorderProps {
  onRecorded: (audioBlob: Blob, durationSeconds: number) => Promise<void>;
  onCancel: () => void;
}

export function VoiceRecorder({ onRecorded, onCancel }: VoiceRecorderProps) {
  const [seconds, setSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;

    async function startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        recorder.start(100);

        timerRef.current = setInterval(() => {
          setSeconds((prev) => prev + 1);
        }, 1000);
      } catch (err: any) {
        console.error('Microphone access denied or error:', err);
        setError('Microphone access denied. Please allow microphone permissions.');
      }
    }

    startRecording();

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleStopAndSend = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    recorder.onstop = async () => {
      try {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        await onRecorded(blob, seconds);
      } catch (err: any) {
        console.error('Failed to submit voice recording:', err);
        setError('Failed to send voice message');
        setIsSubmitting(false);
      }
    };

    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    onCancel();
  };

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="flex items-center justify-between px-3 py-2 bg-rose-950/40 border border-rose-800 rounded-lg text-rose-300 text-xs">
        <span>{error}</span>
        <button
          type="button"
          onClick={handleCancel}
          className="ml-2 font-semibold hover:underline"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white shadow-lg animate-in fade-in select-none">
      <div className="flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
        <span className="font-mono text-xs text-rose-400 font-semibold">
          Recording {formatTimer(seconds)}
        </span>

        {/* Live pulsating waveform equalizer */}
        <div className="flex items-center gap-0.5 ml-2">
          {[12, 20, 16, 24, 18, 22, 14].map((h, i) => (
            <span
              key={i}
              className="w-1 bg-rose-500/80 rounded-full animate-bounce"
              style={{
                height: `${h}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.8s',
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
          title="Cancel recording"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleStopAndSend}
          disabled={isSubmitting}
          className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow transition-all active:scale-95"
          title="Send voice message"
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
