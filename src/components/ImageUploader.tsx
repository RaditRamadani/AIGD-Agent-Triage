"use client";

import { useRef } from "react";
import { Camera, X } from "lucide-react";

// ── ImageUploader ──
// Tombol upload gambar + preview thumbnail.
// Gambar diconvert ke base64 untuk dikirim ke Gemini Vision.

interface ImageUploaderProps {
  onImageSelected: (imageBase64: string, mimeType: string) => void;
  preview: string | null;       // Data URL untuk preview
  onClearPreview: () => void;   // Hapus preview
  disabled?: boolean;
}

export function ImageUploader({
  onImageSelected,
  preview,
  onClearPreview,
  disabled,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Handle file selection ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi: hanya gambar
    if (!file.type.startsWith("image/")) {
      alert("Hanya file gambar yang diperbolehkan.");
      return;
    }

    // Validasi: max 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1]; // Hapus prefix "data:..."
      onImageSelected(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative">
      {/* Preview thumbnail */}
      {preview && (
        <div className="absolute -top-16 left-0 w-14 h-14 rounded-lg overflow-hidden border-2 border-[hsl(var(--color-primary))] shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview gambar yang akan dikirim"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onClearPreview}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white
                       flex items-center justify-center cursor-pointer
                       hover:bg-red-600 transition-colors duration-150"
            aria-label="Hapus gambar"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Upload button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className={`touch-target w-12 h-12 rounded-full flex items-center justify-center
                    bg-[hsl(var(--color-primary-light))] text-[hsl(var(--color-primary))]
                    hover:bg-[hsl(var(--color-primary))] hover:text-white
                    transition-all duration-200 cursor-pointer
                    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                    ${preview ? "ring-2 ring-[hsl(var(--color-primary))]" : ""}`}
        aria-label="Upload foto gejala"
      >
        <Camera className="w-5 h-5" />
      </button>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
