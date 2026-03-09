import { useNavigate } from 'react-router-dom';
import { useUserData } from '@/hooks/useUserData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LevelBadge from '@/components/LevelBadge';
import { ArrowLeft, Flame, Target, Award, Calendar, Zap, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const achievements = [
  { id: 'first-day', title: 'Primeiro Dia', description: 'Completou metas pela primeira vez', icon: Target, unlocked: true },
  { id: 'streak-3', title: '3 Dias Seguidos', description: 'Manteve streak de 3 dias', icon: Flame, unlocked: true },
  { id: 'streak-7', title: 'Semana Perfeita', description: 'Completou 100% em 7 dias seguidos', icon: Zap, unlocked: false },
  { id: 'level-up', title: 'Primeira Promoção', description: 'Subiu de nível pela primeira vez', icon: Award, unlocked: false },
  { id: 'month', title: '30 Dias', description: 'Usou o app por 30 dias', icon: Calendar, unlocked: false },
  { id: 'doctor', title: 'Acompanhamento', description: 'Vinculou-se a um médico', icon: Heart, unlocked: false },
];

const ProfilePage = () => {
  const { user } = useUserData();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    if (!authUser) return;
    supabase.from('profiles').select('name').eq('id', authUser.id).single().then(({ data }) => {
      if (data?.name) setProfileName(data.name);
    });
  }, [authUser]);

  const displayName = profileName || user.name;

  // Calculate streak (simplified: count consecutive days with >0 goals completed from daily records)
  const streak = user.dailyRecords.reduce((count, record) => {
    const completed = record.goals.filter(g => g.completed).length;
    return completed > 0 ? count + 1 : 0;
  }, 0);

  // Check today too
  const todayCompleted = user.goals.filter(g => g.completed).length;
  const currentStreak = todayCompleted > 0 ? streak + 1 : streak;

  const totalDays = user.dailyRecords.length + 1;

  // Unlock logic
  const unlockedAchievements = achievements.map(a => {
    let unlocked = false;
    if (a.id === 'first-day') unlocked = totalDays >= 1 && todayCompleted > 0;
    if (a.id === 'streak-3') unlocked = currentStreak >= 3;
    if (a.id === 'streak-7') unlocked = currentStreak >= 7;
    if (a.id === 'level-up') unlocked = user.weeklyHistory.some(w => w.status === 'promoted');
    if (a.id === 'month') unlocked = totalDays >= 30;
    if (a.id === 'doctor') unlocked = user.doctorConnection?.status === 'accepted';
    return { ...a, unlocked };
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-8 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Perfil</h1>
        </div>

        {/* Profile header */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-3xl font-bold text-foreground">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
            <p className="text-sm text-muted-foreground">Membro ativo</p>
          </div>
          <LevelBadge level={user.level} size="lg" />
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="flex flex-col items-center p-4">
              <Flame className="mb-1 h-5 w-5 text-destructive" />
              <span className="text-2xl font-bold text-foreground">{currentStreak}</span>
              <span className="text-xs text-muted-foreground">Streak</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center p-4">
              <Calendar className="mb-1 h-5 w-5 text-info" />
              <span className="text-2xl font-bold text-foreground">{totalDays}</span>
              <span className="text-xs text-muted-foreground">Dias</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center p-4">
              <Award className="mb-1 h-5 w-5 text-level-ouro" />
              <span className="text-2xl font-bold text-foreground">
                {unlockedAchievements.filter(a => a.unlocked).length}
              </span>
              <span className="text-xs text-muted-foreground">Conquistas</span>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conquistas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unlockedAchievements.map(a => {
              const Icon = a.icon;
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                    a.unlocked ? 'border-primary/30 bg-primary/5' : 'border-border opacity-40'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    a.unlocked ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <Icon className={`h-5 w-5 ${a.unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
