// Calculate distance between two GPS points using Haversine formula
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function formatDistance(meters?: number): string {
  if (meters === undefined || meters === null) return 'N/A';
  if (meters < 1000) {
    return `${Math.round(meters)} meters`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

export function isWithinGeofence(
  distanceMeters: number,
  allowedRadiusMeters: number
): boolean {
  return distanceMeters <= allowedRadiusMeters;
}

// Generate realistic simulated coordinates nearby for demo testing
export function generateSimulatedPosition(
  baseLat: number,
  baseLng: number,
  offsetMeters: number
): { latitude: number; longitude: number } {
  // 1 degree lat is approx 111,000 meters
  const latOffset = (offsetMeters / 111000) * (Math.random() > 0.5 ? 1 : -1);
  const lngOffset =
    (offsetMeters / (111000 * Math.cos(toRad(baseLat)))) *
    (Math.random() > 0.5 ? 1 : -1);

  return {
    latitude: baseLat + latOffset,
    longitude: baseLng + lngOffset,
  };
}
