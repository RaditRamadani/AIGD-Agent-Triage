import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { CareNavigationType } from '@/types';

// ── Singleton Firebase Admin ──
// Prevents re-initialization during Next.js hot-reload
// Mode 1: Full Service Account (production) — butuh FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
// Mode 2: projectId-only (development) — cukup FIREBASE_PROJECT_ID
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    // Production mode: full Service Account credentials
    const serviceAccount: ServiceAccount = {
      projectId: projectId!,
      clientEmail,
      privateKey,
    };
    initializeApp({ credential: cert(serviceAccount) });
    console.log('🔥 Firebase Admin initialized with Service Account');
  } else if (projectId) {
    // Dev mode: projectId only (gunakan Application Default Credentials)
    // Pastikan sudah login: gcloud auth application-default login
    initializeApp({ projectId });
    console.log('🔥 Firebase Admin initialized with projectId (dev mode)');
  } else {
    // Fallback for build time
    initializeApp({ projectId: 'dummy-project' });
    console.log('🔥 Firebase Admin initialized with dummy project (build mode)');
  }
}

export const db = getFirestore();

// ── Collections ──
const BOOKINGS = 'bookings';
const CARE_SESSIONS = 'care_sessions';

// ── Booking Operations ──

export interface CreateBookingParams {
  facility_id: string;
  facility_name: string;
  patient_name: string;
  patient_contact: string;
  appointment_time?: string;        // ISO string or HH:mm
  symptoms_summary: string;
  care_navigation: CareNavigationType;
  reasoning: string;
}

export async function createBooking(params: CreateBookingParams) {
  const docRef = await db.collection(BOOKINGS).add({
    facility_id: params.facility_id,
    facility_name: params.facility_name,
    patient_name: params.patient_name,
    patient_contact: params.patient_contact,
    appointment_time: params.appointment_time ?? null,
    care_result: {
      care_navigation: params.care_navigation,
      reasoning: params.reasoning,
      symptoms_summary: params.symptoms_summary,
    },
    status: 'Confirmed',
    created_at: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    booking_id: docRef.id,
    facility_name: params.facility_name,
    care_navigation: params.care_navigation,
    reasoning: params.reasoning,
  };
}

// ── Care Session Operations ──

export interface SaveCareSessionParams {
  care_navigation: CareNavigationType;
  reasoning: string;
  symptoms_extracted: string[];
  input_modalities: ('voice' | 'image' | 'text')[];
  booking_id?: string | null;
}

export async function saveCareSession(params: SaveCareSessionParams) {
  const docRef = await db.collection(CARE_SESSIONS).add({
    created_at: FieldValue.serverTimestamp(),
    care_navigation: params.care_navigation,
    reasoning: params.reasoning,
    symptoms_extracted: params.symptoms_extracted,
    input_modalities: params.input_modalities,
    booking_id: params.booking_id ?? null,
  });

  return { session_id: docRef.id };
}

export { Timestamp };
