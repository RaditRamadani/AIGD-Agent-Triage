import { ChatContainer } from "@/components/ChatContainer";
import type { Metadata } from "next";

// ── SEO metadata untuk halaman chat ──
export const metadata: Metadata = {
  title: "Chat — AIGD Agent",
  description:
    "Konsultasi kesehatan cerdas: ceritakan gejala via suara, foto, atau teks untuk navigasi ke faskes terdekat.",
};

// ── Chat Page ──
// Halaman utama konsultasi — full-screen chat interface.
export default function ChatPage() {
  return (
    <main id="main-content">
      <ChatContainer />
    </main>
  );
}
