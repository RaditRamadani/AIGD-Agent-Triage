// ══════════════════════════════════════════════════════════════
// AIGD Agent — Master Seed Script: Data Fasilitas Kesehatan
// ══════════════════════════════════════════════════════════════
// Script ini mengelola semua data faskes untuk 3 wilayah:
//   1. Surabaya
//   2. Sidoarjo
//   3. Mojokerto (Kab.)
//
// Usage:
//   node scripts/seed-facilities.js          → Seed semua wilayah
//   node scripts/seed-facilities.js surabaya → Seed Surabaya saja
//   node scripts/seed-facilities.js sidoarjo → Seed Sidoarjo saja
//   node scripts/seed-facilities.js mojokerto → Seed Mojokerto saja
//   node scripts/seed-facilities.js --clear  → Hapus semua data lalu seed ulang
// ══════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════
//  WILAYAH 1: SURABAYA
// ══════════════════════════════════════════════════════════════
const SURABAYA = [
  {
    name: 'RSUD dr. Soetomo — IGD',
    address: 'Jl. Prof. Dr. Moestopo No.6-8, Airlangga, Surabaya',
    type: 'IGD',
    location: { lat: -7.27, lng: 112.76 },
    phone: '031-5501078',
    is_open: true,
  },
  {
    name: 'RS Universitas Airlangga — IGD',
    address: 'Jl. Mayjen Prof. Dr. Moestopo No.47, Surabaya',
    type: 'IGD',
    location: { lat: -7.2685, lng: 112.762 },
    phone: '031-5821730',
    is_open: true,
  },
  {
    name: 'RS PHC Surabaya — IGD',
    address: 'Jl. Prapat Kurung Selatan No.1-2, Perak Timur, Surabaya',
    type: 'IGD',
    location: { lat: -7.2275, lng: 112.735 },
    phone: '031-3294801',
    is_open: true,
  },
  {
    name: 'Puskesmas Mulyorejo',
    address: 'Jl. Mulyorejo No.45, Mulyorejo, Surabaya',
    type: 'Puskesmas',
    location: { lat: -7.2601, lng: 112.7683 },
    phone: '031-5920001',
    is_open: true,
  },
  {
    name: 'Puskesmas Wonokromo',
    address: 'Jl. Wonokromo No.40, Wonokromo, Surabaya',
    type: 'Puskesmas',
    location: { lat: -7.3037, lng: 112.7373 },
    phone: '031-8411201',
    is_open: true,
  },
  {
    name: 'Puskesmas Kenjeran',
    address: 'Jl. Kenjeran No.350, Kenjeran, Surabaya',
    type: 'Puskesmas',
    location: { lat: -7.24, lng: 112.778 },
    phone: '031-3813271',
    is_open: true,
  },
  {
    name: 'Puskesmas Gubeng',
    address: 'Jl. Prof. Dr. Moestopo No.166, Gubeng, Surabaya',
    type: 'Puskesmas',
    location: { lat: -7.2725, lng: 112.7565 },
    phone: '031-5033445',
    is_open: true,
  },
  {
    name: 'Klinik Pratama Husada Utama',
    address: 'Jl. Raya Darmo No.90, Wonokromo, Surabaya',
    type: 'Klinik',
    location: { lat: -7.2945, lng: 112.7389 },
    phone: '031-5680011',
    is_open: true,
  },
];

// ══════════════════════════════════════════════════════════════
//  WILAYAH 2: SIDOARJO
//  Sumber: avitaliahealth.com (RS Tipe A-D Sidoarjo)
// ══════════════════════════════════════════════════════════════
const SIDOARJO = [
  {
    name: 'RSUD Kabupaten Sidoarjo — IGD',
    address: 'Jl. Mojopahit No.15, Celep, Kec. Sidoarjo, Kabupaten Sidoarjo',
    type: 'IGD',
    location: { lat: -7.4431, lng: 112.7198 },
    is_open: true,
  },
  {
    name: 'RS Siti Hajar Sidoarjo — IGD',
    address: 'Jl. Raden Patah No.70, Bulusidokare, Kec. Sidoarjo',
    type: 'IGD',
    location: { lat: -7.4533, lng: 112.7161 },
    is_open: true,
  },
  {
    name: 'RS Mitra Keluarga Waru — IGD',
    address: 'Jl. Letjend Sutoyo No.22, Waru, Sidoarjo',
    type: 'IGD',
    location: { lat: -7.3486, lng: 112.7292 },
    is_open: true,
  },
  {
    name: 'RS Delta Surya Sidoarjo — IGD',
    address: 'Jl. Pahlawan No.9, Sidoarjo',
    type: 'IGD',
    location: { lat: -7.4485, lng: 112.7083 },
    is_open: true,
  },
  {
    name: 'RS Anwar Medika — IGD',
    address: 'Jl. Raya Bypass Krian KM 33, Balongbendo, Sidoarjo',
    type: 'IGD',
    location: { lat: -7.4042, lng: 112.5786 },
    is_open: true,
  },
  {
    name: 'RS Jasem Sidoarjo — IGD',
    address: 'Jl. Raya Jasem, Ngoro, Sidoarjo',
    type: 'IGD',
    location: { lat: -7.4722, lng: 112.7121 },
    is_open: true,
  },
  {
    name: 'RS Aisyiyah Siti Fatimah — IGD',
    address: 'Jl. Raya Tulangan, Sidoarjo',
    type: 'IGD',
    location: { lat: -7.4718, lng: 112.6397 },
    is_open: true,
  },
  {
    name: 'RS Sheila Medika — IGD',
    address: 'Jl. Letjen Suprapto, Kepuhkiriman, Waru, Sidoarjo',
    type: 'IGD',
    location: { lat: -7.3541, lng: 112.7483 },
    is_open: true,
  },
  {
    name: 'Puskesmas Waru',
    address: 'Jl. Barito No.1, Waru, Kabupaten Sidoarjo',
    type: 'Puskesmas',
    location: { lat: -7.3538, lng: 112.7301 },
    is_open: true,
  },
  {
    name: 'Puskesmas Krian',
    address: 'Jl. Setia Budi No.1, Krian, Kabupaten Sidoarjo',
    type: 'Puskesmas',
    location: { lat: -7.4116, lng: 112.5851 },
    is_open: true,
  },
  {
    name: 'Puskesmas Gedangan',
    address: 'Jl. Sukarno Hatta, Gedangan, Kabupaten Sidoarjo',
    type: 'Puskesmas',
    location: { lat: -7.3871, lng: 112.7289 },
    is_open: true,
  },
  {
    name: 'Puskesmas Sidoarjo',
    address: 'Jl. Dr. Soetomo No.14, Magersari, Sidoarjo',
    type: 'Puskesmas',
    location: { lat: -7.4491, lng: 112.7151 },
    is_open: true,
  },
  {
    name: 'Klinik Utama Delta Sehat',
    address: 'Jl. Diponegoro No.14, Sidoarjo',
    type: 'Klinik',
    location: { lat: -7.4475, lng: 112.7188 },
    is_open: true,
  },
  {
    name: 'Klinik Delta Medika Sidoarjo',
    address: 'Jl. Pahlawan, Sidoarjo',
    type: 'Klinik',
    location: { lat: -7.4532, lng: 112.7100 },
    is_open: true,
  },
];

// ══════════════════════════════════════════════════════════════
//  WILAYAH 3: MOJOKERTO (KAB.)
//  Sumber: dinkes.mojokertokab.go.id
// ══════════════════════════════════════════════════════════════
const MOJOKERTO = [
  // --- Rumah Sakit / IGD ---
  {
    name: 'RSUD Dr. Wahidin Sudiro Husodo — IGD',
    address: 'Jl. RA Basoeni 12, Mojokerto (Telp: 0321-321922)',
    type: 'IGD',
    location: { lat: -7.4726, lng: 112.4338 },
    is_open: true,
  },
  {
    name: 'RSUD Surodinawan — IGD',
    address: 'Jl. Surodinawan No.55, Mojokerto',
    type: 'IGD',
    location: { lat: -7.4812, lng: 112.4285 },
    is_open: true,
  },
  // --- Puskesmas ---
  {
    name: 'Puskesmas Kutorejo',
    address: 'Jl. Raya Mojosari Pacet Kutorejo, Mojokerto (Telp: 0321-595646)',
    type: 'Puskesmas',
    location: { lat: -7.5342, lng: 112.5699 },
    is_open: true,
  },
  {
    name: 'Puskesmas Bangsal',
    address: 'Jl. Raya Puloniti No.1 Bangsal, Mojokerto (Telp: 0321-327950)',
    type: 'Puskesmas',
    location: { lat: -7.4913, lng: 112.4921 },
    is_open: true,
  },
  {
    name: 'Puskesmas Dawarblandong',
    address: 'Jl. Raya Dawar Blandong, Mojokerto (Telp: 031-7921552)',
    type: 'Puskesmas',
    location: { lat: -7.3752, lng: 112.4338 },
    is_open: true,
  },
  {
    name: 'Puskesmas Gedeg',
    address: 'Jl. Raya Gedeg No.17, Mojokerto (Telp: 0321-364752)',
    type: 'Puskesmas',
    location: { lat: -7.4650, lng: 112.3950 },
    is_open: true,
  },
  {
    name: 'Puskesmas Dlanggu',
    address: 'Jl. Yon Jokotole 47 Dlanggu, Mojokerto (Telp: 0321-510730)',
    type: 'Puskesmas',
    location: { lat: -7.5350, lng: 112.5100 },
    is_open: true,
  },
  {
    name: 'Puskesmas Trowulan',
    address: 'Jl. Raya Trowulan, Mojokerto (Telp: 0321-496275)',
    type: 'Puskesmas',
    location: { lat: -7.5501, lng: 112.3842 },
    is_open: true,
  },
  {
    name: 'Puskesmas Tawangsari',
    address: 'Jl. R.Wijaya No.2 Tawangsari, Mojokerto (Telp: 0321-491780)',
    type: 'Puskesmas',
    location: { lat: -7.5280, lng: 112.4050 },
    is_open: true,
  },
  {
    name: 'Puskesmas Puri',
    address: 'Ds. Tangunan Kec. Puri, Mojokerto (Telp: 0321-510765)',
    type: 'Puskesmas',
    location: { lat: -7.4900, lng: 112.4600 },
    is_open: true,
  },
  {
    name: 'Puskesmas Mojoanyar',
    address: 'Jl. Raya Gayaman No.7 Kec. Mojoanyar, Mojokerto (Telp: 0321-394041)',
    type: 'Puskesmas',
    location: { lat: -7.4800, lng: 112.4900 },
    is_open: true,
  },
  {
    name: 'Puskesmas Gempolkerep',
    address: 'Jl. Raya Gempolkerep No.15 Gedeg, Mojokerto (Telp: 0321-362611)',
    type: 'Puskesmas',
    location: { lat: -7.4580, lng: 112.3800 },
    is_open: true,
  },
  {
    name: 'Puskesmas Padangan',
    address: 'Jl. Raya Padangan, Mojokerto (Telp: 0321-362558)',
    type: 'Puskesmas',
    location: { lat: -7.4400, lng: 112.3700 },
    is_open: true,
  },
  {
    name: 'Puskesmas Kemlagi',
    address: 'Jl. Darmo Sugondo No.1 Kemlagi, Mojokerto (Telp: 0321-365015)',
    type: 'Puskesmas',
    location: { lat: -7.4200, lng: 112.3500 },
    is_open: true,
  },
  {
    name: 'Puskesmas Kedungsari',
    address: 'Jl. Raya Kedungsari, Mojokerto (Telp: 0321-362314)',
    type: 'Puskesmas',
    location: { lat: -7.4350, lng: 112.3600 },
    is_open: true,
  },
  {
    name: 'Puskesmas Jetis',
    address: 'Jl. PB Soedirman 78 Kec Jetis, Mojokerto (Telp: 0321-362853)',
    type: 'Puskesmas',
    location: { lat: -7.4500, lng: 112.4100 },
    is_open: true,
  },
  {
    name: 'Puskesmas Jetis II',
    address: 'Jl. Raya Jetis No.28, Kec Jetis, Mojokerto (Telp: 0321-363084)',
    type: 'Puskesmas',
    location: { lat: -7.4520, lng: 112.4130 },
    is_open: true,
  },
  {
    name: 'Puskesmas Mojosari',
    address: 'Jl. Raya Awang-awang No.2, Mojosari, Mojokerto (Telp: 0321-592896)',
    type: 'Puskesmas',
    location: { lat: -7.5020, lng: 112.5401 },
    is_open: true,
  },
  {
    name: 'Puskesmas Modopuro',
    address: 'Jl. S Parman No.10, Ds Modopuro, Mojokerto (Telp: 0321-593130)',
    type: 'Puskesmas',
    location: { lat: -7.4950, lng: 112.5250 },
    is_open: true,
  },
  {
    name: 'Puskesmas Pungging',
    address: 'Jl. Raya Pungging No.62, Mojokerto (Telp: 0321-594134)',
    type: 'Puskesmas',
    location: { lat: -7.4850, lng: 112.5150 },
    is_open: true,
  },
  {
    name: 'Puskesmas Ngoro',
    address: 'Jl. Jolotundo No.2 Ngoro, Mojokerto (Telp: 0321-619248)',
    type: 'Puskesmas',
    location: { lat: -7.5100, lng: 112.5600 },
    is_open: true,
  },
  {
    name: 'Puskesmas Ngoro II',
    address: 'Jl. Raya Ngoro KM 14, Ds Manduro MG Ngoro, Mojokerto (Telp: 0321-619197)',
    type: 'Puskesmas',
    location: { lat: -7.5150, lng: 112.5650 },
    is_open: true,
  },
  {
    name: 'Puskesmas Pacet',
    address: 'Jl. Dr Soetomo No.9 Pacet, Mojokerto (Telp: 0321-691179)',
    type: 'Puskesmas',
    location: { lat: -7.5900, lng: 112.5400 },
    is_open: true,
  },
  {
    name: 'Puskesmas Pandan Arum',
    address: 'Jl. Raya Oandan No.65 Pandan Arum, Mojokerto (Telp: 0321-691110)',
    type: 'Puskesmas',
    location: { lat: -7.5850, lng: 112.5350 },
    is_open: true,
  },
  {
    name: 'Puskesmas Trawas',
    address: 'Jl. Pahlawan 27 Trawas, Mojokerto (Telp: 0343-883866)',
    type: 'Puskesmas',
    location: { lat: -7.5600, lng: 112.5800 },
    is_open: true,
  },
  {
    name: 'Puskesmas Gondang',
    address: 'Jl. Raya Gondang No.2, Mojokerto (Telp: 0321-511110)',
    type: 'Puskesmas',
    location: { lat: -7.5400, lng: 112.5500 },
    is_open: true,
  },
  {
    name: 'Puskesmas Jatirejo',
    address: 'Jl. Basuki Rahmat No.26 Jatirejo, Mojokerto (Telp: 0321-490358)',
    type: 'Puskesmas',
    location: { lat: -7.5500, lng: 112.4200 },
    is_open: true,
  },
  {
    name: 'Puskesmas Sumberglagah',
    address: 'Jl. Sumber Glagah Pacet, Mojokerto (Telp: 0321-690441)',
    type: 'Puskesmas',
    location: { lat: -7.5950, lng: 112.5450 },
    is_open: true,
  },
  // --- Klinik ---
  {
    name: 'Klinik Gajah Mada Mojosari',
    address: 'Jl. Gajah Mada 1 Mojosari, Mojokerto',
    type: 'Klinik',
    location: { lat: -7.5030, lng: 112.5380 },
    is_open: true,
  },
  {
    name: 'Klinik Airlangga Mojosari',
    address: 'Jl. Airlangga Mojosari, Mojokerto',
    type: 'Klinik',
    location: { lat: -7.5010, lng: 112.5420 },
    is_open: true,
  },
  {
    name: 'Klinik Pasar Sawahan Bangsal',
    address: 'Jl. Raya Pasar Sawahan KM 10 Bangsal, Mojokerto',
    type: 'Klinik',
    location: { lat: -7.4930, lng: 112.4950 },
    is_open: true,
  },
  {
    name: 'Klinik Jetis Mojokerto',
    address: 'Jl. Raya Jetis No.14, Mojokerto',
    type: 'Klinik',
    location: { lat: -7.4510, lng: 112.4120 },
    is_open: true,
  },
  {
    name: 'Klinik Trowulan Sejahtera',
    address: 'Jl. Raya Trowulan No.132, Mojokerto',
    type: 'Klinik',
    location: { lat: -7.5490, lng: 112.3860 },
    is_open: true,
  },
  {
    name: 'Klinik Wonosari Mojokerto',
    address: 'Jl. Raya Wonosari No.112, Mojokerto',
    type: 'Klinik',
    location: { lat: -7.5650, lng: 112.5200 },
    is_open: true,
  },
  {
    name: 'Klinik Trawas Pungging',
    address: 'Jl. Raya Trawas - Pungging, Mojokerto',
    type: 'Klinik',
    location: { lat: -7.5550, lng: 112.5700 },
    is_open: true,
  },
  {
    name: 'Klinik Hayam Wuruk Mojosari',
    address: 'Jl. Hayam Wuruk No.38, Mojosari, Mojokerto',
    type: 'Klinik',
    location: { lat: -7.5025, lng: 112.5390 },
    is_open: true,
  },
  {
    name: 'Klinik Ngoro Industri',
    address: 'Ruko Ngoro Industri Persada, Mojokerto',
    type: 'Klinik',
    location: { lat: -7.5120, lng: 112.5620 },
    is_open: true,
  },
  {
    name: 'Klinik Sooko',
    address: 'Jl. Garuda No.1 Sooko, Mojokerto',
    type: 'Klinik',
    location: { lat: -7.4850, lng: 112.4400 },
    is_open: true,
  },
  {
    name: 'Klinik Puri Jayanegara',
    address: 'Jl. Jayanegara No.7A, Kec. Puri, Kab. Mojokerto',
    type: 'Klinik',
    location: { lat: -7.4880, lng: 112.4580 },
    is_open: true,
  },
  {
    name: 'Klinik RA Kartini Kupang',
    address: 'Jl. RA Kartini No.141, Kupang, Kab. Mojokerto',
    type: 'Klinik',
    location: { lat: -7.4700, lng: 112.4300 },
    is_open: true,
  },
  {
    name: 'Klinik Mojopahit Kota',
    address: 'Jl. Mojopahit No.234, Kota Mojokerto',
    type: 'Klinik',
    location: { lat: -7.4750, lng: 112.4350 },
    is_open: true,
  },
  {
    name: 'Klinik Bhayangkara Sooko',
    address: 'Jl. Bhayangkara No.19, Kec Sooko, Kab. Mojokerto',
    type: 'Klinik',
    location: { lat: -7.4860, lng: 112.4420 },
    is_open: true,
  },
];


// ══════════════════════════════════════════════════════════════
//  FUNGSI UTAMA
// ══════════════════════════════════════════════════════════════

const REGIONS = {
  surabaya: SURABAYA,
  sidoarjo: SIDOARJO,
  mojokerto: MOJOKERTO,
};

async function clearAll() {
  console.log('Menghapus semua data facilities dari Firestore...');
  const snapshot = await db.collection('facilities').get();
  const batch = db.batch();
  snapshot.docs.forEach(function(doc) { batch.delete(doc.ref); });
  await batch.commit();
  console.log('Berhasil menghapus ' + snapshot.size + ' dokumen.');
}

async function seedRegion(regionName, data) {
  console.log('\n--- Seeding: ' + regionName.toUpperCase() + ' (' + data.length + ' faskes) ---');
  var added = 0;
  for (var i = 0; i < data.length; i++) {
    await db.collection('facilities').add(data[i]);
    added++;
  }
  console.log('OK: ' + added + ' faskes ' + regionName + ' berhasil ditambahkan.');
  return added;
}

async function main() {
  var args = process.argv.slice(2);
  var shouldClear = args.includes('--clear');
  var regionFilter = args.find(function(a) { return a !== '--clear'; });

  if (shouldClear) {
    await clearAll();
  }

  var totalAdded = 0;

  if (regionFilter) {
    // Seed 1 wilayah saja
    var data = REGIONS[regionFilter.toLowerCase()];
    if (!data) {
      console.error('Wilayah "' + regionFilter + '" tidak dikenali. Pilih: surabaya, sidoarjo, mojokerto');
      process.exit(1);
    }
    totalAdded = await seedRegion(regionFilter, data);
  } else {
    // Seed semua wilayah
    var keys = Object.keys(REGIONS);
    for (var k = 0; k < keys.length; k++) {
      totalAdded += await seedRegion(keys[k], REGIONS[keys[k]]);
    }
  }

  console.log('\n══════════════════════════════════════════');
  console.log('TOTAL: ' + totalAdded + ' fasilitas berhasil diseed.');
  console.log('══════════════════════════════════════════');
}

main().catch(console.error);
