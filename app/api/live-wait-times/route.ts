import { NextResponse } from 'next/server';
import { PARK_ATTRACTIONS } from '@/lib/constants';

// ThemeParks.wiki Park Entity UUIDs
const PARK_ENTITY_IDS: Record<string, string> = {
  'Magic Kingdom': '75ea578a-adc8-4116-a54d-dccb60765ef9',
  'Epcot': '47f90d2c-e191-4239-a466-5892ef59a88b',
  'Hollywood Studios': '288747d1-8b4f-4a64-867e-ea7c9b27bad8',
  'Animal Kingdom': '1c84a229-8862-4648-9c71-378ddd2c7693',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parkName = searchParams.get('park') || '';

  const entityId = PARK_ENTITY_IDS[parkName];
  if (!entityId) {
    return NextResponse.json({ error: 'Invalid park specified' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.themeparks.wiki/v1/entity/${entityId}/live`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`ThemeParks API returned status ${res.status}`);
    }

    const data = await res.json();
    const liveData = data.liveData || [];

    // Valid attraction list for current park
    const knownAttractions = (PARK_ATTRACTIONS[parkName] || []).map(a => a.toLowerCase().trim());

    // 1. Process Rides (Filtered against PARK_ATTRACTIONS)
    const rides = liveData
      .filter((item: any) => {
        const isAttraction = item.entityType === 'ATTRACTION' || item.type === 'ATTRACTION';
        if (!isAttraction) return false;
        const nameLower = (item.name || '').toLowerCase().trim();
        return knownAttractions.some(known => nameLower.includes(known) || known.includes(nameLower));
      })
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        status: item.status || 'CLOSED',
        waitTime: item.queue?.STANDBY?.waitTime ?? item.queue?.STANDBY?.postedWaitMinutes ?? null,
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    // 2. Process Shows & Parades (Unfiltered SHOW / EVENT entities with showtimes)
    const shows = liveData
      .filter((item: any) => {
        const isShow = item.entityType === 'SHOW' || item.entityType === 'EVENT' || item.type === 'SHOW' || item.type === 'EVENT';
        return isShow && item.showtimes && item.showtimes.length > 0;
      })
      .map((item: any) => {
        const formattedTimes = (item.showtimes || []).map((st: any) => {
          const rawTime = st.startTime || st;
          try {
            return new Date(rawTime).toLocaleTimeString('en-US', {
              timeZone: 'America/New_York',
              hour12: true,
              hour: 'numeric',
              minute: '2-digit'
            });
          } catch {
            return '';
          }
        }).filter(Boolean);

        return {
          id: item.id,
          name: item.name,
          status: item.status || 'OPERATING',
          showtimes: formattedTimes,
        };
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    return NextResponse.json({
      parkName,
      lastUpdated: new Date().toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour12: true,
        hour: 'numeric',
        minute: '2-digit'
      }),
      rides,
      shows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch live wait times' }, { status: 500 });
  }
}
