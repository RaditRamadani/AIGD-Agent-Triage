// ── Chat Message ──
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp?: number;
}

// ── Multimodal Attachment ──
export interface Attachment {
  type: string;   // e.g. "image/jpeg", "audio/webm"
  data: string;   // base64 encoded
}

// ── Care Navigation Result ──
export type CareNavigationType = 'IGD' | 'Puskesmas/Klinik' | 'Telemedicine/Self-care';

export interface CareNavResult {
  care_navigation: CareNavigationType;
  reasoning: string;
  symptoms_summary: string;
}

// ── Facility (from Google Maps) ──
export interface Facility {
  id?: string;
  place_id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  is_open: boolean | null;
  distance_km: number | null;
  duration_minutes: number | null;
  type?: string;
}

// ── Booking Result ──
export interface BookingResult {
  success: boolean;
  booking_id: string;
  facility_name: string;
  care_navigation: CareNavigationType;
  reasoning: string;
}

// ── SSE Event Types ──
export type SSEEventType = 'text' | 'care_nav' | 'facilities' | 'booking' | 'disclaimer' | 'tool';

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
  name?: string;
}
