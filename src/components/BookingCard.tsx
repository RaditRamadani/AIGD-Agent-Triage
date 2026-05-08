"use client";

import { CheckCircle2, MapPin, Clock, Phone } from "lucide-react";

// ── BookingCard ──
// Menampilkan hasil booking yang berhasil dibuat di Firestore.
// Muncul setelah createMockBooking berhasil dieksekusi.

interface BookingCardProps {
  bookingId: string;
  facilityName: string;
  message?: string;
}

export function BookingCard({
  bookingId,
  facilityName,
  message,
}: BookingCardProps) {
  return (
    <div
      className="bg-[hsl(var(--nav-selfcare-bg))] border border-green-200 rounded-xl p-4 space-y-3 shadow-sm"
      role="region"
      aria-label="Konfirmasi reservasi"
    >
      {/* Header: sukses */}
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <h3 className="font-semibold text-base text-green-800">
          Reservasi Berhasil
        </h3>
      </div>

      {/* Detail booking */}
      <div className="bg-white/70 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-[hsl(var(--color-text-muted))] shrink-0" />
          <span className="font-medium">{facilityName}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-[hsl(var(--color-text-muted))]">
          <Clock className="w-4 h-4 shrink-0" />
          <span>ID Booking: {bookingId}</span>
        </div>

        {message && (
          <p className="text-sm text-green-700 mt-1">{message}</p>
        )}
      </div>

      {/* CTA: Hubungi faskes */}
      <button
        className="touch-target w-full py-3 rounded-lg bg-green-600 text-white font-medium
                   hover:bg-green-700 active:scale-[0.98]
                   transition-all duration-200 cursor-pointer
                   flex items-center justify-center gap-2"
        aria-label={`Hubungi ${facilityName}`}
        onClick={() => {
          // Placeholder — di production ini bisa trigger call/WhatsApp
          alert(`Menghubungi ${facilityName}...`);
        }}
      >
        <Phone className="w-4 h-4" />
        Hubungi Faskes
      </button>
    </div>
  );
}
