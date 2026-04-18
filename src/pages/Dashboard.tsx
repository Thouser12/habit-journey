import { useUserData } from '@/hooks/useUserData';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LevelBadge from '@/components/LevelBadge';
import TermsModal from '@/components/TermsModal';
import { LevelUpModal } from '@/components/LevelUpModal';
import { Stethoscope, Sparkles, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAchievementNotifications } from '@/hooks/useAchievementNotifications';

const Dashboard = () => {
  const { user, loading, toggleGoal, acceptTerms, getWeeklyProgress, levelUpEvent, dismissLevelUp } = useUserData();
  const navigate = useNavigate();

  // Compute achievements for notification check
  const streakCount = user.dailyRecords.reduce((count, record) => {
    const completed = record.goals.filter(g => g.completed).length;
    return completed > 0 ? count + 1 : 0;
  }, 0);
  const todayDone = user.goals.filter(g => g.completed).length;
  const currentStreak = todayDone > 0 ? streakCount + 1 : streakCount;
  const totalDays = user.dailyRecords.length + 1;
  const achievementList = [
    { id: 'first-day', title: 'Primeiro Dia', description: '', unlocked: totalDays >= 1 && todayDone > 0 },
    { id: 'streak-3', title: '3 Dias Seguidos', description: '', unlocked: currentStreak >= 3 },
    { id: 'streak-7', title: 'Semana Perfeita', description: '', unlocked: currentStreak >= 7 },
    { id: 'level-up', title: 'Primeira Promoção', description: '', unlocked: user.weeklyHistory.some(w => w.status === 'promoted') },
    { id: 'month', title: '30 Dias', description: '', unlocked: totalDays >= 30 },
    { id: 'doctor', title: 'Acompanhamento', description: '', unlocked: user.doctorConnection?.status === 'accepted' },
  ];

  useAchievementNotifications(loading ? [] : achievementList);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const completedCount = user.goals.filter(g => g.completed).length;
  const totalGoals = user.goals.length;
  const allDone = completedCount === totalGoals && totalGoals > 0;
  const weeklyProgress = getWeeklyProgress();

  return (
    <>
      <TermsModal open={!user.termsAccepted} onAccept={acceptTerms} />
      {levelUpEvent && (
        <LevelUpModal
          open={!!levelUpEvent}
          onClose={dismissLevelUp}
          fromLevel={levelUpEvent.from}
          toLevel={levelUpEvent.to}
        />
      )}
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Olá, {user.name || 'Paciente'}</h1>
              <p className="text-sm text-muted-foreground">Vamos evoluir hoje!</p>
            </div>
            <button onClick={() => navigate('/nivel')} className="transition-transform hover:scale-105">
              <LevelBadge level={user.level} size="md" showLabel={false} />
            </button>
          </div>

          {/* Doctor indicator */}
          {user.doctorConnection?.status === 'accepted' && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-accent px-4 py-2 text-sm">
              <Stethoscope className="h-4 w-4 text-primary" />
              <span>Vinculado ao Dr. {user.doctorConnection.doctorName}</span>
            </div>
          )}

          {/* Weekly progress */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Progresso Semanal</span>
                <span className="text-lg font-bold text-primary">{weeklyProgress}%</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={weeklyProgress} className="h-3" />
              <div className="flex items-center gap-2 text-xs">
                {weeklyProgress >= 70 ? (
                  <>
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                    <span className="text-success">No ritmo para subir de nível!</span>
                  </>
                ) : weeklyProgress <= 30 ? (
                  <>
                    <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-destructive">Cuidado: abaixo da zona segura</span>
                  </>
                ) : (
                  <>
                    <Minus className="h-3.5 w-3.5 text-warning" />
                    <span className="text-warning">Zona de manutenção</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today's goals */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Metas de Hoje</span>
                <span className={`text-sm font-semibold ${allDone ? 'text-success' : 'text-muted-foreground'}`}>
                  {completedCount}/{totalGoals}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {user.goals.map(goal => (
                <label
                  key={goal.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all hover:bg-accent/50 ${
                    goal.completed ? 'border-success/20 bg-success/5' : 'border-border'
                  }`}
                >
                  <Checkbox
                    checked={goal.completed}
                    onCheckedChange={() => toggleGoal(goal.id)}
                    className="mt-0.5"
                  />
                  <span className={`text-sm leading-relaxed ${goal.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {goal.text}
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Completion celebration */}
          {allDone && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-success/20 bg-success/5 p-6 text-center">
              <Sparkles className="h-10 w-10 text-success" />
              <p className="text-lg font-bold text-foreground">Parabéns!</p>
              <p className="text-sm text-muted-foreground">Todas as metas de hoje foram concluídas!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
