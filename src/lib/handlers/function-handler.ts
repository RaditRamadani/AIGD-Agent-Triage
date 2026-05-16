// ── Function Call Handler ──
// Menjembatani function calls dari Gemini ke service layer (Maps & Firebase).
// Setiap function call divalidasi dengan Zod schema sebelum dieksekusi.

import { findNearbyFacilities } from '@/lib/geo/maps-service';
import { createBooking } from '@/lib/firebase/admin';
import {
  GetNearbyHospitalsSchema,
  CreateMockBookingSchema,
  PromptBookingFormSchema,
} from '@/lib/schemas/function-schemas';

// ── Type untuk hasil handler ──
export interface FunctionHandlerResult {
  name: string;
  result: Record<string, unknown>;
}

/**
 * Mengeksekusi function call yang diterima dari Gemini.
 * Mendukung 2 tool: getNearbyHospitals dan createMockBooking.
 *
 * @param functionName - Nama fungsi yang dipanggil oleh Gemini
 * @param args - Argumen mentah dari Gemini (belum divalidasi)
 * @returns Hasil eksekusi untuk dikirim kembali ke Gemini sebagai functionResponse
 */
export async function handleFunctionCall(
  functionName: string,
  args: Record<string, unknown>
): Promise<FunctionHandlerResult> {
  switch (functionName) {
    // ── Tool 1: Cari faskes terdekat via Google Maps ──
    case 'getNearbyHospitals': {
      // Validasi argumen pakai Zod
      const parsed = GetNearbyHospitalsSchema.parse(args);

      // Panggil Maps service
      const facilities = await findNearbyFacilities(
        parsed.lat,
        parsed.lng,
        parsed.facility_type,
        parsed.radius_meters
      );

      return {
        name: functionName,
        result: {
          success: true,
          facilities,
          total: facilities.length,
        },
      };
    }

    // ── Tool 2: Booking simulasi ke Firestore ──
    case 'createMockBooking': {
      // Validasi argumen pakai Zod
      const parsed = CreateMockBookingSchema.parse(args);

      // Simpan booking ke Firestore
      const bookingResult = await createBooking({
        facility_id: parsed.facility_id,
        facility_name: parsed.facility_name,
        patient_name: parsed.patient_name,
        patient_contact: parsed.patient_contact,
        symptoms_summary: parsed.symptoms_summary,
        care_navigation: parsed.care_navigation,
        reasoning: parsed.reasoning,
        appointment_time: parsed.preferred_time,
      });

      return {
        name: functionName,
        result: {
          success: bookingResult.success,
          booking_id: bookingResult.booking_id,
          facility_name: bookingResult.facility_name,
          message: `Reservasi berhasil dibuat di ${bookingResult.facility_name}`,
        },
      };
    }

    // ── Tool 3: Tampilkan Form Booking ──
    case 'promptBookingForm': {
      const parsed = PromptBookingFormSchema.parse(args);
      return {
        name: functionName,
        result: {
          success: true,
          facility_id: parsed.facility_id,
          facility_name: parsed.facility_name,
          message: 'Silakan isi formulir di bawah untuk melanjutkan reservasi.',
        },
      };
    }


    // ── Fungsi tidak dikenali ──
    default:
      return {
        name: functionName,
        result: {
          success: false,
          error: `Fungsi "${functionName}" tidak ditemukan.`,
        },
      };
  }
}
