/**
 * Seed script — populate Firestore `facilities` collection with dummy
 * faskes data in Surabaya for MVP demonstration.
 *
 * Run: npx tsx src/lib/firebase/seed.ts
 *      or: npm run seed
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local so the script can run standalone
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

let app;
if (clientEmail && privateKey) {
  const serviceAccount: ServiceAccount = {
    projectId: projectId!,
    clientEmail,
    privateKey,
  };
  app = initializeApp({ credential: cert(serviceAccount) });
} else if (projectId) {
  app = initializeApp({ projectId });
} else {
  throw new Error('FIREBASE_PROJECT_ID is required');
}

const db = getFirestore(app);

// ── Helper: generate time slots for a given date ──
function generateSlots(dateStr: string, startHour: number, endHour: number, intervalMin = 30) {
  const slots: { slot_id: string; time: Timestamp; is_booked: boolean }[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += intervalMin) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const iso = `${dateStr}T${hh}:${mm}:00+07:00`; // WIB
      slots.push({
        slot_id: `slot-${hh}${mm}`,
        time: Timestamp.fromDate(new Date(iso)),
        is_booked: Math.random() < 0.3, // ~30% already booked for realism
      });
    }
  }
  return slots;
}

// Tomorrow's date (WIB)
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const dateStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

// ── Dummy Facilities ──
const facilities = [
  {
    name: 'Puskesmas Mulyorejo',
    type: 'Puskesmas',
    address: 'Jl. Mulyorejo No.45, Mulyorejo, Surabaya',
    location: { lat: -7.2601, lng: 112.7683 },
    phone: '031-5920001',
    operating_hours: '08:00–16:00',
    services: ['Poli Umum', 'Poli Gigi', 'KIA', 'Imunisasi', 'Laboratorium'],
    available_slots: generateSlots(dateStr, 8, 16),
  },
  {
    name: 'Puskesmas Gubeng',
    type: 'Puskesmas',
    address: 'Jl. Prof. Dr. Moestopo No.166, Gubeng, Surabaya',
    location: { lat: -7.2725, lng: 112.7565 },
    phone: '031-5033445',
    operating_hours: '07:30–15:30',
    services: ['Poli Umum', 'Poli Gigi', 'UGD', 'Laboratorium', 'Farmasi'],
    available_slots: generateSlots(dateStr, 8, 15),
  },
  {
    name: 'Klinik Pratama Husada Utama',
    type: 'Klinik',
    address: 'Jl. Raya Darmo No.90, Wonokromo, Surabaya',
    location: { lat: -7.2945, lng: 112.7389 },
    phone: '031-5680011',
    operating_hours: '08:00–21:00',
    services: ['Poli Umum', 'Poli Anak', 'Laboratorium', 'Farmasi', 'Konsultasi Online'],
    available_slots: generateSlots(dateStr, 8, 21),
  },
  {
    name: 'Klinik Surabaya Medical Centre',
    type: 'Klinik',
    address: 'Jl. Rungkut Industri Raya No.1, Rungkut, Surabaya',
    location: { lat: -7.3250, lng: 112.7700 },
    phone: '031-8710900',
    operating_hours: '08:00–20:00',
    services: ['Poli Umum', 'Poli Kulit', 'Fisioterapi', 'Laboratorium'],
    available_slots: generateSlots(dateStr, 8, 20),
  },
  {
    name: 'RSUD dr. Soetomo — IGD',
    type: 'IGD',
    address: 'Jl. Prof. Dr. Moestopo No.6-8, Airlangga, Surabaya',
    location: { lat: -7.2700, lng: 112.7600 },
    phone: '031-5501078',
    operating_hours: '24 Jam',
    services: ['IGD 24 Jam', 'Trauma Center', 'Bedah Darurat', 'ICU'],
    available_slots: [], // IGD = walk-in, no slots
  },
  {
    name: 'RS Universitas Airlangga — IGD',
    type: 'IGD',
    address: 'Jl. Mayjen Prof. Dr. Moestopo No.47, Surabaya',
    location: { lat: -7.2685, lng: 112.7620 },
    phone: '031-5821730',
    operating_hours: '24 Jam',
    services: ['IGD 24 Jam', 'Bedah Darurat', 'Poli Spesialis', 'ICU'],
    available_slots: [],
  },
  {
    name: 'Puskesmas Wonokromo',
    type: 'Puskesmas',
    address: 'Jl. Wonokromo No.40, Wonokromo, Surabaya',
    location: { lat: -7.3037, lng: 112.7373 },
    phone: '031-8411201',
    operating_hours: '08:00–15:00',
    services: ['Poli Umum', 'Poli Gigi', 'KIA', 'Laboratorium'],
    available_slots: generateSlots(dateStr, 8, 15),
  },
  {
    name: 'Klinik Graha Amerta',
    type: 'Klinik',
    address: 'Jl. A. Yani No.2-4, Gayungan, Surabaya',
    location: { lat: -7.3300, lng: 112.7310 },
    phone: '031-8283334',
    operating_hours: '07:00–22:00',
    services: ['Poli Umum', 'Poli Anak', 'Poli Kulit', 'Farmasi 24 Jam'],
    available_slots: generateSlots(dateStr, 7, 22),
  },
  {
    name: 'RS PHC Surabaya — IGD',
    type: 'IGD',
    address: 'Jl. Prapat Kurung Selatan No.1-2, Perak Timur, Surabaya',
    location: { lat: -7.2275, lng: 112.7350 },
    phone: '031-3294801',
    operating_hours: '24 Jam',
    services: ['IGD 24 Jam', 'Bedah', 'Poli Spesialis', 'Radiologi'],
    available_slots: [],
  },
  {
    name: 'Puskesmas Kenjeran',
    type: 'Puskesmas',
    address: 'Jl. Kenjeran No.350, Kenjeran, Surabaya',
    location: { lat: -7.2400, lng: 112.7780 },
    phone: '031-3813271',
    operating_hours: '08:00–14:00',
    services: ['Poli Umum', 'Poli Gigi', 'KIA', 'Imunisasi'],
    available_slots: generateSlots(dateStr, 8, 14),
  },
];

// ── Seed Execution ──
async function seed() {
  console.log('🌱 Seeding Firestore facilities collection...\n');

  const batch = db.batch();

  for (const facility of facilities) {
    const docRef = db.collection('facilities').doc();
    batch.set(docRef, facility);
    console.log(`  ✅ ${facility.type.padEnd(10)} ${facility.name}`);
  }

  await batch.commit();

  console.log(`\n🎉 Seeded ${facilities.length} facilities successfully!`);
  console.log('   Date slots generated for:', dateStr);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
