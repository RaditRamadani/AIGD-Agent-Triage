# AIGD Agent v3.0 — Task Checklist

Tracking implementasi berdasarkan [implementation_plan.md](file:///C:/Users/AVICOM/.gemini/antigravity/brain/89741396-7cad-47da-9a39-b35b6f24b29a/implementation_plan.md) dan [spec.md](file:///d:/Coding/AIGD%20Agent/spec.md).

---

## Fase 1: Dasar Proyek & Docker

### 1.1 Inisialisasi Next.js
- [ ] Jalankan `npx -y create-next-app@14 --help` untuk lihat opsi
- [ ] Inisialisasi proyek: `npx -y create-next-app@14 ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` (non-interactive)
- [ ] Verifikasi struktur folder `src/app/` tercipta

### 1.2 Konfigurasi Next.js untuk Sumopod
- [ ] Edit `next.config.mjs` → tambah `output: 'standalone'`
- [ ] Verifikasi `npm run build` berhasil dengan output standalone

### 1.3 Shadcn UI
- [ ] Jalankan `npx shadcn@latest init` (pilih default style)
- [ ] Install komponen: `npx shadcn@latest add button card input badge scroll-area`

### 1.4 Install Dependencies
- [ ] Install runtime deps: `npm i @google/genai @googlemaps/google-maps-services-js @googlemaps/js-api-loader firebase-admin zod lucide-react`
- [ ] Verifikasi `package.json` — semua deps tercatat

### 1.5 Environment Variables
- [ ] Buat file `.env.local` dengan template kosong:
  - `GOOGLE_AI_API_KEY=`
  - `GOOGLE_MAPS_API_KEY=`
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=`
  - `FIREBASE_PROJECT_ID=`
  - `FIREBASE_CLIENT_EMAIL=`
  - `FIREBASE_PRIVATE_KEY=`
- [ ] Tambahkan `.env.local` ke `.gitignore` (pastikan sudah ada)

### 1.6 Dockerfile
- [ ] Buat `Dockerfile` — 3-stage build (deps → builder → runner) sesuai spec §7.2
- [ ] Buat `.dockerignore` sesuai spec §7.3
- [ ] Verifikasi `docker build -t aigd-agent:latest .` berhasil (opsional, jika Docker tersedia)

### 1.7 TypeScript Types
- [ ] Buat `src/types/index.ts` — interface `ChatMessage`, `Attachment`, `TriageResult`, `Facility`, `BookingResult`

---

## Fase 2: Integrasi Firebase & Maps

### 2.1 Firebase Admin SDK
- [ ] Buat `src/lib/firebase/admin.ts` — singleton `initializeApp` + `getFirestore`
- [ ] Export fungsi `db` (Firestore instance)
- [ ] Pastikan `privateKey` di-replace `\\n` → `\n`

### 2.2 Firestore Operations
- [ ] Implementasi `searchFacilitiesInFirestore(params)` — query koleksi `facilities` by `type` + filter `available_slots`
- [ ] Implementasi `createBooking(params)` — create doc di koleksi `mock_appointments` dengan `Timestamp.now()`
- [ ] Implementasi `saveTriageSession(params)` — create doc di koleksi `care_sessions`

### 2.3 Seed Script
- [ ] Buat `src/lib/firebase/seed.ts` — data dummy 5–10 faskes area Surabaya
- [ ] Setiap faskes punya: `name`, `type`, `address`, `location` (GeoPoint), `phone`, `operating_hours`, `services[]`, `available_slots[]`
- [ ] Tambah script `"seed"` di `package.json` → `ts-node src/lib/firebase/seed.ts`
- [ ] Jalankan seeder & verifikasi data di Firestore Console

### 2.4 Google Maps Server-Side Service
- [ ] Buat `src/lib/geo/maps-service.ts` — import `Client` dari `@googlemaps/google-maps-services-js`
- [ ] Implementasi `findNearbyFacilities(lat, lng, facilityType, radius)`:
  - [ ] Panggil `mapsClient.placesNearby()` dengan keyword mapping (IGD/Puskesmas/Klinik)
  - [ ] Ambil top 5 hasil
  - [ ] Untuk setiap result, panggil `mapsClient.directions()` → hitung `distance_km` + `duration_minutes`
  - [ ] Return array `NearbyFacility[]` sorted by distance
- [ ] Implementasi fungsi helper `mapFacilityTypeToKeyword(type)` → mapping string

---

## Fase 3: Core AI & Prompting

### 3.1 Gemini Client
- [ ] Buat `src/lib/gemini/client.ts` — `new GoogleGenAI({ apiKey })` singleton
- [ ] Pastikan hanya diimport di server-side (Route Handler)

### 3.2 System Prompt
- [ ] Buat `src/lib/gemini/system-prompt.ts` — export `SYSTEM_PROMPT` string
- [ ] Definisikan peran: "Navigator kesehatan, BUKAN dokter"
- [ ] Definisikan protokol triase:
  - [ ] 🔴 Red → IGD (gejala darurat, arahkan langsung)
  - [ ] 🟡 Yellow → Puskesmas/Klinik (cari faskes → booking)
  - [ ] 🟢 Green → Telemedicine/Self-care
- [ ] Definisikan aturan komunikasi: Bahasa Indonesia awam, reasoning transparan
- [ ] Definisikan batasan: TIDAK diagnosa, TIDAK resep obat
- [ ] Definisikan mandatory disclaimer di akhir setiap respons triase
- [ ] Instruksikan penggunaan tools (`getNearbyHospitals`, `createMockBooking`)

### 3.3 Tool Declarations
- [ ] Buat `src/lib/gemini/tools.ts` — import `Type` dari `@google/genai`
- [ ] Definisikan `getNearbyHospitalsDeclaration` — params: `lat`, `lng`, `facility_type` (enum), `radius_meters`
- [ ] Definisikan `createMockBookingDeclaration` — params: `facility_id`, `facility_name`, `patient_name`, `patient_contact`, `symptoms_summary`, `urgency_level` (enum), `preferred_time`
- [ ] Export `toolDeclarations` array

### 3.4 Zod Schemas
- [ ] Buat `src/lib/schemas/function-schemas.ts`
- [ ] Definisikan `GetNearbyHospitalsSchema` — Zod object, validasi server-side
- [ ] Definisikan `CreateMockBookingSchema` — Zod object, validasi server-side

---

## Fase 4: Function Calling & Agentic Actions

### 4.1 Function Call Handler
- [ ] Buat `src/lib/handlers/function-handler.ts`
- [ ] Implementasi `handleFunctionCall(call)` — switch/case dispatcher:
  - [ ] Case `getNearbyHospitals`: Zod parse → `findNearbyFacilities()` dari maps-service
  - [ ] Case `createMockBooking`: Zod parse → `createBooking()` dari firebase admin
  - [ ] Default: return `{ error: 'Unknown function' }`

### 4.2 Route Handler — `/api/chat`
- [ ] Buat `src/app/api/chat/route.ts`
- [ ] Set `export const dynamic = 'force-dynamic'`
- [ ] Parse request body: `messages`, `attachments`, `location`
- [ ] Implementasi `buildContents()` — konversi messages + attachments (base64 inlineData) + location ke format Gemini
- [ ] Inisialisasi chat: `ai.chats.create({ model, config, history })`
- [ ] Kirim pesan terbaru: `chat.sendMessage({ message: parts })`
- [ ] Implementasi function calling loop (max 5 iterasi):
  - [ ] Cek `response.functionCalls`
  - [ ] Execute via `handleFunctionCall()`
  - [ ] Kirim `functionResponse` kembali ke model (sertakan `id`)
  - [ ] Enqueue hasil ke SSE stream
- [ ] Stream final text ke client
- [ ] Tambah mandatory disclaimer di akhir stream
- [ ] Return `Response` dengan header `text/event-stream`

### 4.3 Test End-to-End (Manual)
- [ ] Test teks biasa → streaming response
- [ ] Test trigger Yellow → `getNearbyHospitals` dipanggil → facilities returned
- [ ] Test trigger Red → arahan IGD langsung (tanpa booking)
- [ ] Test booking flow → `createMockBooking` → doc di Firestore

---

## Fase 5: UI Multimodal

### 5.1 Layout & Design System
- [ ] Edit `src/app/globals.css` — design tokens:
  - [ ] `--font-size-base: 18px` (lansia-friendly)
  - [ ] `--touch-target-min: 48px`
  - [ ] `--triage-red`, `--triage-yellow`, `--triage-green`
- [ ] Edit `src/app/layout.tsx` — Google Fonts (Inter/Outfit), metadata SEO, DisclaimerBanner

### 5.2 Landing Page
- [ ] Buat `src/app/page.tsx` — redirect ke `/chat` atau hero section + CTA

### 5.3 Chat Page
- [ ] Buat `src/app/chat/page.tsx` — `'use client'`, state management, SSE consumer

### 5.4 Chat Components
- [ ] Buat `src/components/chat/ChatContainer.tsx` — wrapper: message list + input bar + `useReducer`
- [ ] Buat `src/components/chat/MessageBubble.tsx` — bubble user vs AI (styling berbeda)
- [ ] Buat `src/components/chat/TriageCard.tsx` — kartu warna R/Y/G + reasoning transparan
- [ ] Buat `src/components/chat/BookingCard.tsx` — pilihan faskes + slot + tombol "Pilih Jadwal"
- [ ] Buat `src/components/chat/DisclaimerBanner.tsx` — banner sticky disclaimer medis

### 5.5 Voice Recorder
- [ ] Buat `src/components/chat/VoiceRecorder.tsx`
- [ ] Implementasi `MediaRecorder API` — start/stop recording
- [ ] Konversi audio blob → base64 string
- [ ] UI: tombol mic besar (primary action), pulse animation saat recording
- [ ] Touch target ≥ 48×48px, kontras tinggi

### 5.6 Image Uploader
- [ ] Buat `src/components/chat/ImageUploader.tsx`
- [ ] Implementasi file input → accept `image/*`
- [ ] Preview thumbnail sebelum kirim
- [ ] Konversi image → base64 string
- [ ] UI: tombol kamera/upload, ikon 📷

### 5.7 Peta Interaktif (MapEmbed)
- [ ] Buat `src/components/chat/MapEmbed.tsx`
- [ ] Import `Loader` dari `@googlemaps/js-api-loader`
- [ ] Render peta interaktif embedded (Google Maps JS API)
- [ ] Marker lokasi pasien (biru)
- [ ] Marker setiap faskes hasil pencarian (merah, dengan label)
- [ ] Info window: nama faskes, jarak, waktu tempuh, status buka/tutup
- [ ] Tombol "Navigasi" → buka `google.com/maps/dir/` di tab baru

### 5.8 Integrasi & Polish
- [ ] Hubungkan semua komponen di `ChatContainer`:
  - [ ] VoiceRecorder → kirim audio attachment
  - [ ] ImageUploader → kirim image attachment
  - [ ] SSE stream → parse `type` → render MessageBubble / TriageCard / BookingCard / MapEmbed
- [ ] Verifikasi mobile responsiveness (375px viewport)
- [ ] Verifikasi accessibility: `aria-label` Bahasa Indonesia, contrast ≥ 4.5:1
- [ ] `prefers-reduced-motion` untuk animasi
- [ ] Final: `npm run build` — zero errors
- [ ] Final: `npm run lint` — clean
   
 