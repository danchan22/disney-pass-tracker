import { RIDE_TRIVIA_DB, HIDDEN_MICKEYS_DB } from './constants';
import { Visit, Activity } from './types';

export { compressImageToWebP } from './imageCompressor';

export const parseAttendees = (raw: string | string[] | undefined): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(s => s.trim()).filter(Boolean);
  const attendeesPart = raw.split('|ENDTIMES:')[0].split('|STARTTIMES:')[0];
  return attendeesPart.split(',').map(s => s.trim()).filter(Boolean);
};

export const parseMemberEndTimes = (raw: any, notes?: string): Record<string, string> => {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    if (raw.includes('|ENDTIMES:')) {
      try {
        const jsonStr = raw.split('|ENDTIMES:')[1].split('|')[0];
        return JSON.parse(jsonStr);
      } catch (e) {}
    }
    if (raw.trim().startsWith('{')) {
      try { return JSON.parse(raw); } catch (e) {}
    }
  }
  if (notes && typeof notes === 'string' && notes.trim().startsWith('{')) {
    try { return JSON.parse(notes); } catch (e) {}
  }
  return {};
};

export const parseMemberStartTimes = (raw: any, notes?: string): Record<string, string> => {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.includes('|STARTTIMES:')) {
    try {
      const jsonStr = raw.split('|STARTTIMES:')[1].split('|')[0];
      return JSON.parse(jsonStr);
    } catch (e) {}
  }
  return {};
};

export const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[d.getDay()]} ${month}/${day}/${year.toString().slice(-2)}`;
};

export const format12Hour = (timeStr?: string) => {
  if (!timeStr) return '';
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
};

export const parseTimeToMinutes = (timeStr?: string) => {
  if (!timeStr) return 0;
  // Standardize AM/PM string parsing if present
  let cleanTime = timeStr.trim();
  let isPM = cleanTime.toUpperCase().includes('PM');
  let isAM = cleanTime.toUpperCase().includes('AM');
  cleanTime = cleanTime.replace(/AM|PM/gi, '').trim();

  const [hrsRaw, minsRaw] = cleanTime.split(':').map(Number);
  let hrs = isNaN(hrsRaw) ? 0 : hrsRaw;
  const mins = isNaN(minsRaw) ? 0 : minsRaw;

  if (isPM && hrs < 12) hrs += 12;
  if (isAM && hrs === 12) hrs = 0;

  return (hrs * 60) + mins;
};

export const calculateVisitDuration = (startTime: string, endTime?: string) => {
  if (!startTime || !endTime) return '';
  const startMins = parseTimeToMinutes(startTime);
  const endMins = parseTimeToMinutes(endTime);
  const diff = endMins >= startMins ? (endMins - startMins) : ((1440 - startMins) + endMins);
  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hrs === 0) return `(${mins} min)`;
  return mins > 0 ? `(${hrs} hrs ${mins} min)` : `(${hrs} hrs)`;
};

export const formatMinutes = (totalMins: number) => {
  if (totalMins <= 0) return '0m';
  const hrs = Math.floor(totalMins / 60);
  const remMins = Math.round(totalMins % 60);
  if (hrs === 0) return `${remMins}m`;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
};

export const getPersonStartTime = (v: Visit, person: string) => {
  if (v.memberStartTimes && v.memberStartTimes[person]) {
    return v.memberStartTimes[person];
  }
  return v.startTime || '';
};

export const getPersonEndTime = (v: Visit, person: string) => {
  if (v.memberEndTimes && v.memberEndTimes[person]) {
    return v.memberEndTimes[person];
  }
  return v.endTime || '';
};

export const isPersonRider = (activity: Activity, visit: Visit, person: string) => {
  const activityRiders = parseAttendees(activity.riders);
  if (activityRiders.length > 0) {
    return activityRiders.includes(person);
  }
  return parseAttendees(visit.attendees).includes(person);
};

export const getRideTriviaFact = (rideName: string, parkName: string): string => {
  if (RIDE_TRIVIA_DB[rideName] && RIDE_TRIVIA_DB[rideName].length > 0) {
    const facts = RIDE_TRIVIA_DB[rideName];
    return facts[Math.floor(Math.random() * facts.length)];
  }

  const parkTrivia: Record<string, string[]> = {
    'Magic Kingdom': [
      'Imagineers built Cinderella Castle with forced perspective: the upper bricks and windows get smaller near the top to make it look taller!',
      'Underneath Magic Kingdom lies a 9-acre network of utility tunnels called "utilidors" so cast members and supplies move unseen.'
    ],
    'Epcot': [
      'The World Showcase promenade is 1.2 miles around the lagoon, featuring 11 country pavilions celebrating global culture!',
      'Spaceship Earth weighs approximately 16 million pounds—more than three times the weight of a fully loaded Space Shuttle!'
    ],
    'Hollywood Studios': [
      'The land of Galaxy’s Edge is set on the remote planet Batuu, designed with custom weathered architecture down to creature footprints in the concrete.',
      'Echo Lake is shaped like a giant footprint of Dinosaur Gertie, who sits beside the water offering ice cream!'
    ],
    'Animal Kingdom': [
      'The Tree of Life stands 145 feet tall and features over 300 intricately hand-carved animal figures woven into its trunk and branches.',
      'Disney’s Animal Kingdom was built with over 4 million trees, shrubs, and vines planted across 500 acres.'
    ]
  };

  const list = parkTrivia[parkName] || [
    'Did you know? Disney Imagineers hide unique details, props, and story clues throughout every line in the park!'
  ];
  return list[Math.floor(Math.random() * list.length)];
};

export const getHiddenMickeyFact = (rideName: string, parkName: string): string => {
  if (HIDDEN_MICKEYS_DB[rideName] && HIDDEN_MICKEYS_DB[rideName].length > 0) {
    const list = HIDDEN_MICKEYS_DB[rideName];
    return list[Math.floor(Math.random() * list.length)];
  }
  return `Keep an eye on queue walls, rusty gears, and floor tile patterns near the loading area for three circles forming a Mickey head!`;
};

export const get6AMCutoffISO = (): string => {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(6, 0, 0, 0);

  if (now < cutoff) {
    cutoff.setDate(cutoff.getDate() - 1);
  }
  return cutoff.toISOString();
};
