import { cookies } from 'next/headers';

export async function getDeviceId(): Promise<string> {
  const cookieStore = await cookies();
  const deviceId = cookieStore.get('device-id')?.value;
  
  if (!deviceId) {
    // If middleware didn't run or cookie is missing, return a fallback.
    // In normal Next.js flow, middleware ensures it exists before the page renders.
    return 'default-device';
  }
  
  return deviceId;
}
