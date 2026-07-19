import { NextRequest, NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GarminConnect } = require('garmin-connect');

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { garminEmail, garminPassword } = body;

    if (!garminEmail || !garminPassword) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 401 });
    }

    // Login on the fly
    const gc = new GarminConnect({ username: garminEmail, password: garminPassword });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const os = require('os');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    const tokenFile = path.join(os.tmpdir(), 'purerun-garmin-token.json');

    try {
      await gc.loadTokenByFile(tokenFile);
      // Test if session is still valid by making a quick request or just proceeding
    } catch {
      // Token missing or invalid, need to login
      await gc.login();
      try {
        await gc.exportTokenToFile(tokenFile);
      } catch {} // ignore save errors
    }

    // Fetch the detailed payload for this activity to get the polyline
    let details;
    try {
      details = await gc.get(`https://connectapi.garmin.com/activity-service/activity/${id}/details`);
    } catch (apiErr: unknown) {
      // If it failed and we used a cached token, maybe token expired? Let's try fresh login once.
      const err = apiErr as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (err.response?.status === 401 || err.response?.status === 403) {
        await gc.login();
        await gc.exportTokenToFile(tokenFile);
        details = await gc.get(`https://connectapi.garmin.com/activity-service/activity/${id}/details`);
      } else {
        throw err;
      }
    }

    // Garmin polyline data is usually found in geoPolylineDTO
    if (details && details.geoPolylineDTO && details.geoPolylineDTO.polyline) {
      const points = details.geoPolylineDTO.polyline
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((p: any) => p.lat && p.lon)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((p: any) => [p.lat, p.lon]);
      
      if (points.length > 0) {
        return NextResponse.json({ points });
      }
    }

    // Try alternate paths: fallback to downloading GPX
    try {
      const gpxString = await gc.get(`https://connectapi.garmin.com/download-service/export/gpx/activity/${id}`);
      if (typeof gpxString === 'string' && gpxString.includes('<trkpt')) {
        const points: [number, number][] = [];
        const regex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)">/g;
        let match;
        
        while ((match = regex.exec(gpxString)) !== null) {
          points.push([parseFloat(match[1]), parseFloat(match[2])]);
        }
        
        if (points.length > 0) {
          return NextResponse.json({ points });
        }
      }
    } catch (gpxErr) {
       console.error('GPX fetch fallback failed:', gpxErr);
    }

    return NextResponse.json({ points: [] });
  } catch (error: unknown) {
    console.error('Garmin detailed fetch error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
