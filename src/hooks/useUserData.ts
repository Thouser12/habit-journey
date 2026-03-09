import { useState, useEffect, useCallback } from 'react';
import { UserData, Goal, Level, DailyRecord, WeeklyRecord } from '@/types/app';
import { GOALS_BY_LEVEL, LEVEL_ORDER } from '@/data/goals';
import { format, differenceInDays, parseISO, subDays } from 'date-fns';

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
    name: 'João',
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

function loadUser(): UserData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return getDefaultUser();
}

export function useUserData() {
  const [user, setUser] = useState<UserData>(loadUser);

  const save = useCallback((data: UserData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setUser(data);
  }, []);

  // Check day change and week cycle on mount / state change
  useEffect(() => {
    const today = getToday();
    let updated = { ...user };
    let changed = false;

    // Day change: save previous day record, reset goals
    if (updated.currentDay !== today) {
      // Save previous day
      const prevRecord: DailyRecord = {
        date: updated.currentDay,
        goals: updated.goals,
        level: updated.level,
      };
      updated.dailyRecords = [...updated.dailyRecords, prevRecord];

      // Check week cycle
      const daysSinceWeekStart = differenceInDays(parseISO(today), parseISO(updated.weekStartDate));
      if (daysSinceWeekStart >= 7) {
        updated = processWeekEnd(updated);
      }

      // Reset goals for new day
      const customGoals = updated.doctorConnection?.status === 'accepted' ? updated.doctorConnection.customGoals : undefined;
      updated.goals = createGoals(updated.level, customGoals);
      updated.currentDay = today;
      changed = true;
    }

    if (changed) save(updated);
  }, []);

  const toggleGoal = useCallback((goalId: string) => {
    setUser(prev => {
      const updated = {
        ...prev,
        goals: prev.goals.map(g => g.id === goalId ? { ...g, completed: !g.completed } : g),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const acceptTerms = useCallback(() => {
    save({ ...user, termsAccepted: true });
  }, [user, save]);

  const requestDoctor = useCallback((doctorId: string) => {
    // Simulate: auto-accept after setting pending
    const connection = {
      doctorId,
      doctorName: `Dr. ${doctorId.toUpperCase()}`,
      status: 'pending' as const,
    };
    save({ ...user, doctorConnection: connection });
    // Simulate acceptance after 3 seconds
    setTimeout(() => {
      setUser(prev => {
        if (prev.doctorConnection?.doctorId === doctorId) {
          const accepted = {
            ...prev,
            doctorConnection: { ...prev.doctorConnection, status: 'accepted' as const },
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(accepted));
          return accepted;
        }
        return prev;
      });
    }, 3000);
  }, [user, save]);

  const removeDoctor = useCallback(() => {
    const updated = {
      ...user,
      doctorConnection: null,
      goals: createGoals(user.level),
    };
    save(updated);
  }, [user, save]);

  const getWeeklyProgress = useCallback(() => {
    const today = getToday();
    const weekStart = user.weekStartDate;
    const allRecords = [...user.dailyRecords];
    
    // Include today's goals
    const todayCompleted = user.goals.filter(g => g.completed).length;
    const todayTotal = user.goals.length;
    
    // Get records from this week
    const weekRecords = allRecords.filter(r => r.date >= weekStart && r.date <= today);
    
    let totalCompleted = todayCompleted;
    let totalGoals = todayTotal;
    
    weekRecords.forEach(r => {
      totalCompleted += r.goals.filter(g => g.completed).length;
      totalGoals += r.goals.length;
    });

    return totalGoals > 0 ? Math.round((totalCompleted / totalGoals) * 100) : 0;
  }, [user]);

  const setLevel = useCallback((level: Level) => {
    const customGoals = user.doctorConnection?.status === 'accepted' ? user.doctorConnection.customGoals : undefined;
    save({ ...user, level, goals: createGoals(level, customGoals) });
  }, [user, save]);

  return {
    user,
    toggleGoal,
    acceptTerms,
    requestDoctor,
    removeDoctor,
    getWeeklyProgress,
    setLevel,
  };
}

function processWeekEnd(data: UserData): UserData {
  const weekRecords = data.dailyRecords.filter(r => r.date >= data.weekStartDate);
  
  let totalCompleted = 0;
  let totalGoals = 0;
  weekRecords.forEach(r => {
    totalCompleted += r.goals.filter(g => g.completed).length;
    totalGoals += r.goals.length;
  });

  const percentage = totalGoals > 0 ? Math.round((totalCompleted / totalGoals) * 100) : 0;
  const currentIdx = LEVEL_ORDER.indexOf(data.level);
  
  let newLevel = data.level;
  let status: WeeklyRecord['status'] = 'maintained';

  if (percentage >= 70 && currentIdx < LEVEL_ORDER.length - 1) {
    newLevel = LEVEL_ORDER[currentIdx + 1];
    status = 'promoted';
  } else if (percentage <= 30 && currentIdx > 0) {
    newLevel = LEVEL_ORDER[currentIdx - 1];
    status = 'demoted';
  }

  const weeklyRecord: WeeklyRecord = {
    weekStart: data.weekStartDate,
    weekEnd: data.currentDay,
    percentage,
    levelBefore: data.level,
    levelAfter: newLevel,
    status,
  };

  return {
    ...data,
    level: newLevel,
    weeklyHistory: [...data.weeklyHistory, weeklyRecord],
    weekStartDate: getToday(),
  };
}
