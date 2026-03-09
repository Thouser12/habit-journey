import { useUserData } from '@/hooks/useUserData';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LevelBadge from '@/components/LevelBadge';
import TermsModal from '@/components/TermsModal';
import { History, Stethoscope, Sparkles, User, Shield } from 'lucide-react';
import DevLevelSwitcher from '@/components/DevLevelSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, toggleGoal, acceptTerms, getWeeklyProgress, setLevel } = useUserData();
  const { user: authUser } = useAuth();
  const [profileName, setProfileName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!authUser) return;
    supabase.from('profiles').select('name').eq('id', authUser.id).single().then(({ data }) => {
      if (data?.name) setProfileName(data.name);
    });
  }, [authUser]);
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
              <h1 className="text-2xl font-bold text-foreground">Olá, {profileName || user.name}</h1>
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
            <div className="mb-6 flex flex-col items-center gap-2 rounded-xl border border-success/20 bg-success/5 p-6 text-center">
              <Sparkles className="h-10 w-10 text-success" />
              <p className="text-lg font-bold text-foreground">Parabéns!</p>
              <p className="text-sm text-muted-foreground">Todas as metas de hoje foram concluídas!</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => navigate('/historico')}>
              <History className="mr-2 h-4 w-4" />
              Histórico
            </Button>
            <Button variant="outline" onClick={() => navigate('/medico')}>
              <Stethoscope className="mr-2 h-4 w-4" />
              Médico
            </Button>
            <Button variant="outline" onClick={() => navigate('/nivel')}>
              <Shield className="mr-2 h-4 w-4" />
              Meu Nível
            </Button>
            <Button variant="outline" onClick={() => navigate('/perfil')}>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </Button>
          </div>

          <DevLevelSwitcher current={user.level} onSwitch={setLevel} />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
