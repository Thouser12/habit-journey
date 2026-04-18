import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import LevelBadge from '@/components/LevelBadge';
import { LEVEL_LABELS } from '@/data/goals';
import { Level } from '@/types/app';
import { Sparkles } from 'lucide-react';

interface LevelUpModalProps {
  open: boolean;
  onClose: () => void;
  fromLevel: Level;
  toLevel: Level;
}

export function LevelUpModal({ open, onClose, fromLevel, toLevel }: LevelUpModalProps) {
  useEffect(() => {
    if (!open) return;

    // Fire confetti burst
    const duration = 2500;
    const end = Date.now() + duration;

    const colors = ['#14B8A6', '#6EA8D6', '#F2D189', '#D8F0FF'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();

    // Big burst in the middle
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { x: 0.5, y: 0.4 },
      colors,
    });
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center gap-6 py-6 text-center">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-4 w-4" />
            Parabéns!
            <Sparkles className="h-4 w-4" />
          </div>

          <div className="animate-in zoom-in-50 duration-700">
            <LevelBadge level={toLevel} size="xl" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">Você subiu de nível!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Você evoluiu de <strong className="text-foreground">{LEVEL_LABELS[fromLevel]}</strong> para <strong className="text-primary">{LEVEL_LABELS[toLevel]}</strong>
            </p>
          </div>

          <Button className="w-full" onClick={onClose}>
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
