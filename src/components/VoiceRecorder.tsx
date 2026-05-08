"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, Square } from "lucide-react";

// ── VoiceRecorder ──
// Tombol mic besar untuk merekam suara pasien via MediaRecorder API.
// Hasil rekaman di-convert ke base64 dan dikirim ke parent via onRecorded.

interface VoiceRecorderProps {
  onRecorded: (audioBase64: string, mimeType: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onRecorded, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // ── Start recording ──
  const startRecording = useCallback(async () => {
    try {
      // Minta izin akses mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pilih mime type yang didukung browser
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Gabung semua chunks jadi satu blob
        const blob = new Blob(chunksRef.current, { type: mimeType });

        // Convert blob ke base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1]; // Hapus prefix "data:..."
          onRecorded(base64, mimeType.split(";")[0]); // Kirim ke parent
        };
        reader.readAsDataURL(blob);

        // Stop semua track mic
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Gagal mengakses mikrofon:", error);
      alert("Tidak dapat mengakses mikrofon. Pastikan izin sudah diberikan.");
    }
  }, [onRecorded]);

  // ── Stop recording ──
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return (
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
  );
}
