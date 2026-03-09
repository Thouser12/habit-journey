export type Level = 'bronze' | 'prata' | 'ouro' | 'platina';

export interface Goal {
  id: string;
  text: string;
  completed: boolean;
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  goals: Goal[];
  level: Level;
}

export interface WeeklyRecord {
  weekStart: string;
  weekEnd: string;
  percentage: number;
  levelBefore: Level;
  levelAfter: Level;
  status: 'promoted' | 'maintained' | 'demoted';
}

export interface DoctorConnection {
  doctorId: string;
  doctorName: string;
  status: 'pending' | 'accepted' | 'rejected';
  customGoals?: string[];
}

export interface UserData {
  name: string;
  level: Level;
  termsAccepted: boolean;
  currentDay: string;
  goals: Goal[];
  weekStartDate: string;
  dailyRecords: DailyRecord[];
  weeklyHistory: WeeklyRecord[];
  doctorConnection: DoctorConnection | null;
}
