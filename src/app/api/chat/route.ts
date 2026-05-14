// ── POST /api/chat ──
// API Route Handler utama AIGD Agent.
// Menerima input multimodal (teks, gambar, audio), menjalankan Gemini
// dengan function calling loop, dan mengirim hasilnya via Server-Sent Events.

import { NextRequest } from 'next/server';
import { ai } from '@/lib/gemini/client';
import { systemPrompt } from '@/lib/gemini/system-prompt';
import {
  getNearbyHospitalsDeclaration,
  createMockBookingDeclaration,
} from '@/lib/gemini/tools';
import { handleFunctionCall } from '@/lib/handlers/function-handler';
import type { ChatMessage, Attachment, SSEEvent } from '@/types';
import type { Content, Part } from '@google/genai';

// Force dynamic rendering (no static optimization)
export const dynamic = 'force-dynamic';

// ── Disclaimer wajib di akhir setiap response ──
const DISCLAIMER =
  '⚕️ Sistem ini adalah navigator kesehatan, bukan dokter. Rekomendasi yang diberikan bukan diagnosis medis final. Keputusan akhir tetap di tangan tenaga medis profesional.';

// ── Max function calling loop untuk mencegah infinite loop ──
const MAX_FUNCTION_CALL_ROUNDS = 5;

// ── Interface untuk body request ──
interface ChatRequestBody {
  messages: ChatMessage[];
  attachments?: Attachment[];
  location?: { lat: number; lng: number };
}

/**
 * Helper: Konversi pesan frontend menjadi format Content yang
 * dipakai oleh Google AI SDK (termasuk inline data untuk audio/gambar).
 */
function buildContents(
  messages: ChatMessage[],
  attachments?: Attachment[],
  location?: { lat: number; lng: number }
): Content[] {
  const contents: Content[] = [];

  // Konversi history messages (kecuali pesan terakhir)
  for (let i = 0; i < messages.length - 1; i++) {
    const msg = messages[i];
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    });
  }

  // Pesan terakhir (user) — tambahkan attachments & location context
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage) return contents;

  const parts: Part[] = [];

  // Tambahkan teks pesan utama
  let userText = lastMessage.content;

  // Sematkan info lokasi ke konteks jika tersedia
  if (location) {
    userText += `\n\n[Lokasi pasien saat ini: lat=${location.lat}, lng=${location.lng}]`;
  }

  parts.push({ text: userText });

  // Tambahkan attachments sebagai inline data (gambar/audio → base64)
  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      parts.push({
        inlineData: {
          mimeType: attachment.type,
          data: attachment.data,
        },
      });
    }
  }

  contents.push({
    role: 'user',
    parts,
  });

  return contents;
}

/**
 * Helper: Encode SSE event dan tulis ke stream.
 * Format: "data: {JSON}\n\n"
 */
function writeSSE(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  event: SSEEvent
): Promise<void> {
  const line = `data: ${JSON.stringify(event)}\n\n`;
  return writer.write(encoder.encode(line));
}

/**
 * POST /api/chat
 *
 * Menerima chat messages + attachments + location,
 * lalu streaming response AI via SSE.
 */
export async function POST(request: NextRequest) {
  try {
    // ── Parse request body ──
    const body: ChatRequestBody = await request.json();
    const { messages, attachments, location } = body;

    // Validasi minimal: harus ada minimal 1 pesan
    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Minimal 1 pesan diperlukan.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── Build conversation history untuk Gemini ──
    const contents = buildContents(messages, attachments, location);

    // ── Setup SSE stream ──
    const stream = new TransformStream<Uint8Array, Uint8Array>();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Jalankan logic di background agar stream langsung dimulai
    const processChat = async () => {
      try {
        // ── Buat chat session dengan tools ──
        const chat = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: systemPrompt,
            tools: [
              {
                functionDeclarations: [
                  getNearbyHospitalsDeclaration,
                  createMockBookingDeclaration,
                ],
              },
            ],
          },
          history: contents.slice(0, -1), // Semua kecuali pesan terakhir
        });

        // ── Kirim pesan terakhir ke Gemini ──
        const lastContent = contents[contents.length - 1];
        let response = await chat.sendMessage({ message: lastContent.parts! });

        // ── Function calling loop ──
        // Gemini bisa minta eksekusi function, lalu kita kirim hasilnya balik.
        // Loop sampai Gemini berhenti minta function call, atau max 5 rounds.
        let functionCallRound = 0;

        while (functionCallRound < MAX_FUNCTION_CALL_ROUNDS) {
          const functionCalls = response.functionCalls;

          // Kalau tidak ada function call, keluar dari loop
          if (!functionCalls || functionCalls.length === 0) break;

          functionCallRound++;

          // Eksekusi setiap function call
          const functionResponses: Part[] = [];

          for (const fc of functionCalls) {
            // Kirim SSE event bahwa tool sedang dieksekusi
            await writeSSE(writer, encoder, {
              type: 'tool',
              name: fc.name,
              data: { status: 'executing', tool: fc.name },
            });

            try {
              // Jalankan handler dan dapatkan hasilnya
              const handlerResult = await handleFunctionCall(
                fc.name ?? '',
                (fc.args as Record<string, unknown>) ?? {}
              );

              // ── Kirim SSE events berdasarkan tipe tool ──
              if (fc.name === 'getNearbyHospitals' && handlerResult.result.success) {
                await writeSSE(writer, encoder, {
                  type: 'facilities',
                  data: handlerResult.result.facilities,
                });
              } else if (fc.name === 'createMockBooking' && handlerResult.result.success) {
                await writeSSE(writer, encoder, {
                  type: 'booking',
                  data: handlerResult.result,
                });
              }

              // Siapkan functionResponse untuk dikirim balik ke Gemini
              functionResponses.push({
                functionResponse: {
                  name: handlerResult.name,
                  response: handlerResult.result,
                  id: fc.id,
                },
              });
            } catch (toolError) {
              // Kalau tool error, tetap kirim response error ke Gemini
              // supaya dia bisa handle gracefully
              console.error(`Error executing tool ${fc.name}:`, toolError);

              functionResponses.push({
                functionResponse: {
                  name: fc.name ?? '',
                  response: {
                    success: false,
                    error: toolError instanceof Error
                      ? toolError.message
                      : 'Terjadi kesalahan saat menjalankan fungsi.',
                  },
                  id: fc.id,
                },
              });
            }
          }

          // ── Kirim semua function responses kembali ke Gemini ──
          response = await chat.sendMessage({ message: functionResponses });
        }

        // ── Stream teks final dari Gemini ──
        let finalText = response.text ?? '';

        // ── Kirim Care Navigation summary jika terdeteksi ──
        const careNav = extractCareNavigation(finalText);

        // Bersihkan tag triage dari teks agar tidak muncul di layar user
        finalText = finalText.replace(/\[TRIAGE:\s*(IGD|PUSKESMAS|TELEMEDICINE)\]/gi, '').trim();

        if (finalText) {
          // Pecah teks jadi beberapa chunk untuk efek streaming
          const chunks = splitTextForStreaming(finalText);

          for (const chunk of chunks) {
            await writeSSE(writer, encoder, {
              type: 'text',
              data: chunk,
            });
          }
        }

        if (careNav) {
          await writeSSE(writer, encoder, {
            type: 'care_nav',
            data: careNav,
          });
        }

        // ── Disclaimer wajib di akhir ──
        await writeSSE(writer, encoder, {
          type: 'disclaimer',
          data: DISCLAIMER,
        });
      } catch (error) {
        console.error('Chat processing error:', error);
        await writeSSE(writer, encoder, {
          type: 'text',
          data: 'Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.',
        });
      } finally {
        // Tutup stream
        await writer.close();
      }
    };

    // Mulai proses chat di background
    processChat();

    // Return SSE response
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('Request parsing error:', error);
    return new Response(
      JSON.stringify({ error: 'Gagal memproses request. Pastikan format body benar.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ── Utility: Pecah teks menjadi chunk kecil untuk efek streaming ──
// Memecah berdasarkan kalimat agar tampil natural di UI
function splitTextForStreaming(text: string): string[] {
  // Pecah berdasarkan kalimat (titik, tanda seru, tanda tanya diikuti spasi)
  const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g);

  if (!sentences) return [text];

  // Gabungkan kalimat-kalimat pendek supaya chunk tidak terlalu kecil
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    currentChunk += sentence;
    // Kirim chunk setiap ~100 karakter minimum
    if (currentChunk.length >= 100) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
  }

  // Sisa teks terakhir
  if (currentChunk.trim()) {
    chunks.push(currentChunk);
  }

  return chunks.length > 0 ? chunks : [text];
}

// ── Utility: Ekstrak Care Navigation level dari teks respons ──
// Cari pola tag spesifik di respons Gemini
function extractCareNavigation(
  text: string
): { care_navigation: string; reasoning: string } | null {
  // Deteksi level berdasarkan tag eksplisit yang kita instruksikan ke AI
  if (/\[TRIAGE:\s*IGD\]/i.test(text)) {
    return {
      care_navigation: 'IGD',
      reasoning: extractReasoning(text),
    };
  }
  if (/\[TRIAGE:\s*PUSKESMAS\]/i.test(text)) {
    return {
      care_navigation: 'Puskesmas/Klinik',
      reasoning: extractReasoning(text),
    };
  }
  if (/\[TRIAGE:\s*TELEMEDICINE\]/i.test(text)) {
    return {
      care_navigation: 'Telemedicine/Self-care',
      reasoning: extractReasoning(text),
    };
  }

  return null;
}

// ── Utility: Ambil kalimat pertama sebagai reasoning singkat ──
function extractReasoning(text: string): string {
  // Bersihkan tag triage sebelum ambil reasoning
  const cleanText = text.replace(/\[TRIAGE:\s*(IGD|PUSKESMAS|TELEMEDICINE)\]/gi, '').trim();
  // Ambil 2 kalimat pertama sebagai reasoning
  const sentences = cleanText.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length >= 2) {
    return sentences.slice(0, 2).join('').trim();
  }
  // Fallback: 200 karakter pertama
  return cleanText.substring(0, 200).trim();
}
