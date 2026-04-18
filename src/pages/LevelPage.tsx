import { useNavigate } from 'react-router-dom';
import { useUserData } from '@/hooks/useUserData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import LevelBadge from '@/components/LevelBadge';
import { LEVEL_LABELS, LEVEL_ORDER } from '@/data/goals';
import { ArrowLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Level } from '@/types/app';
import { differenceInDays, parseISO } from 'date-fns';

const levelDescriptions: Record<Level, string> = {
  bronze: 'Você esta começando sua jornada. Foque em criar hábitos básicos e construir consistência.',
  prata: 'Parabéns pela evolução! Agora seus desafios sao mais intensos para consolidar sua disciplina.',
  ouro: 'Nível avançado! Suas metas exigem comprometimento real e mudança profunda de hábitos.',
  platina: 'Elite! Você domina a arte da disciplina. Mantenha a excelência e inspire outros.',
};

const LevelPage = () => {
  const { user, getWeeklyProgress } = useUserData();
  const navigate = useNavigate();
  const currentIdx = LEVEL_ORDER.indexOf(user.level);
  const weeklyProgress = getWeeklyProgress();

  // Days remaining in current week cycle
  const daysSinceWeekStart = differenceInDays(new Date(), parseISO(user.weekStartDate));
  const daysRemaining = Math.max(0, 7 - daysSinceWeekStart);

  // Compute progression status
  const nextLevel = currentIdx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[currentIdx + 1] : null;
  const prevLevel = currentIdx > 0 ? LEVEL_ORDER[currentIdx - 1] : null;

  let statusText = '';
  let statusColor = '';
  let StatusIcon = Minus;

  if (weeklyProgress >= 70) {
    if (nextLevel) {
      statusText = `No ritmo para subir pra ${LEVEL_LABELS[nextLevel]}!`;
      statusColor = 'text-success';
      StatusIcon = TrendingUp;
    } else {
      statusText = 'Nível máximo! Mantenha acima de 30% para não cair.';
      statusColor = 'text-success';
      StatusIcon = TrendingUp;
    }
  } else if (weeklyProgress <= 30) {
    if (prevLevel) {
      statusText = `Cuidado! Risco de cair pra ${LEVEL_LABELS[prevLevel]}.`;
      statusColor = 'text-destructive';
      StatusIcon = TrendingDown;
    } else {
      statusText = 'Você está no nível inicial, sem riscos.';
      statusColor = 'text-muted-foreground';
      StatusIcon = Minus;
    }
  } else {
    statusText = 'Zona de manutenção. Mantenha o ritmo ou acelere pra subir.';
    statusColor = 'text-warning';
    StatusIcon = Minus;
  }

  const percentNeededToPromote = Math.max(0, 70 - weeklyProgress);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
        <div className="mb-8 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Meu Nível</h1>
        </div>

        {/* Current level */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <LevelBadge level={user.level} size="xl" />
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {levelDescriptions[user.level]}
          </p>
        </div>

        {/* Weekly progress card */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Progresso desta Semana</span>
              <span className="text-lg font-bold text-primary">{weeklyProgress}%</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Progress value={weeklyProgress} className="h-3" />
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                <span>0%</span>
                <span className="text-destructive">30%</span>
                <span className="text-success">70%</span>
                <span>100%</span>
              </div>
            </div>

            <div className={`flex items-start gap-2 text-sm ${statusColor}`}>
              <StatusIcon className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{statusText}</span>
            </div>

            {nextLevel && weeklyProgress < 70 && (
              <div className="rounded-lg border border-border bg-accent/40 p-3 text-xs text-muted-foreground">
                Você precisa de mais <strong className="text-foreground">{percentNeededToPromote}%</strong> para subir pra <strong className="text-foreground">{LEVEL_LABELS[nextLevel]}</strong>.
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
              <span className="text-muted-foreground">Dias restantes na semana</span>
              <span className="font-semibold text-foreground">
                {daysRemaining === 0 ? 'Fechando agora' : `${daysRemaining} dia${daysRemaining > 1 ? 's' : ''}`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* How progression works */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Como funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <p className="text-muted-foreground"><strong className="text-foreground">70% ou mais</strong> no fim da semana: sobe de nível</p>
            </div>
            <div className="flex items-start gap-2">
              <Minus className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <p className="text-muted-foreground"><strong className="text-foreground">30% a 70%</strong>: mantém o nível</p>
            </div>
            <div className="flex items-start gap-2">
              <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-muted-foreground"><strong className="text-foreground">30% ou menos</strong>: cai um nível</p>
            </div>
          </CardContent>
        </Card>

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
