import { useNavigate } from 'react-router-dom';
import { useUserData } from '@/hooks/useUserData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LevelBadge from '@/components/LevelBadge';
import { ProfileEditModal } from '@/components/ProfileEditModal';
import { MonthCalendar } from '@/components/MonthCalendar';
import { ArrowLeft, Flame, Target, Award, Calendar, Zap, Heart, LogOut, Pencil, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const achievements = [
  { id: 'first-day', title: 'Primeiro Dia', description: 'Completou metas pela primeira vez', icon: Target },
  { id: 'streak-3', title: '3 Dias Seguidos', description: 'Manteve streak de 3 dias', icon: Flame },
  { id: 'streak-7', title: 'Semana Perfeita', description: 'Completou 100% em 7 dias seguidos', icon: Zap },
  { id: 'level-up', title: 'Primeira Promocao', description: 'Subiu de nivel pela primeira vez', icon: Award },
  { id: 'month', title: '30 Dias', description: 'Usou o app por 30 dias', icon: Calendar },
  { id: 'doctor', title: 'Acompanhamento', description: 'Vinculou-se a um medico', icon: Heart },
];

const ProfilePage = () => {
  const { user } = useUserData();
  const { user: authUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [statModal, setStatModal] = useState<null | 'streak' | 'days' | 'achievements'>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  useEffect(() => {
    if (!authUser) return;
    supabase.from('profiles').select('name, avatar_url').eq('id', authUser.id).single().then(({ data }) => {
      if (data?.name) setProfileName(data.name);
      if (data?.avatar_url) setProfileAvatar(data.avatar_url);
    });
  }, [authUser]);

  // Mark achievements as seen when opening profile
  useEffect(() => {
    if (!authUser) return;
    const unlocked = unlockedAchievements.filter(a => a.unlocked).map(a => a.id);
    if (unlocked.length === 0) return;
    supabase.from('profiles').update({ achievements_seen: unlocked }).eq('id', authUser.id).then();
  }, [authUser, user.dailyRecords.length, user.weeklyHistory.length]);

  const displayName = profileName || user.name;
  const displayAvatar = profileAvatar || user.avatarUrl;

  // Calculate streak
  const streak = user.dailyRecords.reduce((count, record) => {
    const completed = record.goals.filter(g => g.completed).length;
    return completed > 0 ? count + 1 : 0;
  }, 0);

  const todayCompleted = user.goals.filter(g => g.completed).length;
  const currentStreak = todayCompleted > 0 ? streak + 1 : streak;
  const longestStreak = Math.max(currentStreak, ...user.dailyRecords.map((_, i, arr) => {
    let s = 0;
    for (let j = i; j < arr.length; j++) {
      if (arr[j].goals.some(g => g.completed)) s++;
      else break;
    }
    return s;
  }));

  const totalDays = user.dailyRecords.length + 1;
  const today = format(new Date(), 'yyyy-MM-dd');

  // Set of all active days (>=1 goal completed)
  const activeDays = new Set<string>();
  user.dailyRecords.forEach(r => {
    if (r.goals.some(g => g.completed)) activeDays.add(r.date);
  });
  if (todayCompleted > 0) activeDays.add(today);

  // Set of dates belonging to current streak (consecutive active days ending today/yesterday)
  const streakDays = new Set<string>();
  const sortedRecords = [...user.dailyRecords].sort((a, b) => b.date.localeCompare(a.date));
  if (todayCompleted > 0) {
    streakDays.add(today);
    for (const r of sortedRecords) {
      if (r.goals.some(g => g.completed)) streakDays.add(r.date);
      else break;
    }
  } else {
    for (const r of sortedRecords) {
      if (r.goals.some(g => g.completed)) streakDays.add(r.date);
      else break;
    }
  }

  // Unlock logic + progress (0-100)
  const unlockedAchievements = achievements.map(a => {
    let unlocked = false;
    let progress = 0;
    let progressLabel = '';

    if (a.id === 'first-day') {
      unlocked = totalDays >= 1 && todayCompleted > 0;
      progress = unlocked ? 100 : Math.min(100, (todayCompleted / 1) * 100);
      progressLabel = unlocked ? 'Concluido' : `${todayCompleted}/1 meta hoje`;
    }
    if (a.id === 'streak-3') {
      unlocked = currentStreak >= 3;
      progress = Math.min(100, (currentStreak / 3) * 100);
      progressLabel = `${Math.min(currentStreak, 3)}/3 dias`;
    }
    if (a.id === 'streak-7') {
      unlocked = currentStreak >= 7;
      progress = Math.min(100, (currentStreak / 7) * 100);
      progressLabel = `${Math.min(currentStreak, 7)}/7 dias`;
    }
    if (a.id === 'level-up') {
      unlocked = user.weeklyHistory.some(w => w.status === 'promoted');
      progress = unlocked ? 100 : 0;
      progressLabel = unlocked ? 'Concluido' : 'Suba de nivel';
    }
    if (a.id === 'month') {
      unlocked = totalDays >= 30;
      progress = Math.min(100, (totalDays / 30) * 100);
      progressLabel = `${Math.min(totalDays, 30)}/30 dias`;
    }
    if (a.id === 'doctor') {
      unlocked = user.doctorConnection?.status === 'accepted';
      progress = unlocked ? 100 : 0;
      progressLabel = unlocked ? 'Vinculado' : 'Vincule-se a um medico';
    }

    return { ...a, unlocked, progress, progressLabel };
  });

  const unlockedCount = unlockedAchievements.filter(a => a.unlocked).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Perfil</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>

        {/* Profile header */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Avatar className="h-24 w-24">
            <AvatarImage src={displayAvatar ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-accent text-3xl font-bold text-foreground">
              {displayName.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{displayName || 'Paciente'}</h2>
            <p className="text-sm text-muted-foreground">Membro ativo</p>
          </div>
          <button onClick={() => navigate('/nivel')} className="transition-transform hover:scale-105">
            <LevelBadge level={user.level} size="lg" />
          </button>
        </div>

        {/* Stats (clicaveis) */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <button onClick={() => setStatModal('streak')} className="transition-transform hover:scale-105">
            <Card>
              <CardContent className="flex flex-col items-center p-4">
                <Flame className="mb-1 h-5 w-5 text-destructive" />
                <span className="text-2xl font-bold text-foreground">{currentStreak}</span>
                <span className="text-xs text-muted-foreground">Streak</span>
              </CardContent>
            </Card>
          </button>
          <button onClick={() => setStatModal('days')} className="transition-transform hover:scale-105">
            <Card>
              <CardContent className="flex flex-col items-center p-4">
                <Calendar className="mb-1 h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-foreground">{totalDays}</span>
                <span className="text-xs text-muted-foreground">Dias</span>
              </CardContent>
            </Card>
          </button>
          <button onClick={() => setStatModal('achievements')} className="transition-transform hover:scale-105">
            <Card>
              <CardContent className="flex flex-col items-center p-4">
                <Award className="mb-1 h-5 w-5 text-level-ouro" />
                <span className="text-2xl font-bold text-foreground">{unlockedCount}</span>
                <span className="text-xs text-muted-foreground">Conquistas</span>
              </CardContent>
            </Card>
          </button>
        </div>

        {/* Achievements */}
        <Card className="mb-6">
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
                    a.unlocked ? 'border-primary/30 bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    a.unlocked ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <Icon className={`h-5 w-5 ${a.unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium ${a.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>{a.title}</p>
                      <span className={`shrink-0 text-[10px] font-semibold ${a.unlocked ? 'text-primary' : 'text-muted-foreground'}`}>
                        {a.progressLabel}
                      </span>
                    </div>
                    <p className="mb-1.5 text-xs text-muted-foreground">{a.description}</p>
                    <Progress value={a.progress} className="h-1.5" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button
          variant="outline"
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>

      {/* Edit modal */}
      <ProfileEditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        currentName={displayName}
        currentAvatarUrl={displayAvatar}
        onSaved={(name, avatarUrl) => {
          setProfileName(name);
          setProfileAvatar(avatarUrl);
        }}
      />

      {/* Streak modal */}
      <Dialog open={statModal === 'streak'} onOpenChange={(o) => !o && setStatModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-destructive" /> Streak
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="flex flex-col items-center p-4">
                  <span className="text-3xl font-bold text-foreground">{currentStreak}</span>
                  <span className="text-xs text-muted-foreground">Streak Atual</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center p-4">
                  <span className="text-3xl font-bold text-foreground">{longestStreak}</span>
                  <span className="text-xs text-muted-foreground">Maior Streak</span>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardContent className="p-4">
                <MonthCalendar
                  highlightedDates={streakDays}
                  highlightClassName="bg-destructive/80 text-destructive-foreground font-bold"
                />
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-block h-3 w-3 rounded-sm bg-destructive/80" />
                  Dias da sua streak
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Days modal */}
      <Dialog open={statModal === 'days'} onOpenChange={(o) => !o && setStatModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Dias ativos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-center">
              <span className="text-4xl font-bold text-foreground">{activeDays.size}</span>
              <p className="mt-1 text-sm text-muted-foreground">dias com metas completadas</p>
            </div>
            <Card>
              <CardContent className="p-4">
                <MonthCalendar
                  highlightedDates={activeDays}
                  highlightClassName="bg-primary text-primary-foreground font-bold"
                />
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-block h-3 w-3 rounded-sm bg-primary" />
                  Dias com pelo menos 1 meta
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Achievements modal */}
      <Dialog open={statModal === 'achievements'} onOpenChange={(o) => !o && setStatModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-level-ouro" /> Conquistas
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              {unlockedCount} de {achievements.length} desbloqueadas
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {unlockedAchievements.map(a => {
                const Icon = a.icon;
                return (
                  <div
                    key={a.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                      a.unlocked ? 'border-primary/30 bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      a.unlocked ? 'bg-primary/20' : 'bg-muted'
                    }`}>
                      <Icon className={`h-5 w-5 ${a.unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium ${a.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>{a.title}</p>
                        <span className={`shrink-0 text-[10px] font-semibold ${a.unlocked ? 'text-primary' : 'text-muted-foreground'}`}>
                          {a.progressLabel}
                        </span>
                      </div>
                      <p className="mb-1.5 text-xs text-muted-foreground">{a.description}</p>
                      <Progress value={a.progress} className="h-1.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
