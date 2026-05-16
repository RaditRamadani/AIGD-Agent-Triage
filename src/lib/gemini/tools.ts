import { Type, FunctionDeclaration } from '@google/genai';

export const getNearbyHospitalsDeclaration: FunctionDeclaration = {
  name: 'getNearbyHospitals',
  description: 'Cari fasilitas kesehatan terdekat dari lokasi pasien berdasarkan hasil Care Navigation.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      lat: { 
        type: Type.NUMBER, 
        description: 'Latitude lokasi pasien' 
      },
      lng: { 
        type: Type.NUMBER, 
        description: 'Longitude lokasi pasien' 
      },
      facility_type: {
        type: Type.STRING,
        enum: ['Puskesmas', 'Klinik', 'IGD'],
        description: 'Jenis faskes sesuai hasil Care Navigation'
      },
      radius_meters: { 
        type: Type.NUMBER, 
        description: 'Radius pencarian (meter)' 
      },
    },
    required: ['lat', 'lng', 'facility_type'],
  },
};

export const createMockBookingDeclaration: FunctionDeclaration = {
  name: 'createMockBooking',
  description: 'Buat reservasi simulasi di faskes yang dipilih pasien.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      facility_id: { type: Type.STRING, description: 'ID faskes' },
      facility_name: { type: Type.STRING, description: 'Nama faskes' },
      patient_name: { type: Type.STRING, description: 'Nama pasien' },
      patient_contact: { type: Type.STRING, description: 'No. HP/WA pasien' },
      symptoms_summary: { type: Type.STRING, description: 'Ringkasan gejala' },
      care_navigation: {
        type: Type.STRING,
        enum: ['IGD', 'Puskesmas/Klinik', 'Telemedicine/Self-care'],
        description: 'Hasil Care Navigation',
      },
      reasoning: { type: Type.STRING, description: 'Alasan rekomendasi (bahasa awam)' },
      preferred_time: { type: Type.STRING, description: 'Waktu pilihan (HH:mm)' },
    },
    required: [
      'facility_id', 'facility_name', 'patient_name', 'patient_contact',
      'symptoms_summary', 'care_navigation', 'reasoning'
    ],
  },
};

export const promptBookingFormDeclaration: FunctionDeclaration = {
  name: 'promptBookingForm',
  description: 'Tampilkan formulir pendaftaran kepada pasien untuk mengumpulkan detail reservasi (Nama, HP, Waktu).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      facility_id: { type: Type.STRING, description: 'ID faskes' },
      facility_name: { type: Type.STRING, description: 'Nama faskes' },
    },
    required: ['facility_id', 'facility_name'],
  },
};
