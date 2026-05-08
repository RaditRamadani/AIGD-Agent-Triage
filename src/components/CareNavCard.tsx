"use client";

import {
  AlertTriangle,
  Stethoscope,
  Smartphone,
  ChevronRight,
} from "lucide-react";
import type { CareNavigationType } from "@/types";

// ── CareNavCard ──
// Menampilkan hasil Care Navigation (IGD / Puskesmas / Telemedicine)
// dengan warna berbeda dan reasoning transparan.

interface CareNavCardProps {
  careNavigation: CareNavigationType;
  reasoning: string;
}

// Konfigurasi visual per level navigasi
const NAV_CONFIG: Record<
  CareNavigationType,
  {
    cardClass: string;
    icon: React.ReactNode;
    label: string;
    tagColor: string;
    description: string;
  }
> = {
  IGD: {
    cardClass: "care-card-igd",
    icon: <AlertTriangle className="w-5 h-5" />,
    label: "IGD — Kondisi Darurat",
    tagColor: "bg-red-500 text-white",
    description: "Segera menuju IGD terdekat",
  },
  "Puskesmas/Klinik": {
    cardClass: "care-card-klinik",
    icon: <Stethoscope className="w-5 h-5" />,
    label: "Puskesmas / Klinik",
    tagColor: "bg-yellow-500 text-white",
    description: "Perlu pemeriksaan dokter",
  },
  "Telemedicine/Self-care": {
    cardClass: "care-card-selfcare",
    icon: <Smartphone className="w-5 h-5" />,
    label: "Telemedicine / Self-care",
    tagColor: "bg-green-500 text-white",
    description: "Perawatan mandiri atau konsultasi online",
  },
};

export function CareNavCard({ careNavigation, reasoning }: CareNavCardProps) {
  const config = NAV_CONFIG[careNavigation];

  if (!config) return null;

  return (
    <div
      className={`${config.cardClass} rounded-xl p-4 space-y-3 shadow-sm`}
      role="region"
      aria-label={`Hasil triase: ${config.label}`}
    >
      {/* Header: icon + label + tag */}
      <div className="flex items-center gap-3">
        <div className="shrink-0">{config.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base">{config.label}</h3>
            <span
              className={`${config.tagColor} text-xs font-medium px-2 py-0.5 rounded-full`}
            >
              {careNavigation === "IGD"
                ? "Darurat"
                : careNavigation === "Puskesmas/Klinik"
                ? "Prioritas"
                : "Ringan"}
            </span>
          </div>
          <p className="text-sm opacity-80">{config.description}</p>
        </div>
      </div>

      {/* Reasoning transparan (bahasa awam) */}
      <div className="bg-white/60 rounded-lg p-3">
        <p className="text-sm leading-relaxed flex items-start gap-2">
          <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 opacity-60" />
          <span>{reasoning}</span>
        </p>
      </div>
    </div>
  );
}
