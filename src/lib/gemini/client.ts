// ── Gemini Client via AI Studio ──
// Menggunakan API Key untuk reliabilitas maksimal dan akses ke model terbaru.

import { GoogleGenAI } from '@google/genai';

if (typeof window !== 'undefined') {
  throw new Error('This module can only be used on the server side.');
}

// Gunakan Vertex AI dengan credential Firebase service account
export const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.FIREBASE_PROJECT_ID || 'dummy-project',
  location: 'us-central1',
  googleAuthOptions: {
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL || 'dummy@example.com',
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || 'dummy-key',
    },
  },
});
