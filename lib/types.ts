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
  memberStartTimes?: Record<string, string>;
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

export interface ParkingLog {
  id: string;
  created_at?: string;
  park_name: 'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom';
  section_name: string;
  spot_name: string;
  row_number: string;
  parked_by: string;
}

export type MainTab = 'tracker' | 'analytics' | 'checklist' | 'rainbow';
export type TrackerSubTab = 'Today' | 'History' | 'Parking';
export type AnalyticsSubTab = 'averages' | 'top10' | 'cards';
export type RainbowSubTab = 'stream' | 'badges';
