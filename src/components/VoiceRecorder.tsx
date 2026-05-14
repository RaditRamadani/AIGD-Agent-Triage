"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square } from "lucide-react";

// ── VoiceRecorder ──
// Tombol mic untuk merekam suara pasien dan mentranskrip ke teks
// menggunakan Web Speech API (SpeechRecognition) bawaan browser.
// Hasil transkripsi langsung masuk ke kolom chat sebagai teks.

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscript, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  // Cek apakah browser mendukung Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  // ── Start recording & transcription ──
  const startRecording = useCallback(() => {
    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert("Browser Anda tidak mendukung fitur pengenalan suara. Gunakan Chrome atau Edge.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Konfigurasi Speech Recognition
      recognition.lang = "id-ID"; // Bahasa Indonesia
      recognition.continuous = true; // Terus mendengar sampai di-stop
      recognition.interimResults = true; // Tampilkan teks sementara

      let finalTranscript = "";

      // Event: hasil transkripsi masuk
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interim += transcript;
          }
        }
        // Update preview teks sementara
        setInterimText(finalTranscript + interim);
      };

      // Event: speech recognition berhenti
      recognition.onend = () => {
        setIsRecording(false);
        const result = finalTranscript.trim();
        setInterimText("");
        if (result) {
          onTranscript(result);
        }
      };

      // Event: error
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        setInterimText("");

        if (event.error === "not-allowed") {
          alert("Izin mikrofon ditolak. Silakan izinkan akses mikrofon di pengaturan browser.");
        } else if (event.error === "no-speech") {
          // Tidak ada suara terdeteksi — diam saja
        }
      };

      recognition.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Gagal memulai speech recognition:", error);
      alert("Gagal mengakses mikrofon.");
    }
  }, [onTranscript]);

  // ── Stop recording ──
  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  }, [isRecording]);

  // Kalau browser tidak support, sembunyikan tombol
  if (!isSupported) return null;

  return (
    <div className="relative flex items-center">
      {/* Preview teks transkripsi saat merekam */}
      {isRecording && interimText && (
        <div className="absolute bottom-full right-0 mb-2 p-3 bg-white rounded-xl shadow-lg
                        border border-[hsl(var(--color-border))] max-w-[280px] text-sm
                        text-[hsl(var(--color-text))] animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-[hsl(var(--color-text-muted))] font-medium">
              Mendengarkan...
            </span>
          </div>
          <p className="italic">{interimText}</p>
        </div>
      )}

      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        className={`touch-target w-14 h-14 rounded-full flex items-center justify-center
                    transition-all duration-200 cursor-pointer
                    ${
                      isRecording
                        ? "bg-red-500 text-white pulse-recording hover:bg-red-600"
                        : "bg-[hsl(var(--color-primary))] text-white hover:brightness-110"
                    }
                    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                    shadow-lg hover:shadow-xl active:scale-95`}
        aria-label={isRecording ? "Berhenti merekam" : "Mulai rekam suara"}
      >
        {isRecording ? (
          <Square className="w-5 h-5" fill="white" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}
