import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { CareNavigationType } from '@/types';

// ── Singleton Firebase Admin ──
// Prevents re-initialization during Next.js hot-reload
const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID!,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  // Sumopod/Docker injects newlines as literal \n — must be converted
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
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
