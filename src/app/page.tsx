"use client";

import { useRouter } from "next/navigation";
import { Activity, Mic, Camera, MessageSquare, Shield } from "lucide-react";

// ── Landing Page ──
// Halaman awal AIGD Agent dengan CTA besar menuju /chat
export default function LandingPage() {
  const router = useRouter();

  return (
    <main
      id="main-content"
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
    >
      {/* ── Hero Section ── */}
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Logo / Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-[hsl(188,84%,37%)] to-[hsl(142,71%,45%)] flex items-center justify-center shadow-lg">
          <Activity className="w-10 h-10 text-white" strokeWidth={2.5} />
        </div>

        {/* Judul */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            AIGD Agent
          </h1>
          <p className="text-[hsl(var(--color-text-muted))] mt-2 text-lg">
            Navigator Kesehatan Cerdas
          </p>
        </div>

        {/* Deskripsi singkat */}
        <p className="text-base leading-relaxed">
          Ceritakan keluhan Anda melalui <strong>suara</strong>,{" "}
          <strong>foto</strong>, atau <strong>teks</strong> — dan kami akan
          membantu menavigasi Anda ke fasilitas kesehatan yang tepat.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3">
          <FeaturePill icon={<Mic className="w-4 h-4" />} label="Input Suara" />
          <FeaturePill icon={<Camera className="w-4 h-4" />} label="Foto Gejala" />
          <FeaturePill icon={<MessageSquare className="w-4 h-4" />} label="Chat Teks" />
        </div>

        {/* CTA Button */}
        <button
          onClick={() => router.push("/chat")}
          className="touch-target w-full max-w-xs mx-auto px-8 py-4 rounded-xl
                     bg-[hsl(var(--color-primary))] text-white font-semibold text-lg
                     shadow-lg hover:shadow-xl
                     hover:brightness-110 active:scale-[0.98]
                     transition-all duration-200 ease-out cursor-pointer"
          aria-label="Mulai konsultasi kesehatan"
        >
          Mulai Konsultasi
        </button>

        {/* Disclaimer mini */}
        <div className="disclaimer-banner rounded-lg px-4 py-3 flex items-start gap-2 text-left">
          <Shield className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            Sistem ini adalah navigator kesehatan, bukan dokter. Rekomendasi
            yang diberikan bukan diagnosis medis final.
          </p>
        </div>
      </div>
    </main>
  );
}

// ── Sub-component: Feature Pill ──
function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                     bg-[hsl(var(--color-primary-light))] text-[hsl(var(--color-primary))]
                     text-sm font-medium">
      {icon}
      {label}
    </span>
  );
}
