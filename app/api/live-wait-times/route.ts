import { NextResponse } from 'next/server';

// Verified ThemeParks.wiki Park Entity UUIDs for Walt Disney World
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

    const attractions = liveData
      .filter((item: any) => item.entityType === 'ATTRACTION' || item.type === 'ATTRACTION')
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        status: item.status || 'CLOSED',
        waitTime: item.queue?.STANDBY?.waitTime ?? item.queue?.STANDBY?.postedWaitMinutes ?? null,
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    return NextResponse.json({
      parkName,
      lastUpdated: new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' }),
      attractions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch live wait times' }, { status: 500 });
  }
}
