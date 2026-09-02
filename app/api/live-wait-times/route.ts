import { NextResponse } from 'next/server';

// ThemeParks.wiki Entity UUIDs for Walt Disney World Parks
const PARK_ENTITY_IDS: Record<string, string> = {
  'Magic Kingdom': '754884A6-D926-4F9A-B020-00A231221927',
  'Epcot': '47F90A27-0487-4315-A2B0-0D642C9D040A',
  'Hollywood Studios': '2888B78F-1CAF-4E2F-82B3-7634289A0837',
  'Animal Kingdom': '1C84A229-886B-4B38-9B9D-142D0E760F81',
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
      next: { revalidate: 60 }, // Cache on server for 60 seconds
    });

    if (!res.ok) throw new Error(`ThemeParks API returned status ${res.status}`);

    const data = await res.json();
    const liveData = data.liveData || [];

    const attractions = liveData
      .filter((item: any) => item.entityType === 'ATTRACTION')
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        status: item.status, // OPERATING, DOWN, CLOSED, REFURBISHMENT
        waitTime: item.queue?.STANDBY?.waitTime ?? null,
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    return NextResponse.json({
      parkName,
      lastUpdated: new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' }),
      attractions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch wait times' }, { status: 500 });
  }
}
