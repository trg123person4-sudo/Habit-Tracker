import { cn } from '../../lib/utils.js';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  presence?: 'online' | 'offline' | null;
  className?: string;
}

export function Avatar({ name, src, size = 'md', presence, className }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base font-semibold',
  };

  const dotSizeClasses = {
    sm: 'w-2 h-2 -bottom-0.5 -right-0.5',
    md: 'w-2.5 h-2.5 bottom-0 right-0',
    lg: 'w-3 h-3 bottom-0 right-0',
  };

  const initial = (name || '?').charAt(0).toUpperCase();

  // Pick deterministic background gradient based on name hash
  const colors = [
    'bg-gradient-to-br from-indigo-500 to-purple-600',
    'bg-gradient-to-br from-blue-500 to-cyan-600',
    'bg-gradient-to-br from-emerald-500 to-teal-600',
    'bg-gradient-to-br from-rose-500 to-pink-600',
    'bg-gradient-to-br from-amber-500 to-orange-600',
  ];

  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const bg = colors[Math.abs(hash) % colors.length];

  return (
    <div className="relative inline-flex shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn('rounded-full object-cover shrink-0', sizeClasses[size], className)}
        />
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center text-white font-medium shrink-0 select-none shadow-sm',
            sizeClasses[size],
            bg,
            className,
          )}
        >
          {initial}
        </div>
      )}

      {presence && (
        <span
          className={cn(
            'absolute rounded-full ring-2 ring-slate-950',
            dotSizeClasses[size],
            presence === 'online' ? 'bg-emerald-500' : 'bg-slate-500',
          )}
        />
      )}
    </div>
  );
}
