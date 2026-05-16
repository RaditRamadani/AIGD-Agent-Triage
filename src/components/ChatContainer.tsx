"use client";

import { useReducer, useRef, useEffect, useCallback, useState } from "react";
import { Send, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import type { ChatMessage, Attachment, Facility, SSEEvent } from "@/types";
import { DisclaimerBanner } from "./DisclaimerBanner";
import { MessageBubble, TypingIndicator } from "./MessageBubble";
import { CareNavCard } from "./CareNavCard";
import { BookingCard } from "./BookingCard";
import { BookingFormCard } from "./BookingFormCard";
import { MapEmbed } from "./MapEmbed";
import { VoiceRecorder } from "./VoiceRecorder";
import { ImageUploader } from "./ImageUploader";

// ══════════════════════════════════════════════════════════════
// State Management (useReducer)
// ══════════════════════════════════════════════════════════════

// Tipe item yang bisa muncul di chat feed
interface CareNavItem {
  type: "care_nav";
  careNavigation: string;
  reasoning: string;
}

interface FacilitiesItem {
  type: "facilities";
  facilities: Facility[];
}

interface BookingItem {
  type: "booking";
  bookingId: string;
  facilityName: string;
  message: string;
}

interface BookingFormItem {
  type: "booking_form";
  facilityId: string;
  facilityName: string;
}

type FeedItem =
  | { type: "message"; message: ChatMessage }
  | CareNavItem
  | FacilitiesItem
  | BookingItem
  | BookingFormItem;

interface ChatState {
  feed: FeedItem[];
  isLoading: boolean;
  userLocation: { lat: number; lng: number } | null;
}

type ChatAction =
  | { type: "ADD_USER_MESSAGE"; content: string }
  | { type: "START_AI_RESPONSE" }
  | { type: "APPEND_AI_TEXT"; text: string }
  | { type: "ADD_CARE_NAV"; careNavigation: string; reasoning: string }
  | { type: "ADD_FACILITIES"; facilities: Facility[] }
  | { type: "ADD_BOOKING"; bookingId: string; facilityName: string; message: string }
  | { type: "ADD_BOOKING_FORM"; facilityId: string; facilityName: string }
  | { type: "FINISH_AI_RESPONSE" }
  | { type: "SET_LOCATION"; location: { lat: number; lng: number } };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_USER_MESSAGE":
      return {
        ...state,
        feed: [
          ...state.feed,
          { type: "message", message: { role: "user", content: action.content } },
        ],
      };

    case "START_AI_RESPONSE":
      return {
        ...state,
        isLoading: true,
        feed: [
          ...state.feed,
          { type: "message", message: { role: "model", content: "" } },
        ],
      };

    case "APPEND_AI_TEXT": {
      // Cari message AI terakhir dan tambahkan teks
      const updatedFeed = [...state.feed];
      for (let i = updatedFeed.length - 1; i >= 0; i--) {
        const item = updatedFeed[i];
        if (item.type === "message" && item.message.role === "model") {
          updatedFeed[i] = {
            type: "message",
            message: { ...item.message, content: item.message.content + action.text },
          };
          break;
        }
      }
      return { ...state, feed: updatedFeed };
    }

    case "ADD_CARE_NAV":
      return {
        ...state,
        feed: [
          ...state.feed,
          { type: "care_nav", careNavigation: action.careNavigation, reasoning: action.reasoning },
        ],
      };

    case "ADD_FACILITIES":
      return {
        ...state,
        feed: [
          ...state.feed,
          { type: "facilities", facilities: action.facilities },
        ],
      };

    case "ADD_BOOKING":
      return {
        ...state,
        // Hapus item facilities & booking_form setelah booking berhasil
        // agar daftar rekomendasi tidak tertampil setelah proses booking selesai
        feed: [
          ...state.feed.filter(
            (item) => item.type !== "facilities"
          ),
          {
            type: "booking",
            bookingId: action.bookingId,
            facilityName: action.facilityName,
            message: action.message,
          },
        ],
      };

    case "ADD_BOOKING_FORM":
      return {
        ...state,
        feed: [
          ...state.feed,
          {
            type: "booking_form",
            facilityId: action.facilityId,
            facilityName: action.facilityName,
          },
        ],
      };

    case "FINISH_AI_RESPONSE":
      return { ...state, isLoading: false };

    case "SET_LOCATION":
      return { ...state, userLocation: action.location };

    default:
      return state;
  }
}

const initialState: ChatState = {
  feed: [],
  isLoading: false,
  userLocation: null,
};

// ══════════════════════════════════════════════════════════════
// ChatContainer Component
// ══════════════════════════════════════════════════════════════

export function ChatContainer() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [textInput, setTextInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // ── Auto-scroll ke bawah saat ada pesan baru ──
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.feed, state.isLoading]);

  // ── Deteksi lokasi user saat mount ──
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          dispatch({
            type: "SET_LOCATION",
            location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          });
        },
        (err) => {
          console.warn("Gagal mendapatkan lokasi:", err.message);
        }
      );
    }
  }, []);

  // ── Handle voice transcription complete ──
  // Terima teks hasil transkripsi dari Web Speech API dan kirim sebagai chat biasa
  const handleVoiceTranscript = useCallback(
    (text: string) => {
      if (text.trim()) {
        sendMessage(text.trim());
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.feed, state.userLocation]
  );

  // ── Handle image upload ──
  const handleImageSelected = useCallback(
    (imageBase64: string, mimeType: string) => {
      setAttachments((prev) => [...prev, { type: mimeType, data: imageBase64 }]);
      // Simpan preview (data URL)
      setImagePreview(`data:${mimeType};base64,${imageBase64}`);
    },
    []
  );

  // ── Clear image preview ──
  const clearImagePreview = useCallback(() => {
    setImagePreview(null);
    setAttachments((prev) => prev.filter((a) => !a.type.startsWith("image/")));
  }, []);

  // ── Auto-resize textarea sesuai konten ──
  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    // Batasi tinggi maksimum ~5 baris (sekitar 120px)
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  // ══════════════════════════════════════════════════════════════
  // Send Message & SSE Consumer
  // ══════════════════════════════════════════════════════════════

  const sendMessage = useCallback(
    async (overrideText?: string, overrideAttachments?: Attachment[]) => {
      const content = overrideText || textInput.trim();
      if (!content && attachments.length === 0) return;

      // Tambahkan pesan user ke feed
      dispatch({ type: "ADD_USER_MESSAGE", content });
      dispatch({ type: "START_AI_RESPONSE" });

      // Reset input & kembalikan ukuran textarea ke 1 baris
      setTextInput("");
      setImagePreview(null);
      if (inputRef.current) {
        inputRef.current.style.height = "48px";
      }

      // Bangun history dari feed
      const history: ChatMessage[] = state.feed
        .filter((item): item is { type: "message"; message: ChatMessage } => item.type === "message")
        .map((item) => item.message);

      // Tambahkan pesan yang baru dikirim
      history.push({ role: "user", content });

      // Kirim request ke API
      try {
        const currentAttachments = overrideAttachments || attachments;

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
            location: state.userLocation ?? undefined,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // ── Consume SSE stream ──
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Parse setiap baris SSE
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || ""; // Simpan sisa yang belum lengkap

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6); // Hapus "data: "

              try {
                const event: SSEEvent = JSON.parse(jsonStr);

                switch (event.type) {
                  case "text":
                    dispatch({ type: "APPEND_AI_TEXT", text: event.data as string });
                    break;

                  case "care_nav": {
                    const nav = event.data as { care_navigation: string; reasoning: string };
                    dispatch({
                      type: "ADD_CARE_NAV",
                      careNavigation: nav.care_navigation,
                      reasoning: nav.reasoning,
                    });
                    break;
                  }

                  case "facilities": {
                    const facilities = event.data as Facility[];
                    dispatch({ type: "ADD_FACILITIES", facilities });
                    break;
                  }

                  case "booking": {
                    const booking = event.data as {
                      booking_id: string;
                      facility_name: string;
                      message: string;
                    };
                    dispatch({
                      type: "ADD_BOOKING",
                      bookingId: booking.booking_id,
                      facilityName: booking.facility_name,
                      message: booking.message,
                    });
                    break;
                  }

                  case "booking_form": {
                    const form = event.data as {
                      facility_id: string;
                      facility_name: string;
                    };
                    dispatch({
                      type: "ADD_BOOKING_FORM",
                      facilityId: form.facility_id,
                      facilityName: form.facility_name,
                    });
                    break;
                  }

                  case "disclaimer":
                    // Disclaimer sudah ditampilkan di banner, skip
                    break;

                  case "tool":
                    // Tool execution status — bisa ditampilkan jika mau
                    break;
                }
              } catch {
                // JSON parse error — skip malformed event
              }
            }
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
        dispatch({
          type: "APPEND_AI_TEXT",
          text: "Maaf, terjadi kesalahan koneksi. Silakan coba lagi.",
        });
      } finally {
        dispatch({ type: "FINISH_AI_RESPONSE" });
        setAttachments([]);
      }
    },
    [textInput, attachments, state.feed, state.userLocation]
  );

  // ── Handle form submit ──
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  // ══════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* ── Header ── */}
      <header className="shrink-0 bg-white border-b border-[hsl(var(--color-border))] px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => router.push("/")}
            className="touch-target w-10 h-10 rounded-lg flex items-center justify-center
                       hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
            aria-label="Kembali ke beranda"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold text-base">AIGD Agent</h1>
            <p className="text-xs text-[hsl(var(--color-text-muted))]">
              Navigator Kesehatan Cerdas
            </p>
          </div>
          {/* Location indicator */}
          {state.userLocation && (
            <span className="ml-auto text-xs text-[hsl(var(--color-text-muted))] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Lokasi aktif
            </span>
          )}
        </div>
      </header>

      {/* ── Disclaimer Banner ── */}
      <DisclaimerBanner />

      {/* ── Chat Feed ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto chat-scroll px-4 py-4 space-y-4 max-w-2xl mx-auto w-full"
      >
        {/* Empty state */}
        {state.feed.length === 0 && !state.isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
            <p className="text-lg font-medium">Halo! 👋</p>
            <p className="text-sm max-w-xs">
              Ceritakan keluhan Anda atau tekan tombol mikrofon untuk berbicara.
              Saya akan membantu menavigasi Anda ke fasilitas kesehatan yang tepat.
            </p>
          </div>
        )}

        {/* Render feed items */}
        {state.feed.map((item, index) => {
          switch (item.type) {
            case "message":
              // Jangan tampilkan bubble AI kosong
              if (item.message.role === "model" && !item.message.content) return null;
              return <MessageBubble key={index} message={item.message} />;

            case "care_nav":
              return (
                <CareNavCard
                  key={index}
                  careNavigation={item.careNavigation as "IGD" | "Puskesmas/Klinik" | "Telemedicine/Self-care"}
                  reasoning={item.reasoning}
                />
              );

            case "facilities":
              return (
                <MapEmbed
                  key={index}
                  facilities={item.facilities}
                  userLocation={state.userLocation ?? undefined}
                />
              );

            case "booking":
              return (
                <BookingCard
                  key={index}
                  bookingId={item.bookingId}
                  facilityName={item.facilityName}
                  message={item.message}
                />
              );

            case "booking_form":
              return (
                <BookingFormCard
                  key={index}
                  facilityId={item.facilityId}
                  facilityName={item.facilityName}
                  disabled={state.isLoading}
                  onSubmit={(data) => {
                    const submissionText = `Data reservasi untuk ${item.facilityName}:\nNama: ${data.name}\nNo HP: ${data.phone}\nWaktu: ${data.time}\nSilakan proses bookingnya.`;
                    sendMessage(submissionText);
                  }}
                />
              );

            default:
              return null;
          }
        })}

        {/* Typing indicator */}
        {state.isLoading && <TypingIndicator />}
      </div>

      {/* ── Input Bar ── */}
      <div className="shrink-0 bg-white border-t border-[hsl(var(--color-border))] px-4 py-3">
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 max-w-2xl mx-auto"
        >
          {/* Image uploader */}
          <ImageUploader
            onImageSelected={handleImageSelected}
            preview={imagePreview}
            onClearPreview={clearImagePreview}
            disabled={state.isLoading}
          />

          {/* Text input — textarea auto-resize */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              value={textInput}
              onChange={(e) => {
                setTextInput(e.target.value);
                autoResize();
              }}
              onKeyDown={(e) => {
                // Enter = kirim, Shift+Enter = baris baru
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ketik keluhan Anda..."
              disabled={state.isLoading}
              className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--color-border))]
                         bg-[hsl(var(--color-bg))] text-base
                         placeholder:text-[hsl(var(--color-text-muted))]
                         focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]
                         disabled:opacity-50 transition-all duration-150
                         resize-none overflow-hidden leading-relaxed"
              aria-label="Ketik keluhan kesehatan Anda"
              style={{ height: "48px" }}
            />
          </div>

          {/* Send button (visible when there's text) */}
          {textInput.trim() || attachments.length > 0 ? (
            <button
              type="submit"
              disabled={state.isLoading}
              className="touch-target w-12 h-12 rounded-full bg-[hsl(var(--color-primary))] text-white
                         flex items-center justify-center
                         hover:brightness-110 active:scale-95
                         transition-all duration-200 cursor-pointer
                         disabled:opacity-50 shadow-md"
              aria-label="Kirim pesan"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            /* Voice recorder (visible when no text) */
            <VoiceRecorder
              onTranscript={handleVoiceTranscript}
              disabled={state.isLoading}
            />
          )}
        </form>
      </div>
    </div>
  );
}
