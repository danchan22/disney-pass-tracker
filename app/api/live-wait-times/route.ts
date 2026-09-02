import { NextResponse } from 'next/server';

// ThemeParks.wiki Park Entity UUIDs
const PARK_ENTITY_IDS: Record<string, string> = {
  'Magic Kingdom': '754884a6-d926-4f9a-b020-00a231221927',
  'Epcot': '47f90a27-0487-4315-a2b0-0d642c9d040a',
  'Hollywood Studios': '2888b78f-1caf-4e2f-82b3-7634289a0837',
  'Animal Kingdom': '1c84a229-886b-4b38-9b9d-142d0e760f81',
};

// Walt Disney World Destination UUID
const WDW_DESTINATION_ID = 'e957da17-1526-4352-a369-e54e70a21272';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parkName = searchParams.get('park') || '';

  const targetParkId = PARK_ENTITY_IDS[parkName];
  if (!targetParkId) {
    return NextResponse.json({ error: 'Invalid park specified' }, { status: 400 });
  }

  try {
    // 1. Fetch live data directly for the target park
    let res = await fetch(`https://api.themeparks.wiki/v1/entity/${targetParkId}/children`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 },
    });

    let liveItems: any[] = [];

    if (res.ok) {
      const data = await res.json();
      liveItems = data.children || data.liveData || [];
    } else {
      // 2. Fallback to Destination live feed if direct child query fails
      const fallbackRes = await fetch(`https://api.themeparks.wiki/v1/entity/${WDW_DESTINATION_ID}/children`, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 60 },
      });

      if (!fallbackRes.ok) {
        throw new Error(`ThemeParks API unavailable (${fallbackRes.status})`);
      }

      const fallbackData = await fallbackRes.json();
      const allChildren = fallbackData.children || fallbackData.liveData || [];
      liveItems = allChildren.filter((item: any) => item.parentId === targetParkId || item.parkId === targetParkId);
    }

    // Process and sort attractions
    const attractions = liveItems
      .filter((item: any) => item.entityType === 'ATTRACTION' || item.type === 'ATTRACTION')
      .map((item: any) => {
        const queueData = item.queue || item.liveData?.queue;
        const status = item.status || item.liveData?.status || 'CLOSED';
        const standbyWait = queueData?.STANDBY?.waitTime ?? queueData?.STANDBY?.postedWaitMinutes ?? null;

        return {
          id: item.id,
          name: item.name,
          status,
          waitTime: standbyWait,
        };
      })
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
