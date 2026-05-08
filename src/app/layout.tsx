import type { Metadata } from "next";
import "./globals.css";

// ── SEO Metadata ──
export const metadata: Metadata = {
  title: "AIGD Agent — Navigator Kesehatan Cerdas",
  description:
    "Sistem agen cerdas berbasis AI untuk triase dan navigasi fasilitas kesehatan terdekat. Input suara, gambar, atau teks untuk mendapatkan rekomendasi faskes.",
  keywords: ["triase", "kesehatan", "navigator", "AI", "puskesmas", "IGD", "klinik"],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased">
        {/* Skip link untuk aksesibilitas keyboard */}
        <a href="#main-content" className="skip-link">
          Langsung ke konten utama
        </a>
        {children}
      </body>
    </html>
  );
}
