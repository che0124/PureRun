import axios from 'axios';
import { NormalizedActivity, speedToPaceStr } from './garmin';

// Polyline decoder for Strava maps
function decodePolyline(str: string, precision = 5): [number, number][] {
  let index = 0, lat = 0, lng = 0;
  const coordinates: [number, number][] = [];
  const shift = 10 ** precision;
  while (index < str.length) {
    let byte, shiftValue = 0, result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shiftValue;
      shiftValue += 5;
    } while (byte >= 0x20);
    lat += ((result & 1) ? ~(result >> 1) : (result >> 1));
    shiftValue = result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shiftValue;
      shiftValue += 5;
    } while (byte >= 0x20);
    lng += ((result & 1) ? ~(result >> 1) : (result >> 1));
    coordinates.push([lat / shift, lng / shift]);
  }
  return coordinates;
}

export async function refreshStravaToken(clientId: string, clientSecret: string, refreshToken: string) {
  try {
    const res = await axios.post('https://www.strava.com/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }, {
      headers: { 'Accept-Encoding': 'gzip' }
    });
    return res.data; // { access_token, refresh_token, expires_at }
  } catch (error: any) {
    throw new Error(`Strava Token Error: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
  }
}

export async function fetchStravaActivities(accessToken: string, limit: number = 10): Promise<NormalizedActivity[]> {
  try {
    const res = await axios.get(`https://www.strava.com/api/v3/athlete/activities?per_page=${limit}`, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Accept-Encoding': 'gzip'
      }
    });
    
    const activities = res.data;
    return activities.map((act: any) => {
      // Convert m/s to min/km
      const speed = act.average_speed || 0;
      const avgPaceMinPerKm = speed > 0 ? (1000 / 60 / speed) : null;
      const avgPaceStr = speedToPaceStr(speed);
      
      // Decode route if available
      let routeData = undefined;
      if (act.map && act.map.summary_polyline) {
        const decoded = decodePolyline(act.map.summary_polyline);
        routeData = JSON.stringify(decoded);
      }

      return {
        activityId: act.id,
        activityName: act.name,
        date: act.start_date_local.split('T')[0], // YYYY-MM-DD
        distanceKm: act.distance / 1000,
        durationMin: act.moving_time / 60,
        avgHr: act.average_heartrate ? Math.round(act.average_heartrate) : null,
        maxHr: act.max_heartrate ? Math.round(act.max_heartrate) : null,
        avgPaceMinPerKm,
        avgPaceStr,
        vO2MaxValue: null, // Strava API doesn't provide VO2Max directly here
        calories: act.calories || 0, // Need detailed fetch for accurate calories sometimes, or maybe it is there
        activityTypeKey: act.type.toLowerCase(),
        elevationGain: act.total_elevation_gain || null,
        cadence: act.average_cadence ? Math.round(act.average_cadence * 2) : null, // Strava gives 1 leg, multiply by 2 for SP
        strideLength: null,
        trainingEffect: null,
        routeData
      } as NormalizedActivity;
    });
  } catch (error: any) {
    throw new Error(`Strava Fetch Error: ${error.message}`);
  }
}
