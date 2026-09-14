import { PARK_ATTRACTIONS_BY_LAND } from '../../../lib/constants';

const cleanStr = (s: string) =>
  (s || '')
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/&/g, 'and')
    .replace(/[’'"]/g, '')
    .replace(/[^a-z0-9]/g, '');

export const getLandForRide = (parkName: string, rideName: string): string => {
  const parkLands = PARK_ATTRACTIONS_BY_LAND[parkName];
  if (!parkLands) return 'Other Attractions';

  const cleanRide = cleanStr(rideName);

  for (const [landName, rides] of Object.entries(parkLands)) {
    for (const r of rides) {
      const cleanTarget = cleanStr(r);
      if (cleanRide.includes(cleanTarget) || cleanTarget.includes(cleanRide)) {
        return landName;
      }
    }
  }

  return 'Other Attractions';
};
