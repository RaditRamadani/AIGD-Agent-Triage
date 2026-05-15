import { db } from '@/lib/firebase/admin';
import type { Facility } from '@/types';

// Haversine formula to calculate distance between two coordinates in kilometers
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

/**
 * Find nearby healthcare facilities using Firestore dummy data.
 * Calculates straight-line distance locally.
 *
 * Returns top 5 results sorted by distance (ascending).
 */
export async function findNearbyFacilities(
  lat: number,
  lng: number,
  facilityType: string,
  radiusMeters: number = 20000
): Promise<Facility[]> {
  try {
    // 1. Ambil data fasilitas dari Firestore dummy
    const facilitiesSnapshot = await db.collection('facilities').get();

    let allFacilities = facilitiesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as Facility[];

    if (facilityType) {
      const ft = facilityType.toLowerCase();
      if (ft.includes('puskesmas') || ft.includes('klinik')) {
        allFacilities = allFacilities.filter((f) => 
          f.type?.toLowerCase() === 'puskesmas' || f.type?.toLowerCase() === 'klinik'
        );
      } else if (ft.includes('igd')) {
        allFacilities = allFacilities.filter((f) => f.type?.toLowerCase() === 'igd');
      } else {
        allFacilities = allFacilities.filter((f) => f.type?.toLowerCase().includes(ft));
      }
    }

    const enriched = allFacilities.map((facility) => {
      // 2. Hitung jarak
      const distanceKm = getDistanceFromLatLonInKm(
        lat,
        lng,
        facility.location.lat,
        facility.location.lng
      );
      
      // Asumsikan kecepatan rata-rata mobil di kota 30km/h
      const durationMins = Math.round((distanceKm / 30) * 60);

      return {
        ...facility,
        distance_km: parseFloat(distanceKm.toFixed(2)),
        duration_mins: durationMins,
      };
    });

    // 3. Filter berdasarkan radius dan urutkan
    const filteredAndSorted = enriched
      .filter((f) => f.distance_km * 1000 <= radiusMeters)
      .sort((a, b) => a.distance_km - b.distance_km);

    return filteredAndSorted.slice(0, 5);
  } catch (error) {
    console.error('Error in findNearbyFacilities:', error);
    return [];
  }
}

