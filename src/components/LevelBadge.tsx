import { Level } from '@/types/app';
import { LEVEL_LABELS } from '@/data/goals';
import { cn } from '@/lib/utils';

import bronzeBadge from '@/assets/badges/bronze.png';
import silverBadge from '@/assets/badges/silver.png';
import goldBadge from '@/assets/badges/gold.png';
import platinumBadge from '@/assets/badges/platinum.png';

const badgeImages: Record<Level, string> = {
  bronze: bronzeBadge,
  prata: silverBadge,
  ouro: goldBadge,
  platina: platinumBadge,
};

const glowStyles: Record<Level, { color: string; spread: number }> = {
  bronze: { color: 'rgba(200, 138, 85, 0.4)', spread: 12 },
  prata: { color: 'rgba(184, 194, 204, 0.45)', spread: 18 },
  ouro: { color: 'rgba(214, 169, 79, 0.5)', spread: 24 },
  platina: { color: 'rgba(159, 196, 218, 0.55)', spread: 32 },
};

const textColors: Record<Level, string> = {
  bronze: '#C88A55',
  prata: '#B8C2CC',
  ouro: '#D6A94F',
  platina: '#9FC4DA',
};

interface LevelBadgeProps {
  level: Level;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

const sizeMap = {
  sm: { img: 'h-8 w-8', wrapper: '' },
  md: { img: 'h-14 w-14', wrapper: '' },
  lg: { img: 'h-24 w-24', wrapper: '' },
  xl: { img: 'h-36 w-36', wrapper: '' },
};

const LevelBadge = ({ level, size = 'sm', showLabel = true }: LevelBadgeProps) => {
  const sizes = sizeMap[size];
  const glow = glowStyles[level];

  if (size === 'sm') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
        style={{ color: textColors[level], border: `1px solid ${glow.color}`, boxShadow: `0 0 ${glow.spread / 2}px ${glow.color}` }}>
        <img src={badgeImages[level]} alt={LEVEL_LABELS[level]} className="h-4 w-4 object-contain" />
        {showLabel && LEVEL_LABELS[level]}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        <img
          src={badgeImages[level]}
          alt={LEVEL_LABELS[level]}
          className={cn(sizes.img, 'object-contain relative z-10 drop-shadow-lg')}
          style={{
            filter: `drop-shadow(0 0 ${glow.spread}px ${glow.color}) drop-shadow(0 0 ${glow.spread * 1.5}px ${glow.color})`,
          }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-semibold" style={{ color: textColors[level] }}>
          {LEVEL_LABELS[level]}
        </span>
      )}
    </div>
  );
};

export default LevelBadge;
