// types.ts
export interface Activity {
  id: string;
  rideName: string;
  waitTimeMinutes: number;
  notes?: string; // Optional field for character names or extra info
}

export interface Visit {
  id: string;
  visitDate: string;
  startTime: string;
  endTime: string;
  parkName: 'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom';
  attendees: string;
  activities: Activity[];
}
