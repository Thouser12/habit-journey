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

const badgeAnimations: Record<Level, string> = {
  bronze: '',
  prata: 'badge-shimmer',
  ouro: 'badge-glow-gold badge-shimmer',
  platina: 'badge-glow-platinum badge-shimmer',
};

interface LevelBadgeProps {
  level: Level;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

const sizeMap = {
  sm: { img: 'h-8 w-8', wrapper: '' },
  md: { img: 'h-14 w-14', wrapper: '' },
  lg: { img: 'h-20 w-20', wrapper: '' },
  xl: { img: 'h-32 w-32', wrapper: '' },
};

const LevelBadge = ({ level, size = 'sm', showLabel = true }: LevelBadgeProps) => {
  const sizes = sizeMap[size];
  const animClasses = badgeAnimations[level];

  if (size === 'sm') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold text-foreground">
        <img
          src={badgeImages[level]}
          alt={LEVEL_LABELS[level]}
          className="h-5 w-5 object-contain"
        />
        {showLabel && LEVEL_LABELS[level]}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn('relative', animClasses)}>
        <img
          src={badgeImages[level]}
          alt={LEVEL_LABELS[level]}
          className={cn(sizes.img, 'object-contain')}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-semibold text-foreground">
          {LEVEL_LABELS[level]}
        </span>
      )}
    </div>
  );
};

export default LevelBadge;
