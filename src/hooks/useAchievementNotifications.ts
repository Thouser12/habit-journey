import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

/**
 * Compares currently unlocked achievements with the user's achievements_seen list in Supabase.
 * Fires a toast for each newly unlocked achievement and updates achievements_seen.
 */
export function useAchievementNotifications(achievements: Achievement[]) {
  const { user: authUser } = useAuth();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!authUser || hasChecked.current) return;
    if (achievements.length === 0) return;

    hasChecked.current = true;

    const checkNew = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('achievements_seen')
        .eq('id', authUser.id)
        .single();

      const seen = new Set(profile?.achievements_seen ?? []);
      const unlocked = achievements.filter(a => a.unlocked);
      const newUnlocks = unlocked.filter(a => !seen.has(a.id));

      if (newUnlocks.length === 0) return;

      // Fire a toast for each new unlock (slight stagger)
      newUnlocks.forEach((a, i) => {
        setTimeout(() => {
          toast(`Conquista desbloqueada!`, {
            description: a.title,
            duration: 4500,
          });
        }, i * 600);
      });

      // Mark all as seen
      const allUnlockedIds = unlocked.map(a => a.id);
      await supabase
        .from('profiles')
        .update({ achievements_seen: allUnlockedIds })
        .eq('id', authUser.id);
    };

    checkNew();
  }, [authUser, achievements]);
}
