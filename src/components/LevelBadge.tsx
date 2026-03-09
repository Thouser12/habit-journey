import { Level } from '@/types/app';
import { LEVEL_LABELS } from '@/data/goals';
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

const glowStyles: Record<Level, string> = {
  bronze: 'shadow-[0_0_20px_hsl(var(--level-bronze-glow)/0.4)]',
  prata: 'shadow-[0_0_20px_hsl(var(--level-prata-glow)/0.4)]',
  ouro: 'shadow-[0_0_20px_hsl(var(--level-ouro-glow)/0.4)]',
  platina: 'shadow-[0_0_20px_hsl(var(--level-platina-glow)/0.4)]',
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
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn('relative rounded-full', glowStyles[level], 'animate-glow-pulse')}>
        <img
          src={badgeImages[level]}
          alt={`Badge ${LEVEL_LABELS[level]}`}
          className={cn(sizeMap[size], 'object-contain drop-shadow-lg')}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-semibold text-foreground">{LEVEL_LABELS[level]}</span>
      )}
    </div>
  );
};

export default LevelBadge;
