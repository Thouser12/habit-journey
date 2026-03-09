import { Level } from '@/types/app';
import { Button } from '@/components/ui/button';

const LEVELS: Level[] = ['bronze', 'prata', 'ouro', 'platina'];
const LABELS: Record<Level, string> = {
  bronze: 'Bronze',
  prata: 'Prata',
  ouro: 'Ouro',
  platina: 'Platina',
};

interface Props {
  current: Level;
  onSwitch: (level: Level) => void;
}

const DevLevelSwitcher = ({ current, onSwitch }: Props) => (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-1.5 rounded-2xl border border-border bg-card/95 backdrop-blur-md px-3 py-2 shadow-lg">
    <span className="text-[10px] text-muted-foreground self-center mr-1 uppercase tracking-wider">DEV</span>
    {LEVELS.map((lvl) => (
      <Button
        key={lvl}
        size="sm"
        variant={current === lvl ? 'default' : 'ghost'}
        className="h-7 px-3 text-xs"
        onClick={() => onSwitch(lvl)}
      >
        {LABELS[lvl]}
      </Button>
    ))}
  </div>
);

export default DevLevelSwitcher;
