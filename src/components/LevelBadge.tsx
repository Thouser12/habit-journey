import { Level } from '@/types/app';
import { LEVEL_LABELS } from '@/data/goals';
import { cn } from '@/lib/utils';

const levelStyles: Record<Level, {
  gradient: string;
  border: string;
  shadow: string;
  glow: string;
  text: string;
}> = {
  bronze: {
    gradient: 'linear-gradient(145deg, #7B4F2A, #C88A55)',
    border: 'rgba(123, 79, 42, 0.4)',
    shadow: '0 2px 8px rgba(123, 79, 42, 0.3), inset 0 1px 0 rgba(200, 138, 85, 0.4)',
    glow: '0 0 12px rgba(169, 113, 66, 0.3)',
    text: '#C88A55',
  },
  prata: {
    gradient: 'linear-gradient(145deg, #8D99A6, #E1E7EE)',
    border: 'rgba(141, 153, 166, 0.4)',
    shadow: '0 2px 8px rgba(141, 153, 166, 0.3), inset 0 1px 0 rgba(225, 231, 238, 0.4)',
    glow: '0 0 14px rgba(184, 194, 204, 0.3)',
    text: '#B8C2CC',
  },
  ouro: {
    gradient: 'linear-gradient(145deg, #9B7A34, #F2D189)',
    border: 'rgba(155, 122, 52, 0.4)',
    shadow: '0 2px 10px rgba(214, 169, 79, 0.35), inset 0 1px 0 rgba(242, 209, 137, 0.4)',
    glow: '0 0 18px rgba(214, 169, 79, 0.35)',
    text: '#D6A94F',
  },
  platina: {
    gradient: 'linear-gradient(145deg, #5D7F96, #D8F0FF)',
    border: 'rgba(93, 127, 150, 0.4)',
    shadow: '0 2px 12px rgba(159, 196, 218, 0.4), inset 0 1px 0 rgba(216, 240, 255, 0.4)',
    glow: '0 0 24px rgba(159, 196, 218, 0.35)',
    text: '#9FC4DA',
  },
};

interface LevelBadgeProps {
  level: Level;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

const sizeMap = {
  sm: { badge: 'h-10 w-10', dot: 'h-10 w-10', fontSize: 'text-[8px]' },
  md: { badge: 'h-16 w-16', dot: 'h-16 w-16', fontSize: 'text-[10px]' },
  lg: { badge: 'h-24 w-24', dot: 'h-24 w-24', fontSize: 'text-xs' },
  xl: { badge: 'h-36 w-36', dot: 'h-36 w-36', fontSize: 'text-sm' },
};

const LevelBadge = ({ level, size = 'sm', showLabel = true }: LevelBadgeProps) => {
  const style = levelStyles[level];
  const sizes = sizeMap[size];

  // Inline badge: small pill with dot + label
  if (size === 'sm') {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
        style={{
          color: style.text,
          border: `1px solid ${style.border}`,
          boxShadow: style.shadow,
        }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{
            background: style.gradient,
            boxShadow: `0 0 4px ${style.border}`,
          }}
        />
        {showLabel && LEVEL_LABELS[level]}
      </span>
    );
  }

  // Large badge: circular metal emblem
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(sizes.badge, 'rounded-full flex items-center justify-center', sizes.fontSize, 'font-bold tracking-wider uppercase')}
        style={{
          background: style.gradient,
          border: `2px solid ${style.border}`,
          boxShadow: `${style.shadow}, ${style.glow}`,
          color: 'rgba(255, 255, 255, 0.9)',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
        }}
      >
        {LEVEL_LABELS[level].charAt(0)}
      </div>
      {showLabel && (
        <span className="text-sm font-semibold" style={{ color: style.text }}>
          {LEVEL_LABELS[level]}
        </span>
      )}
    </div>
  );
};

export default LevelBadge;
