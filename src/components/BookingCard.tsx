"use client";

import { CheckCircle2, MapPin, Clock, Navigation, MessageCircle } from "lucide-react";

// ── BookingCard ──
// Menampilkan hasil booking yang berhasil dibuat di Firestore.
// Muncul setelah createMockBooking berhasil dieksekusi.

interface BookingCardProps {
  bookingId: string;
  facilityName: string;
  appointmentTime?: string;
  message?: string;
}

export function BookingCard({
  bookingId,
  facilityName,
  appointmentTime,
  message,
}: BookingCardProps) {
  // ── Buka Google Maps dengan nama faskes sebagai query ──
  const handleNavigate = () => {
    const query = encodeURIComponent(facilityName);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ── Bagikan detail booking via WhatsApp ──
  const handleShareWhatsApp = () => {
    const time = appointmentTime ? `\nWaktu: ${appointmentTime}` : "";
    const text = encodeURIComponent(
      `🏥 *Reservasi AIGD Agent*\n\nFaskes: ${facilityName}\nID Booking: ${bookingId}${time}\n\nHarap datang tepat waktu. Tunjukkan ID Booking ini kepada petugas.`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

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

        {appointmentTime && (
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--color-text-muted))]">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Waktu: {appointmentTime}</span>
          </div>
        )}

        {message && (
          <p className="text-sm text-green-700 mt-1">{message}</p>
        )}
      </div>

      {/* CTA buttons */}
      <div className="grid grid-cols-2 gap-2">
        {/* Navigasi ke Google Maps */}
        <button
          onClick={handleNavigate}
          className="touch-target py-3 rounded-lg bg-blue-600 text-white font-medium
                     hover:bg-blue-700 active:scale-[0.98]
                     transition-all duration-200 cursor-pointer
                     flex items-center justify-center gap-2 text-sm"
          aria-label={`Navigasi ke ${facilityName}`}
        >
          <Navigation className="w-4 h-4" />
          Navigasi
        </button>

        {/* Share via WhatsApp */}
        <button
          onClick={handleShareWhatsApp}
          className="touch-target py-3 rounded-lg bg-green-600 text-white font-medium
                     hover:bg-green-700 active:scale-[0.98]
                     transition-all duration-200 cursor-pointer
                     flex items-center justify-center gap-2 text-sm"
          aria-label="Bagikan detail booking via WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
          Share WA
        </button>
      </div>
    </div>
  );
}
