import { Level } from '@/types/app';
import { LEVEL_LABELS, LEVEL_ORDER } from '@/data/goals';
import { cn } from '@/lib/utils';
import badgeBronze from '@/assets/badge-bronze.png';
import badgePrata from '@/assets/badge-prata.png';
import badgeOuro from '@/assets/badge-ouro.png';
import badgePlatina from '@/assets/badge-platina.png';

const badgeImages: Record<Level, string> = {
  bronze: badgeBronze,
  prata: badgePrata,
  ouro: badgeOuro,
  platina: badgePlatina,
};

const glowConfig: Record<Level, { color: string; size: string; animation: string }> = {
  bronze: {
    color: 'drop-shadow(0 0 4px hsl(30 58% 50% / 0.5)) drop-shadow(0 0 8px hsl(30 70% 63% / 0.3))',
    size: '',
    animation: 'glow-bronze',
  },
  prata: {
    color: 'drop-shadow(0 0 6px hsl(210 6% 75% / 0.6)) drop-shadow(0 0 14px hsl(210 20% 90% / 0.35))',
    size: '',
    animation: 'glow-prata',
  },
  ouro: {
    color: 'drop-shadow(0 0 10px hsl(45 90% 61% / 0.6)) drop-shadow(0 0 22px hsl(48 100% 74% / 0.35))',
    size: '',
    animation: 'glow-ouro',
  },
  platina: {
    color: 'drop-shadow(0 0 14px hsl(200 80% 75% / 0.7)) drop-shadow(0 0 32px hsl(192 100% 88% / 0.4)) drop-shadow(0 0 48px hsl(200 80% 75% / 0.2))',
    size: '',
    animation: 'glow-platina',
  },
};

interface LevelBadgeProps {
  level: Level;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

const sizeMap = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
  xl: 'h-36 w-36',
};

const LevelBadge = ({ level, size = 'sm', showLabel = true }: LevelBadgeProps) => {
  const glow = glowConfig[level];

  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={badgeImages[level]}
        alt={`Badge ${LEVEL_LABELS[level]}`}
        className={cn(sizeMap[size], 'object-contain animate-glow-pulse')}
        style={{ filter: glow.color }}
      />
      {showLabel && (
        <span className="text-sm font-semibold text-foreground">{LEVEL_LABELS[level]}</span>
      )}
    </div>
  );
};

export default LevelBadge;
