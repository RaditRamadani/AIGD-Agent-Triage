"use client";

import { useState } from "react";
import { User, Phone, Clock, Send } from "lucide-react";

interface BookingFormCardProps {
  facilityId: string;
  facilityName: string;
  onSubmit: (data: { name: string; phone: string; time: string }) => void;
  disabled?: boolean;
}

export function BookingFormCard({
  facilityName,
  onSubmit,
  disabled = false,
}: BookingFormCardProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [time, setTime] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && phone.trim() && time.trim()) {
      onSubmit({ name: name.trim(), phone: phone.trim(), time: time.trim() });
    }
  };

  return (
    <div
      className="bg-white border border-[hsl(var(--color-border))] rounded-xl p-4 shadow-sm space-y-4"
      role="region"
      aria-label="Formulir Reservasi"
    >
      <div>
        <h3 className="font-semibold text-base text-[hsl(var(--color-text))]">
          Reservasi di {facilityName}
        </h3>
        <p className="text-sm text-[hsl(var(--color-text-muted))]">
          Mohon lengkapi data pasien untuk melanjutkan proses pemesanan jadwal.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-[hsl(var(--color-text))] flex items-center gap-1.5">
            <User className="w-4 h-4 text-[hsl(var(--color-text-muted))]" />
            Nama Pasien
          </label>
          <input
            type="text"
            required
            disabled={disabled}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Budi Santoso"
            className="w-full px-3 py-2 text-sm border border-[hsl(var(--color-border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--color-primary))] outline-none disabled:opacity-50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-[hsl(var(--color-text))] flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-[hsl(var(--color-text-muted))]" />
            Nomor HP/WA
          </label>
          <input
            type="tel"
            required
            disabled={disabled}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Contoh: 081234567890"
            className="w-full px-3 py-2 text-sm border border-[hsl(var(--color-border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--color-primary))] outline-none disabled:opacity-50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-[hsl(var(--color-text))] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[hsl(var(--color-text-muted))]" />
            Pilihan Jam
          </label>
          <input
            type="time"
            required
            disabled={disabled}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[hsl(var(--color-border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--color-primary))] outline-none disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={disabled || !name || !phone || !time}
          className="w-full mt-2 py-2.5 rounded-lg bg-[hsl(var(--color-primary))] text-white font-medium
                     hover:brightness-110 active:scale-[0.98]
                     transition-all duration-200 cursor-pointer disabled:opacity-50
                     flex items-center justify-center gap-2 touch-target"
        >
          <Send className="w-4 h-4" />
          Kirim Data Reservasi
        </button>
      </form>
    </div>
  );
}
