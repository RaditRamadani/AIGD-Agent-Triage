// ── Gemini Client via AI Studio ──
// Menggunakan API Key untuk reliabilitas maksimal dan akses ke model terbaru.

import { GoogleGenAI } from '@google/genai';

if (typeof window !== 'undefined') {
  throw new Error('This module can only be used on the server side.');
}

// Gunakan API Key dari .env.local
export const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY || '',
});
