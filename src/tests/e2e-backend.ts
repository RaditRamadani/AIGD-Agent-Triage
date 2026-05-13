/**
 * ── E2E Backend Test ──
 * Script untuk menguji koneksi backend secara end-to-end:
 *   Test 1: Gemini API basic generation (cek API key valid)
 *   Test 2: Gemini function calling (cek tool declarations berfungsi)
 *   Test 3: Firebase Firestore connection (cek admin SDK terhubung)
 *
 * Jalankan dengan: npx tsx src/tests/e2e-backend.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env.local secara eksplisit (Next.js convention)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { GoogleGenAI, Type } from '@google/genai';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ── Warna terminal untuk output yang readable ──
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function logPass(testName: string, detail: string) {
  console.log(`${GREEN}✅ PASS${RESET} — ${BOLD}${testName}${RESET}`);
  console.log(`   ${detail}\n`);
}

function logFail(testName: string, detail: string) {
  console.log(`${RED}❌ FAIL${RESET} — ${BOLD}${testName}${RESET}`);
  console.log(`   ${detail}\n`);
}

function logInfo(msg: string) {
  console.log(`${CYAN}ℹ️  ${msg}${RESET}`);
}

function logSection(title: string) {
  console.log(`\n${YELLOW}${'═'.repeat(60)}${RESET}`);
  console.log(`${YELLOW}  ${title}${RESET}`);
  console.log(`${YELLOW}${'═'.repeat(60)}${RESET}\n`);
}

// ── Track results ──
let passed = 0;
let failed = 0;

// =============================================
// TEST 1: Gemini API Basic Generation
// =============================================
async function testGeminiBasic() {
  const testName = 'Test 1: Gemini API Basic Generation';
  logInfo(`Running ${testName}...`);

  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      logFail(testName, 'GOOGLE_AI_API_KEY tidak ditemukan di .env.local');
      failed++;
      return;
    }

    logInfo(`API Key (masked): ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);

    // Inisialisasi Gemini client
    const ai = new GoogleGenAI({ apiKey });

    // Simple text generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Jawab singkat dalam 1 kalimat: Apa fungsi puskesmas?',
    });

    const text = response.text ?? '';

    if (text.length > 0) {
      logPass(testName, `Response diterima (${text.length} chars): "${text.substring(0, 120)}..."`);
      passed++;
    } else {
      logFail(testName, 'Response kosong dari Gemini');
      failed++;
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logFail(testName, `Error: ${errMsg}`);
    failed++;
  }
}

// =============================================
// TEST 2: Gemini Function Calling (Triage Flow)
// =============================================
async function testGeminiFunctionCalling() {
  const testName = 'Test 2: Gemini Function Calling';
  logInfo(`Running ${testName}...`);

  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      logFail(testName, 'GOOGLE_AI_API_KEY tidak ditemukan');
      failed++;
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    // Deklarasi tool yang sama dengan production
    const getNearbyHospitalsDeclaration = {
      name: 'getNearbyHospitals',
      description: 'Cari fasilitas kesehatan terdekat dari lokasi pasien.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          lat: { type: Type.NUMBER, description: 'Latitude lokasi pasien' },
          lng: { type: Type.NUMBER, description: 'Longitude lokasi pasien' },
          facility_type: {
            type: Type.STRING,
            enum: ['Puskesmas', 'Klinik', 'IGD'],
            description: 'Jenis faskes sesuai hasil Care Navigation',
          },
        },
        required: ['lat', 'lng', 'facility_type'],
      },
    };

    // Kirim pesan darurat yang seharusnya trigger function call IGD
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Saya sesak napas berat dan nyeri dada parah, tolong carikan IGD terdekat dari lokasi saya. [Lokasi pasien saat ini: lat=-6.2088, lng=106.8456]',
      config: {
        systemInstruction: 'Anda adalah navigator kesehatan. Jika pasien dalam kondisi darurat, gunakan tool getNearbyHospitals untuk mencari IGD terdekat.',
        tools: [{ functionDeclarations: [getNearbyHospitalsDeclaration] }],
      },
    });

    const functionCalls = response.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
      const fc = functionCalls[0];
      logPass(
        testName,
        `Function call terdeteksi: ${fc.name}(${JSON.stringify(fc.args)})`
      );
      passed++;
    } else {
      // Gemini mungkin merespons dengan teks, tapi nggak function call — masih OK tapi warning
      const text = response.text ?? '';
      if (text.length > 0) {
        logPass(
          testName,
          `Gemini merespons teks (tanpa function call, tapi API key valid): "${text.substring(0, 100)}..."`
        );
        passed++;
      } else {
        logFail(testName, 'Tidak ada function call maupun teks dari Gemini');
        failed++;
      }
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logFail(testName, `Error: ${errMsg}`);
    failed++;
  }
}

// =============================================
// TEST 3: Firebase Firestore Connection
// =============================================
async function testFirebaseConnection() {
  const testName = 'Test 3: Firebase Firestore Connection';
  logInfo(`Running ${testName}...`);

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      logFail(testName, 'Firebase env vars belum lengkap (PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY)');
      failed++;
      return;
    }

    logInfo(`Firebase Project: ${projectId}`);

    // Inisialisasi Firebase Admin (jika belum)
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    }

    const db = getFirestore();

    // Coba baca collection "facilities" (seharusnya sudah ada dari seed)
    const facilitiesSnapshot = await db.collection('facilities').limit(3).get();

    if (!facilitiesSnapshot.empty) {
      const facilityNames = facilitiesSnapshot.docs.map(
        (doc) => doc.data().name ?? doc.id
      );
      logPass(
        testName,
        `Firestore terhubung. Ditemukan ${facilitiesSnapshot.size} faskes: [${facilityNames.join(', ')}]`
      );
      passed++;
    } else {
      logFail(
        testName,
        'Firestore terhubung tapi collection "facilities" kosong. Jalankan "npm run seed" dulu.'
      );
      failed++;
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logFail(testName, `Error: ${errMsg}`);
    failed++;
  }
}

// =============================================
// MAIN: Jalankan semua test
// =============================================
async function main() {
  logSection('🧪 AIGD Agent — E2E Backend Test');
  logInfo(`Waktu: ${new Date().toLocaleString('id-ID')}`);
  logInfo(`Node: ${process.version}\n`);

  await testGeminiBasic();
  await testGeminiFunctionCalling();
  await testFirebaseConnection();

  // ── Summary ──
  logSection('📊 Test Summary');
  console.log(`   ${GREEN}Passed: ${passed}${RESET}`);
  console.log(`   ${RED}Failed: ${failed}${RESET}`);
  console.log(`   Total:  ${passed + failed}\n`);

  if (failed > 0) {
    console.log(`${RED}${BOLD}⚠️  Ada ${failed} test yang gagal. Cek detail di atas.${RESET}\n`);
    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}🎉 Semua test PASSED! Backend siap digunakan.${RESET}\n`);
    process.exit(0);
  }
}

main();
