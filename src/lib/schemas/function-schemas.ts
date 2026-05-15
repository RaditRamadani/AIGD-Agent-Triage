import { z } from 'zod';

export const GetNearbyHospitalsSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  facility_type: z.enum(['Puskesmas', 'Klinik', 'IGD']),
  radius_meters: z.number().optional().default(20000),
});

export const CreateMockBookingSchema = z.object({
  facility_id: z.string(),
  facility_name: z.string(),
  patient_name: z.string(),
  patient_contact: z.string(),
  symptoms_summary: z.string(),
  care_navigation: z.enum(['IGD', 'Puskesmas/Klinik', 'Telemedicine/Self-care']),
  reasoning: z.string(),
  preferred_time: z.string().optional(),
});
