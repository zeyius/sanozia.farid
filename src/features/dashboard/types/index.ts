// Types for Dashboard feature - keeping it simple
export interface DashboardStats {
  consumptionsCount: number;
  symptomsCount: number;
  stoolsCount: number;
  date: string;
}

export interface DashboardData {
  stats: DashboardStats;
  tips: string[];
  todayTip: string;
}
