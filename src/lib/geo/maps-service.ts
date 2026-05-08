import {
  Client,
  TravelMode,
  type PlaceData,
} from '@googlemaps/google-maps-services-js';
import type { Facility } from '@/types';

const mapsClient = new Client({});

/**
 * Map internal facility type to a Places API keyword for more accurate results.
 */
function mapFacilityTypeToKeyword(facilityType: string): string {
  switch (facilityType) {
    case 'IGD':
      return 'IGD rumah sakit';
    case 'Puskesmas':
      return 'puskesmas';
    case 'Klinik':
      return 'klinik';
    default:
      return 'rumah sakit';
  }
}

/**
 * Find nearby healthcare facilities using Google Maps Places API,
 * then enrich each result with driving distance/duration via Directions API.
 *
 * Returns top 5 results sorted by distance (ascending).
 */
export async function findNearbyFacilities(
  lat: number,
  lng: number,
  facilityType: string,
  radiusMeters: number = 5000
): Promise<Facility[]> {
  const keyword = mapFacilityTypeToKeyword(facilityType);

  const placesResponse = await mapsClient.placesNearby({
    params: {
      location: { lat, lng },
      radius: radiusMeters,
      keyword,
      // Use 'hospital' as a broad type; keyword narrows the results
      type: 'hospital',
      key: process.env.GOOGLE_MAPS_API_KEY!,
    },
    timeout: 5000,
  });

  const top5 = placesResponse.data.results.slice(0, 5);

  // Enrich each facility with distance + duration
  const enriched = await Promise.all(
    top5.map(async (place: Partial<PlaceData>) => {
      const dest = place.geometry?.location;
      if (!dest) return null;

      let distance_km: number | null = null;
      let duration_minutes: number | null = null;

      try {
        const directionsResponse = await mapsClient.directions({
          params: {
            origin: { lat, lng },
            destination: dest,
            mode: TravelMode.driving,
            key: process.env.GOOGLE_MAPS_API_KEY!,
          },
          timeout: 5000,
        });

        const leg = directionsResponse.data.routes[0]?.legs[0];
        if (leg) {
          distance_km = Math.round((leg.distance.value / 1000) * 10) / 10;
          duration_minutes = Math.round(leg.duration.value / 60);
        }
      } catch {
        // Directions API failed for this place — continue with null values
      }

      return {
        place_id: place.place_id ?? '',
        name: place.name ?? 'Unknown',
        address: place.vicinity ?? '',
        location: dest,
        is_open: place.opening_hours?.open_now ?? null,
        distance_km,
        duration_minutes,
      } satisfies Facility;
    })
  );

  // Filter nulls and sort by distance ascending (nulls last)
  return enriched
    .filter((f): f is Facility => f !== null)
    .sort((a, b) => {
      if (a.distance_km === null) return 1;
      if (b.distance_km === null) return -1;
      return a.distance_km - b.distance_km;
    });
}
