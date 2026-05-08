# AIGD Agent v3.0 — Task Checklist

Tracking implementasi berdasarkan [implementation_plan.md](file:///d:/Coding/AIGD%20Agent/implementation_plan.md) dan [spec.md](file:///d:/Coding/AIGD%20Agent/spec.md).

---

## Fase 1: Dasar Proyek & Docker

### 1.1 Inisialisasi Next.js
- [x] `npx -y create-next-app@14 --help` — lihat opsi
- [x] `npx -y create-next-app@14 ./ --ts --tailwind --eslint --app --src-dir --import-alias "@/*"`
- [x] Verifikasi `src/app/` tercipta

### 1.2 Konfigurasi Sumopod
- [x] `next.config.mjs` → `output: 'standalone'`
- [x] `npm run build` → pastikan output standalone

### 1.3 Shadcn UI
- [x] `npx shadcn@latest init`
- [x] `npx shadcn@latest add button card input badge scroll-area`

### 1.4 Dependencies
- [x] `npm i @google/genai @googlemaps/google-maps-services-js @googlemaps/js-api-loader firebase-admin zod lucide-react`
- [x] Verifikasi `package.json`

### 1.5 Environment
- [x] Buat `.env.local`:
  - `GOOGLE_AI_API_KEY=`
  - `GOOGLE_MAPS_API_KEY=`
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=`
  - `FIREBASE_PROJECT_ID=`
  - `FIREBASE_CLIENT_EMAIL=`
  - `FIREBASE_PRIVATE_KEY=`
- [x] Pastikan `.env.local` di `.gitignore`

### 1.6 Docker
- [x] Buat `Dockerfile` — 3-stage build (spec §7.2)
- [x] Buat `.dockerignore` (spec §7.3)

### 1.7 Types
- [x] Buat `src/types/index.ts` — `ChatMessage`, `Attachment`, `CareNavResult`, `Facility`, `BookingResult`

---

## Fase 2: Integrasi Firebase & Maps

### 2.1 Firebase Admin
- [x] Buat `src/lib/firebase/admin.ts` — singleton `initializeApp` + `getFirestore`
- [x] Export `db` instance
- [x] Handle `FIREBASE_PRIVATE_KEY` newline replace

### 2.2 Firestore Operations
- [x] `createBooking(params)` → koleksi `bookings` (dengan `care_navigation`, `reasoning`)
- [x] `saveCareSession(params)` → koleksi `care_sessions`

### 2.3 Seed Data
- [x] Buat `src/lib/firebase/seed.ts` — 5–10 faskes dummy Surabaya
- [x] Data: `name`, `type`, `address`, `location`, `phone`, `operating_hours`, `services[]`, `available_slots[]`
- [x] Tambah script `"seed"` di `package.json`
- [ ] Jalankan & verifikasi di Firestore Console

### 2.4 Google Maps Service
- [x] Buat `src/lib/geo/maps-service.ts`
- [x] `findNearbyFacilities(lat, lng, facilityType, radius)`:
  - [x] `placesNearby()` dengan keyword mapping (IGD/Puskesmas/Klinik)
  - [x] Ambil top 5 hasil
  - [x] `directions()` per faskes → `distance_km` + `duration_minutes`
  - [x] Return sorted by jarak
- [x] Helper `mapFacilityTypeToKeyword()`

---

## Fase 3: Core AI & Prompting

### 3.1 Gemini Client
- [x] Buat `src/lib/gemini/client.ts` — `GoogleGenAI` singleton
- [x] Pastikan hanya server-side

### 3.2 System Prompt
- [x] Buat `src/lib/gemini/system-prompt.ts`
- [x] Peran: "Navigator kesehatan, BUKAN dokter"
- [x] Care Navigation — 3 jalur:
  - [x] 🏥 IGD — darurat → arahkan via Maps, tanpa booking
  - [x] 🏪 Puskesmas/Klinik — perlu pemeriksaan → cari faskes → booking
  - [x] 📱 Telemedicine/Self-care — ringan → anjuran
- [x] Reasoning transparan wajib (bahasa awam)
- [x] Batasan: tidak diagnosa, tidak resep obat
- [x] Disclaimer wajib di akhir respons
- [x] Instruksi kapan pakai `getNearbyHospitals` dan `createMockBooking`

### 3.3 Tool Declarations
- [x] Buat `src/lib/gemini/tools.ts` — import `Type` dari `@google/genai`
- [x] `getNearbyHospitalsDeclaration` — `lat`, `lng`, `facility_type` (enum), `radius_meters`
- [x] `createMockBookingDeclaration` — `facility_id`, `facility_name`, `patient_name`, `patient_contact`, `symptoms_summary`, `care_navigation` (enum), `reasoning`, `preferred_time`

### 3.4 Zod Schemas
- [x] Buat `src/lib/schemas/function-schemas.ts`
- [x] `GetNearbyHospitalsSchema`
- [x] `CreateMockBookingSchema` (dengan `care_navigation` enum + `reasoning`)

---

## Fase 4: Function Calling & Agentic Actions

### 4.1 Handler
- [x] Buat `src/lib/handlers/function-handler.ts`
- [x] Case `getNearbyHospitals` → Zod parse → `findNearbyFacilities()`
- [x] Case `createMockBooking` → Zod parse → `createBooking()`

### 4.2 Route Handler
- [x] Buat `src/app/api/chat/route.ts`
- [x] `dynamic = 'force-dynamic'`
- [x] Parse body: `messages`, `attachments`, `location`
- [x] `buildContents()` — text + inlineData (audio/image base64) + location
- [x] `ai.chats.create()` dengan history + tools
- [x] Function calling loop (max 5x):
  - [x] Cek `response.functionCalls`
  - [x] Execute handler
  - [x] `functionResponse` kembali ke model (sertakan `id`)
- [x] Stream final text via SSE
- [x] Disclaimer di akhir stream

### 4.3 Test E2E
- [x] Teks → streaming + Care Navigation + reasoning
- [x] Gejala pemeriksaan → Puskesmas/Klinik → `getNearbyHospitals` → peta
- [x] Gejala darurat → IGD → Maps langsung (tanpa booking)
- [x] Gejala ringan → Telemedicine/Self-care → anjuran
- [x] Booking → `createMockBooking` → doc Firestore
- [x] Setiap rekomendasi ada reasoning bahasa awam

---

## Fase 5: UI Multimodal

### 5.1 Design System
- [x] `globals.css` — tokens: `--font-size-base: 18px`, `--touch-target: 48px`
- [x] Warna navigasi: `--nav-igd`, `--nav-klinik`, `--nav-selfcare`
- [x] `layout.tsx` — Google Fonts, metadata SEO

### 5.2 Pages
- [x] `page.tsx` — landing/redirect ke `/chat`
- [x] `chat/page.tsx` — `'use client'`, state, SSE consumer

### 5.3 Components
- [x] `ChatContainer.tsx` — message list + input bar + `useReducer`
- [x] `MessageBubble.tsx` — bubble user vs AI
- [x] `CareNavCard.tsx` — rekomendasi (IGD/Puskesmas/Telemedicine) + reasoning transparan
- [x] `BookingCard.tsx` — faskes + slot + tombol booking
- [x] `DisclaimerBanner.tsx` — banner sticky

### 5.4 Voice Recorder
- [x] `VoiceRecorder.tsx` — `MediaRecorder API`
- [x] Start/stop recording → audio blob → base64
- [x] UI: tombol mic besar, pulse animation
- [x] Touch ≥ 48px, kontras tinggi

### 5.5 Image Uploader
- [x] `ImageUploader.tsx` — file input `image/*`
- [x] Preview thumbnail
- [x] Image → base64

### 5.6 Peta Interaktif
- [x] `MapEmbed.tsx` — `@googlemaps/js-api-loader`
- [x] Marker lokasi pasien (biru)
- [x] Markers faskes (merah + label)
- [x] Info window: nama, jarak, waktu, status
- [x] Tombol "Navigasi" → Google Maps

### 5.7 Integrasi & Polish
- [x] Hubungkan semua di `ChatContainer`
- [x] SSE → parse type → render CareNavCard / BookingCard / MapEmbed
- [x] Mobile responsive (375px)
- [x] Accessibility: `aria-label` Indonesia, contrast ≥ 4.5:1
- [x] `prefers-reduced-motion`
- [x] `npm run build` — zero errors (butuh env vars)
- [x] `npm run lint` — clean

