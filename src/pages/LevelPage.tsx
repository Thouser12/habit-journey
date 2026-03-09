import { useNavigate } from 'react-router-dom';
import { useUserData } from '@/hooks/useUserData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LevelBadge from '@/components/LevelBadge';
import { LEVEL_LABELS, LEVEL_ORDER } from '@/data/goals';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Level } from '@/types/app';

const levelDescriptions: Record<Level, string> = {
  bronze: 'Você está começando sua jornada. Foque em criar hábitos básicos e construir consistência.',
  prata: 'Parabéns pela evolução! Agora seus desafios são mais intensos para consolidar sua disciplina.',
  ouro: 'Nível avançado! Suas metas exigem comprometimento real e mudança profunda de hábitos.',
  platina: 'Elite! Você domina a arte da disciplina. Mantenha a excelência e inspire outros.',
};

const LevelPage = () => {
  const { user } = useUserData();
  const navigate = useNavigate();
  const currentIdx = LEVEL_ORDER.indexOf(user.level);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-8 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Meu Nível</h1>
        </div>

        {/* Current level highlight */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <LevelBadge level={user.level} size="xl" />
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {levelDescriptions[user.level]}
          </p>
        </div>

        {/* All levels */}
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Todos os Níveis</h2>
        <div className="space-y-3">
          {LEVEL_ORDER.map((level, idx) => {
            const isCurrent = level === user.level;
            const isLocked = idx > currentIdx;
            return (
              <Card
                key={level}
                className={`transition-all ${isCurrent ? 'border-primary/40 bg-accent' : ''} ${isLocked ? 'opacity-50' : ''}`}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <LevelBadge level={level} size="md" showLabel={false} />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{LEVEL_LABELS[level]}</p>
                    <p className="text-xs text-muted-foreground">
                      {isCurrent ? 'Nível atual' : isLocked ? 'Bloqueado' : 'Concluído'}
                    </p>
                  </div>
                  {isCurrent && (
                    <ChevronRight className="h-5 w-5 text-primary" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LevelPage;
