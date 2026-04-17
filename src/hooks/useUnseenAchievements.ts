import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays } from 'date-fns';

/**
 * Light-weight hook that counts unseen achievements.
 * Does NOT use useUserData to avoid duplicate heavy fetches in BottomNav.
 */
export function useUnseenAchievements() {
  const { user: authUser } = useAuth();
  const [count, setCount] = useState(0);

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

        const unlockedIds: string[] = [];
        if (totalDays >= 1 && todayDone > 0) unlockedIds.push('first-day');
        if (currentStreak >= 3) unlockedIds.push('streak-3');
        if (currentStreak >= 7) unlockedIds.push('streak-7');
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
  }, [authUser]);

  return { count };
}
