import { GoogleGenAI } from '@google/genai';

if (typeof window !== 'undefined') {
  throw new Error('This module can only be used on the server side.');
}

export const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
