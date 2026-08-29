export interface Activity {
  id: string;
  visit_id: string;
  rideName: string;
  waitTimeMinutes: number;
  notes?: string;
  riders?: string | string[];
}

export interface Visit {
  id: string;
  parkName: 'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom';
  visitDate: string;
  startTime: string;
  endTime?: string;
  attendees?: string | string[];
  memberEndTimes?: Record<string, string>;
  notes?: string;
  activities: Activity[];
}

export interface PhotoGridRecord {
  id: string;
  user_name: string;
  park_name: 'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom';
  color: string;
  image_url: string;
  caption?: string;
  created_at?: string;
}

export type MainTab = 'tracker' | 'analytics' | 'checklist' | 'rainbow';
export type TrackerSubTab = 'Visit a Park' | 'Past Visits';
export type AnalyticsSubTab = 'averages' | 'top10' | 'cards';
export type RainbowSubTab = 'stream' | 'badges';
