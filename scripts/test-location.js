// Test script untuk verifikasi akurasi pencarian faskes terdekat
// Simulasi lokasi user di Mojokerto dan Sidoarjo

const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function testLocation(label, lat, lng, facilityType) {
  console.log('\n══════════════════════════════════════════');
  console.log('TEST: ' + label);
  console.log('Lokasi: lat=' + lat + ', lng=' + lng);
  console.log('Tipe: ' + facilityType);
  console.log('══════════════════════════════════════════');

  const snapshot = await db.collection('facilities').get();
  var allFacilities = snapshot.docs.map(function(doc) {
    return { id: doc.id, ...doc.data() };
  });

  // Filter tipe
  var ft = facilityType.toLowerCase();
  if (ft.includes('puskesmas') || ft.includes('klinik')) {
    allFacilities = allFacilities.filter(function(f) {
      return f.type && (f.type.toLowerCase() === 'puskesmas' || f.type.toLowerCase() === 'klinik');
    });
  } else if (ft.includes('igd')) {
    allFacilities = allFacilities.filter(function(f) {
      return f.type && f.type.toLowerCase() === 'igd';
    });
  }

  // Hitung jarak
  var enriched = allFacilities.map(function(f) {
    var dist = getDistanceFromLatLonInKm(lat, lng, f.location.lat, f.location.lng);
    return {
      name: f.name,
      address: f.address,
      type: f.type,
      distance_km: parseFloat(dist.toFixed(2)),
      duration_min: Math.round((dist / 30) * 60),
    };
  });

  // Sort terdekat
  enriched.sort(function(a, b) { return a.distance_km - b.distance_km; });

  // Tampilkan top 5
  var top5 = enriched.slice(0, 5);
  console.log('\nTop 5 terdekat:');
  top5.forEach(function(f, i) {
    console.log('  ' + (i + 1) + '. ' + f.name + ' (' + f.type + ')');
    console.log('     ' + f.address);
    console.log('     Jarak: ' + f.distance_km + ' km | Waktu: ~' + f.duration_min + ' menit');
  });

  return top5;
}

async function main() {
  // Test 1: User di MOJOKERTO KOTA, cari Puskesmas
  await testLocation(
    'User di Mojokerto Kota → cari Puskesmas',
    -7.4726, 112.4338, 'Puskesmas'
  );

  // Test 2: User di MOJOKERTO KOTA, cari IGD
  await testLocation(
    'User di Mojokerto Kota → cari IGD',
    -7.4726, 112.4338, 'IGD'
  );

  // Test 3: User di SIDOARJO, cari IGD
  await testLocation(
    'User di Sidoarjo → cari IGD',
    -7.4431, 112.7198, 'IGD'
  );

  // Test 4: User di SURABAYA, cari Puskesmas
  await testLocation(
    'User di Surabaya → cari Puskesmas',
    -7.27, 112.76, 'Puskesmas'
  );

  console.log('\n\nSemua test selesai!');
}

main().catch(console.error);
