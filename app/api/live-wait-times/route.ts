import { NextResponse } from 'next/server';

const PARK_ENTITY_IDS: Record<string, string> = {
  'Magic Kingdom': '754884a6-d926-4f9a-b020-00a231221927',
  'Epcot': '47f90a27-0487-4315-a2b0-0d642c9d040a',
  'Hollywood Studios': '2888b78f-1caf-4e2f-82b3-7634289a0837',
  'Animal Kingdom': '1c84a229-886b-4b38-9b9d-142d0e760f81',
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
      // Fallback to WDW Resort-wide live feed if individual park entity 404s
      const fallbackRes = await fetch(`https://api.themeparks.wiki/v1/entity/e957da17-1526-4352-a369-e54e70a21272/live`, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 60 },
      });

      if (!fallbackRes.ok) throw new Error(`ThemeParks API error (${res.status})`);
      const fallbackData = await fallbackRes.json();
      const liveData = fallbackData.liveData || [];

      const attractions = liveData
        .filter((item: any) => item.entityType === 'ATTRACTION' && item.parkId === entityId)
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          status: item.status,
          waitTime: item.queue?.STANDBY?.waitTime ?? null,
        }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      return NextResponse.json({
        parkName,
        lastUpdated: new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' }),
        attractions,
      });
    }

    const data = await res.json();
    const liveData = data.liveData || [];

    const attractions = liveData
      .filter((item: any) => item.entityType === 'ATTRACTION')
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        status: item.status,
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
