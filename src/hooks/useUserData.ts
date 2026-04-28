import { useState, useEffect, useCallback } from 'react';
import { UserData, Goal, Level, DailyRecord, WeeklyRecord, DoctorConnection } from '@/types/app';
import { GOALS_BY_LEVEL, LEVEL_ORDER } from '@/data/goals';
import { format, differenceInDays, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getCachedProfile, setCachedProfile } from '@/lib/profileCache';

const STORAGE_KEY = 'health-tracker-user';

function getToday() {
  return format(new Date(), 'yyyy-MM-dd');
}

function createGoals(level: Level, customGoals?: string[]): Goal[] {
  const texts = customGoals && customGoals.length === 10 ? customGoals : GOALS_BY_LEVEL[level];
  return texts.map((text, i) => ({ id: `goal-${i}`, text, completed: false }));
}

function getDefaultUser(): UserData {
  return {
    name: '',
    avatarUrl: null,
    level: 'bronze',
    termsAccepted: false,
    currentDay: getToday(),
    goals: createGoals('bronze'),
    weekStartDate: getToday(),
    dailyRecords: [],
    weeklyHistory: [],
    doctorConnection: null,
  };
}

export interface LevelUpEvent {
  from: Level;
  to: Level;
}

export function useUserData() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserData>(getDefaultUser);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [levelUpEvent, setLevelUpEvent] = useState<LevelUpEvent | null>(null);

  useEffect(() => {
    if (!authUser || initialized) return;
    // Hydrate name/avatar/level from cache for instant render. Source of
    // truth is still Supabase, which loadFromSupabase fetches right after.
    const cached = getCachedProfile(authUser.id);
    if (cached) {
      const cachedLevel = LEVEL_ORDER.includes(cached.level as Level)
        ? (cached.level as Level)
        : 'bronze';
      setUser(prev => ({
        ...prev,
        name: cached.name,
        avatarUrl: cached.avatarUrl,
        level: cachedLevel,
        goals: prev.goals.length === 0 ? createGoals(cachedLevel) : prev.goals,
      }));
    }
    loadFromSupabase();
  }, [authUser]);

  const loadFromSupabase = async () => {
    if (!authUser) return;

    const today = getToday();

    // Run one-time localStorage migration
    await migrateFromLocalStorage(authUser.id);

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, level, terms_accepted, week_start_date, avatar_url')
      .eq('id', authUser.id)
      .single();

    let level = (profile?.level ?? 'bronze') as Level;
    if (!LEVEL_ORDER.includes(level)) level = 'bronze';
    let weekStartDate = profile?.week_start_date ?? today;
    const termsAccepted = profile?.terms_accepted ?? false;
    const name = profile?.name ?? '';
    const avatarUrl = profile?.avatar_url ?? null;

    // Fetch doctor connection
    const { data: connData } = await supabase
      .from('doctor_connections')
      .select('doctor_id, doctor_name, status, custom_goals')
      .eq('user_id', authUser.id)
      .maybeSingle();

    const doctorConnection: DoctorConnection | null = connData ? {
      doctorId: connData.doctor_id,
      doctorName: connData.doctor_name,
      status: connData.status as 'pending' | 'accepted' | 'rejected',
      customGoals: connData.custom_goals as string[] | undefined,
    } : null;

    // Fetch doctor-assigned goals if connected
    let doctorGoalTexts: string[] | undefined;
    if (doctorConnection?.status === 'accepted') {
      const { data: dGoals } = await supabase
        .from('goals')
        .select('title')
        .eq('patient_id', authUser.id)
        .eq('is_active', true);
      if (dGoals && dGoals.length >= 10) {
        doctorGoalTexts = dGoals.map(g => g.title);
      }
    }

    // Fetch all daily records
    const { data: allRecords } = await supabase
      .from('daily_records')
      .select('record_date, goals, level')
      .eq('user_id', authUser.id)
      .order('record_date', { ascending: true });

    // Fetch weekly summaries
    const { data: weeklySummaries } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('user_id', authUser.id)
      .order('week_start', { ascending: true });

    let weeklyHistory: WeeklyRecord[] = (weeklySummaries ?? []).map(s => ({
      weekStart: s.week_start,
      weekEnd: s.week_end,
      percentage: s.percentage,
      levelBefore: s.level_before as Level,
      levelAfter: s.level_after as Level,
      status: s.status as 'promoted' | 'maintained' | 'demoted',
    }));

    // Check week cycle
    const daysSinceWeekStart = differenceInDays(parseISO(today), parseISO(weekStartDate));
    if (daysSinceWeekStart >= 7) {
      const previousLevel = level;
      const result = await processWeekEnd(authUser.id, level, weekStartDate, today, allRecords ?? []);
      level = result.newLevel;
      weekStartDate = today;
      weeklyHistory = [...weeklyHistory, result.record];
      if (result.newLevel !== previousLevel && result.record.status === 'promoted') {
        setLevelUpEvent({ from: previousLevel, to: result.newLevel });
      }
    }

    // Get or create today's daily record
    const todayRecord = (allRecords ?? []).find(r => r.record_date === today);
    let goals: Goal[];

    if (todayRecord) {
      goals = todayRecord.goals as Goal[];
    } else {
      goals = createGoals(level, doctorGoalTexts);
      await supabase.from('daily_records').insert({
        user_id: authUser.id,
        record_date: today,
        level,
        goals: goals as any,
      });
    }

    // Map past daily records for profile/streak calculations
    const dailyRecords: DailyRecord[] = (allRecords ?? [])
      .filter(r => r.record_date !== today)
      .map(r => ({
        date: r.record_date,
        goals: r.goals as Goal[],
        level: r.level as Level,
      }));

    setUser({
      name,
      avatarUrl,
      level,
      termsAccepted,
      currentDay: today,
      goals,
      weekStartDate,
      dailyRecords,
      weeklyHistory,
      doctorConnection,
    });
    setCachedProfile(authUser.id, { name, avatarUrl, level });
    setLoading(false);
    setInitialized(true);
  };

  const toggleGoal = useCallback((goalId: string) => {
    if (!authUser) return;

    setUser(prev => {
      const updatedGoals = prev.goals.map(g =>
        g.id === goalId ? { ...g, completed: !g.completed } : g
      );

      // Fire-and-forget Supabase update
      supabase.from('daily_records').update({
        goals: updatedGoals as any,
        updated_at: new Date().toISOString(),
      })
        .eq('user_id', authUser.id)
        .eq('record_date', getToday())
        .then();

      return { ...prev, goals: updatedGoals };
    });
  }, [authUser]);

  const acceptTerms = useCallback(() => {
    if (!authUser) return;
    setUser(prev => ({ ...prev, termsAccepted: true }));
    supabase.from('profiles').update({
      terms_accepted: true,
      updated_at: new Date().toISOString(),
    }).eq('id', authUser.id).then();
  }, [authUser]);

  // No-ops: DoctorPage handles connections directly via Supabase
  const requestDoctor = useCallback((_doctorId: string) => {}, []);
  const removeDoctor = useCallback(() => {}, []);

  const getWeeklyProgress = useCallback(() => {
    const today = getToday();
    const weekStart = user.weekStartDate;

    const todayCompleted = user.goals.filter(g => g.completed).length;
    const todayTotal = user.goals.length;

    const weekRecords = user.dailyRecords.filter(r => r.date >= weekStart && r.date <= today);

    let totalCompleted = todayCompleted;
    let totalGoals = todayTotal;

    weekRecords.forEach(r => {
      totalCompleted += r.goals.filter(g => g.completed).length;
      totalGoals += r.goals.length;
    });

    return totalGoals > 0 ? Math.round((totalCompleted / totalGoals) * 100) : 0;
  }, [user]);

  const setLevel = useCallback((level: Level) => {
    if (!authUser) return;
    const customGoals = user.doctorConnection?.status === 'accepted' ? user.doctorConnection.customGoals : undefined;
    const newGoals = createGoals(level, customGoals);

    setUser(prev => ({ ...prev, level, goals: newGoals }));
    setCachedProfile(authUser.id, { level });

    supabase.from('profiles').update({
      level,
      updated_at: new Date().toISOString(),
    }).eq('id', authUser.id).then();

    supabase.from('daily_records').update({
      level,
      goals: newGoals as any,
      updated_at: new Date().toISOString(),
    }).eq('user_id', authUser.id).eq('record_date', getToday()).then();
  }, [authUser, user]);

  const dismissLevelUp = useCallback(() => setLevelUpEvent(null), []);

  return {
    user,
    loading,
    toggleGoal,
    acceptTerms,
    requestDoctor,
    removeDoctor,
    getWeeklyProgress,
    setLevel,
    levelUpEvent,
    dismissLevelUp,
  };
}

async function processWeekEnd(
  userId: string,
  currentLevel: Level,
  weekStartDate: string,
  today: string,
  allRecords: { record_date: string; goals: any; level: string }[],
): Promise<{ newLevel: Level; record: WeeklyRecord }> {
  const weekRecords = allRecords.filter(
    r => r.record_date >= weekStartDate && r.record_date < today
  );

  let totalCompleted = 0;
  let totalGoals = 0;
  weekRecords.forEach(r => {
    const goals = r.goals as Goal[];
    totalCompleted += goals.filter(g => g.completed).length;
    totalGoals += goals.length;
  });

  const percentage = totalGoals > 0 ? Math.round((totalCompleted / totalGoals) * 100) : 0;
  const currentIdx = LEVEL_ORDER.indexOf(currentLevel);

  let newLevel = currentLevel;
  let status: WeeklyRecord['status'] = 'maintained';

  if (percentage >= 70 && currentIdx < LEVEL_ORDER.length - 1) {
    newLevel = LEVEL_ORDER[currentIdx + 1];
    status = 'promoted';
  } else if (percentage <= 30 && currentIdx > 0) {
    newLevel = LEVEL_ORDER[currentIdx - 1];
    status = 'demoted';
  }

  const record: WeeklyRecord = {
    weekStart: weekStartDate,
    weekEnd: today,
    percentage,
    levelBefore: currentLevel,
    levelAfter: newLevel,
    status,
  };

  // Write to Supabase
  await supabase.from('weekly_summaries').upsert({
    user_id: userId,
    week_start: weekStartDate,
    week_end: today,
    percentage,
    level_before: currentLevel,
    level_after: newLevel,
    status,
  }, { onConflict: 'user_id,week_start' });

  await supabase.from('profiles').update({
    level: newLevel,
    week_start_date: today,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);

  return { newLevel, record };
}

async function migrateFromLocalStorage(userId: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const data = JSON.parse(raw) as UserData;

    // Migrate daily records
    if (data.dailyRecords.length > 0) {
      const records = data.dailyRecords.map(r => ({
        user_id: userId,
        record_date: r.date,
        level: r.level,
        goals: r.goals as any,
      }));
      await supabase.from('daily_records').upsert(records, { onConflict: 'user_id,record_date' });
    }

    // Migrate weekly history
    if (data.weeklyHistory.length > 0) {
      const summaries = data.weeklyHistory.map(w => ({
        user_id: userId,
        week_start: w.weekStart,
        week_end: w.weekEnd,
        percentage: w.percentage,
        level_before: w.levelBefore,
        level_after: w.levelAfter,
        status: w.status,
      }));
      await supabase.from('weekly_summaries').upsert(summaries, { onConflict: 'user_id,week_start' });
    }

    // Update profile with current state
    await supabase.from('profiles').update({
      level: data.level,
      week_start_date: data.weekStartDate,
      terms_accepted: data.termsAccepted,
      updated_at: new Date().toISOString(),
    }).eq('id', userId);

    // Migration complete, remove localStorage
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to migrate localStorage data:', err);
  }
}
