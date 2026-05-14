// ── Gemini Client via Vertex AI ──
// Menggunakan Vertex AI (Google Cloud) untuk memanfaatkan $5 kredit GCP.
// Autentikasi lewat service account Firebase yang sudah ada di .env.local.

import { GoogleGenAI } from '@google/genai';

if (typeof window !== 'undefined') {
  throw new Error('This module can only be used on the server side.');
}

// Gunakan Vertex AI dengan credential Firebase service account
export const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.FIREBASE_PROJECT_ID!,
  location: 'us-central1',
  googleAuthOptions: {
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL!,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  },
});
