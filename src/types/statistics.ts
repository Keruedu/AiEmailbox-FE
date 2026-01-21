export interface EmailStatusStats {
  status: string;
  count: number;
}

export interface EmailTrendPoint {
  date: string;
  count: number;
}

export interface TopSender {
  name: string;
  email: string;
  count: number;
}

export interface DailyActivity {
  dayOfWeek: number;
  hour: number;
  count: number;
}

export interface StatisticsResponse {
  statusStats: EmailStatusStats[];
  emailTrend: EmailTrendPoint[];
  topSenders: TopSender[];
  dailyActivity: DailyActivity[];
  totalEmails: number;
  unreadCount: number;
  starredCount: number;
  period: string;
}
