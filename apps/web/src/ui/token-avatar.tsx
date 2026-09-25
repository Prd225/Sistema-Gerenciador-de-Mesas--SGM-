import { cn } from '@/lib/utils';

export interface TokenAvatarProps {
  name: string;
  src?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'size-6 text-xs',
  md: 'size-8 text-xs',
  lg: 'size-12 text-base',
} as const;

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Avatar de um token/personagem. `alt` recebe o nome do personagem
 * (regra de acessibilidade do design system).
 */
function TokenAvatar({
  name,
  src,
  color,
  size = 'md',
  className,
}: TokenAvatarProps) {
  if (src) {
    return (
      <img
        data-slot="token-avatar"
        src={src}
        alt={name}
        className={cn(
          'shrink-0 rounded-full border border-control object-cover',
          sizeClasses[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      data-slot="token-avatar"
      role="img"
      aria-label={name}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border border-control bg-surface font-semibold text-text',
        sizeClasses[size],
        className,
      )}
      style={color ? { backgroundColor: color } : undefined}
    >
      {initials(name)}
    </div>
  );
}

export { TokenAvatar };
