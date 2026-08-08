export function calculateVO2Cost(velocity: number): number {
  return -4.60 + 0.182258 * velocity + 0.000104 * velocity * velocity;
}

export function calculatePercentVO2Max(timeMinutes: number): number {
  return 0.8 + 0.1894393 * Math.exp(-0.012778 * timeMinutes) + 0.2989558 * Math.exp(-0.1932605 * timeMinutes);
}

export function calculateVDOT(distanceMeters: number, timeMinutes: number): number {
  const velocity = distanceMeters / timeMinutes;
  const vo2Cost = calculateVO2Cost(velocity);
  const percentVo2Max = calculatePercentVO2Max(timeMinutes);
  return vo2Cost / percentVo2Max;
}

export function calculateVelocityFromVO2(vo2: number): number {
  const a = 0.000104;
  const b = 0.182258;
  const c = -4.60 - vo2;
  const velocity = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
  return velocity;
}

export function velocityToPace(velocity: number): number {
  // velocity is in m/min.
  // 60000 / velocity gives seconds per kilometer.
  return 60000 / velocity;
}

export type PaceZones = {
  E: [number, number]; // Easy
  M: [number, number]; // Marathon
  T: [number, number]; // Threshold
  I: [number, number]; // Interval
  R: [number, number]; // Repetition
}

export function getPaceZones(vdot: number): PaceZones {
  // These percentages approximate Jack Daniels' intensity tables.
  const intensities = {
    E: [0.65, 0.74], // Easy pace
    M: [0.79, 0.84], // Marathon pace
    T: [0.88, 0.92], // Threshold pace
    I: [0.97, 1.02], // Interval pace
    R: [1.05, 1.15]  // Repetition pace
  };

  const getPaceRange = (minPct: number, maxPct: number): [number, number] => {
    const slowerVo2 = vdot * minPct;
    const fasterVo2 = vdot * maxPct;
    
    const slowerPace = Math.round(velocityToPace(calculateVelocityFromVO2(slowerVo2)));
    const fasterPace = Math.round(velocityToPace(calculateVelocityFromVO2(fasterVo2)));
    
    return [fasterPace, slowerPace]; // Return [fastest time, slowest time] in seconds
  };

  return {
    E: getPaceRange(intensities.E[0], intensities.E[1]),
    M: getPaceRange(intensities.M[0], intensities.M[1]),
    T: getPaceRange(intensities.T[0], intensities.T[1]),
    I: getPaceRange(intensities.I[0], intensities.I[1]),
    R: getPaceRange(intensities.R[0], intensities.R[1])
  };
}

export function formatPace(secondsPerKm: number): string {
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.floor(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
