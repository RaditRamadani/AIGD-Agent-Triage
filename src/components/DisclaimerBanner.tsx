"use client";

import { Shield } from "lucide-react";

// ── DisclaimerBanner ──
// Banner sticky di atas chat yang mengingatkan user bahwa ini bukan diagnosis medis.
// Wajib tampil sesuai spec §8.2.
export function DisclaimerBanner() {
  return (
    <div
      className="disclaimer-banner px-4 py-2 flex items-center gap-2 text-center justify-center"
      role="alert"
      aria-label="Disclaimer kesehatan"
    >
      <Shield className="w-4 h-4 shrink-0" />
      <p className="text-xs sm:text-sm">
        <strong>⚕️ Navigator kesehatan</strong> — Bukan diagnosis medis final.
        Keputusan akhir tetap di tangan tenaga medis profesional.
      </p>
    </div>
  );
}
