import { Level } from '@/types/app';
import { LEVEL_LABELS } from '@/data/goals';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

const levelStyles: Record<Level, string> = {
  bronze: 'bg-level-bronze/15 text-level-bronze border-level-bronze/30',
  prata: 'bg-level-prata/15 text-level-prata border-level-prata/30',
  ouro: 'bg-level-ouro/15 text-level-ouro border-level-ouro/30',
  platina: 'bg-level-platina/15 text-level-platina border-level-platina/30',
};

interface LevelBadgeProps {
  level: Level;
  size?: 'sm' | 'lg';
}

const LevelBadge = ({ level, size = 'sm' }: LevelBadgeProps) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border font-semibold',
        levelStyles[level],
        size === 'lg' ? 'px-5 py-2.5 text-lg' : 'px-3 py-1 text-sm'
      )}
    >
      <Trophy className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      {LEVEL_LABELS[level]}
    </div>
  );
};

export default LevelBadge;
