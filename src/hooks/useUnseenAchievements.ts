import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays } from 'date-fns';

const ACHIEVEMENTS_SEEN_EVENT = 'patient-achievements-seen';

export function notifyAchievementsSeen() {
  window.dispatchEvent(new CustomEvent(ACHIEVEMENTS_SEEN_EVENT));
}

/**
 * Light-weight hook that counts unseen achievements.
 * Does NOT use useUserData to avoid duplicate heavy fetches in BottomNav.
 */
export function useUnseenAchievements() {
  const { user: authUser } = useAuth();
  const [count, setCount] = useState(0);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const handler = () => setRefreshToken(t => t + 1);
    window.addEventListener(ACHIEVEMENTS_SEEN_EVENT, handler);
    return () => window.removeEventListener(ACHIEVEMENTS_SEEN_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!authUser) return;

    let cancelled = false;

    const check = async () => {
      try {
        // Fetch profile + last 30 daily records + weekly summaries + connection in parallel
        const today = format(new Date(), 'yyyy-MM-dd');
        const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

        const [profileRes, recordsRes, summariesRes, connRes] = await Promise.all([
          supabase.from('profiles').select('achievements_seen').eq('id', authUser.id).single(),
          supabase
            .from('daily_records')
            .select('record_date, goals')
            .eq('user_id', authUser.id)
            .gte('record_date', thirtyDaysAgo)
            .order('record_date', { ascending: true }),
          supabase
            .from('weekly_summaries')
            .select('status')
            .eq('user_id', authUser.id),
          supabase
            .from('doctor_connections')
            .select('status')
            .eq('user_id', authUser.id)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        const records = recordsRes.data ?? [];
        const totalDays = records.length;

        // Today's completion
        const todayRec = records.find(r => r.record_date === today);
        const todayGoals = (todayRec?.goals as { completed: boolean }[] | undefined) ?? [];
        const todayDone = todayGoals.filter(g => g.completed).length;

        // Streak calculation (from most recent backwards)
        let streak = 0;
        const sorted = [...records].sort((a, b) => b.record_date.localeCompare(a.record_date));
        for (const r of sorted) {
          const goals = r.goals as { completed: boolean }[];
          if (goals.some(g => g.completed)) streak++;
          else break;
        }
        const currentStreak = streak;

        const isPerfectDay = (goals: { completed: boolean }[]) => goals.length > 0 && goals.every(g => g.completed);
        const hasAnyPerfectDay = isPerfectDay(todayGoals) || records.some(r => isPerfectDay((r.goals as { completed: boolean }[]) ?? []));

        let perfectStreak = 0;
        if (isPerfectDay(todayGoals)) {
          perfectStreak = 1;
          for (const r of sorted) {
            if (r.record_date === today) continue;
            if (isPerfectDay((r.goals as { completed: boolean }[]) ?? [])) perfectStreak++;
            else break;
          }
        }

        const unlockedIds: string[] = [];
        if (totalDays >= 1 && todayDone > 0) unlockedIds.push('first-day');
        if (currentStreak >= 3) unlockedIds.push('streak-3');
        if (currentStreak >= 7) unlockedIds.push('streak-7');
        if (hasAnyPerfectDay) unlockedIds.push('perfect-day');
        if (perfectStreak >= 7) unlockedIds.push('perfect-week');
        if ((summariesRes.data ?? []).some(s => s.status === 'promoted')) unlockedIds.push('level-up');
        if (totalDays >= 30) unlockedIds.push('month');
        if (connRes.data?.status === 'accepted') unlockedIds.push('doctor');

        const seen = new Set(profileRes.data?.achievements_seen ?? []);
        const unseenCount = unlockedIds.filter(id => !seen.has(id)).length;
        setCount(unseenCount);
      } catch {
        // Fail silently - a broken badge count shouldn't crash the UI
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [authUser, refreshToken]);

  return { count };
}
