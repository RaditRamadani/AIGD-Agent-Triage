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
 * Find nearby healthcare facilities using Firestore data.
 * Calculates straight-line distance locally.
 *
 * Strategi pencarian bertahap:
 *   1. Cari dalam radius yang diminta (default 20km)
 *   2. Jika kosong, perluas ke 50km
 *   3. Jika masih kosong, perluas ke 100km
 *
 * Returns top 5 results sorted by distance (terdekat dulu).
 */
export async function findNearbyFacilities(
  lat: number,
  lng: number,
  facilityType: string,
  radiusMeters: number = 20000
): Promise<Facility[]> {
  try {
    // 1. Ambil semua data fasilitas dari Firestore
    const facilitiesSnapshot = await db.collection('facilities').get();

    let allFacilities = facilitiesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as Facility[];

    // 2. Filter berdasarkan tipe faskes
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

    // 3. Hitung jarak untuk setiap faskes
    const enriched = allFacilities.map((facility) => {
      const distanceKm = getDistanceFromLatLonInKm(
        lat,
        lng,
        facility.location.lat,
        facility.location.lng
      );
      
      // Estimasi waktu tempuh: kecepatan rata-rata 30km/h di kota
      const durationMinutes = Math.round((distanceKm / 30) * 60);

      return {
        ...facility,
        distance_km: parseFloat(distanceKm.toFixed(2)),
        duration_minutes: durationMinutes,
      };
    });

    // 4. Urutkan berdasarkan jarak terdekat
    const sorted = enriched.sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));

    // 5. Pencarian bertahap: mulai dari radius yang diminta,
    //    jika kosong perluas secara progresif
    const radiusSteps = [
      radiusMeters,           // Radius awal (default 20km)
      50000,                  // Fallback 50km
      100000,                 // Fallback 100km
    ];

    for (const radius of radiusSteps) {
      const results = sorted.filter((f) => (f.distance_km ?? 999) * 1000 <= radius);
      if (results.length > 0) {
        console.log(
          '[Maps] Ditemukan ' + results.length + ' faskes dalam radius ' + (radius / 1000) + 'km'
        );
        return results.slice(0, 5);
      }
    }

    // 6. Jika semua radius gagal, kembalikan 5 terdekat tanpa batasan radius
    console.log('[Maps] Tidak ada faskes dalam 100km, mengembalikan 5 terdekat global');
    return sorted.slice(0, 5);
  } catch (error) {
    console.error('Error in findNearbyFacilities:', error);
    return [];
  }
}

