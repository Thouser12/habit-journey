import { useUserData } from '@/hooks/useUserData';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LevelBadge from '@/components/LevelBadge';
import TermsModal from '@/components/TermsModal';
import { History, Stethoscope, Sparkles, CheckCircle2 } from 'lucide-react';

const Dashboard = () => {
  const { user, toggleGoal, acceptTerms, getWeeklyProgress } = useUserData();
  const navigate = useNavigate();
  const completedCount = user.goals.filter(g => g.completed).length;
  const totalGoals = user.goals.length;
  const allDone = completedCount === totalGoals;
  const weeklyProgress = getWeeklyProgress();

  return (
    <>
      <TermsModal open={!user.termsAccepted} onAccept={acceptTerms} />
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-lg px-4 py-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Olá, {user.name} 👋</h1>
              <p className="text-sm text-muted-foreground">Vamos evoluir hoje!</p>
            </div>
            <LevelBadge level={user.level} size="lg" />
          </div>

          {/* Doctor indicator */}
          {user.doctorConnection?.status === 'accepted' && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-accent/50 px-4 py-2 text-sm">
              <Stethoscope className="h-4 w-4 text-primary" />
              <span>Vinculado ao {user.doctorConnection.doctorName}</span>
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
            <CardContent>
              <Progress value={weeklyProgress} className="h-3" />
            </CardContent>
          </Card>

          {/* Today's goals */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Metas de Hoje</span>
                <span className={`text-sm font-semibold ${allDone ? 'text-primary' : 'text-muted-foreground'}`}>
                  {completedCount}/{totalGoals}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.goals.map(goal => (
                <label
                  key={goal.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-all hover:bg-accent/50 has-[data-state=checked]:border-primary/30 has-[data-state=checked]:bg-primary/5"
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
            <div className="mb-6 flex flex-col items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
              <Sparkles className="h-10 w-10 text-primary" />
              <p className="text-lg font-bold text-foreground">Parabéns! 🎉</p>
              <p className="text-sm text-muted-foreground">Todas as metas de hoje foram concluídas!</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/historico')}>
              <History className="mr-2 h-4 w-4" />
              Histórico
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate('/medico')}>
              <Stethoscope className="mr-2 h-4 w-4" />
              Médico
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
