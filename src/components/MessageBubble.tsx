"use client";

import type { ChatMessage } from "@/types";
import { User, Bot } from "lucide-react";

// ── MessageBubble ──
// Menampilkan satu bubble pesan (user atau AI) di chat.
// User bubble: teal, rata kanan. AI bubble: putih, rata kiri.

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      aria-label={isUser ? "Pesan Anda" : "Respons AIGD Agent"}
    >
      {/* Avatar */}
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-[hsl(var(--color-primary))] text-white"
            : "bg-[hsl(var(--color-primary-light))] text-[hsl(var(--color-primary))]"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] px-4 py-3 text-base leading-relaxed ${
          isUser ? "bubble-user" : "bubble-ai"
        }`}
      >
        {/* Render teks dengan line breaks */}
        {message.content.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            {i < message.content.split("\n").length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── TypingIndicator ──
// Tampil saat AI sedang memproses response.
export function TypingIndicator() {
  return (
    <div className="flex gap-2 items-end" aria-label="AI sedang mengetik">
      <div className="shrink-0 w-8 h-8 rounded-full bg-[hsl(var(--color-primary-light))] text-[hsl(var(--color-primary))] flex items-center justify-center">
        <Bot className="w-4 h-4" />
      </div>
      <div className="bubble-ai px-4 py-3 flex gap-1">
        <span className="typing-dot w-2 h-2 rounded-full bg-[hsl(var(--color-text-muted))]" />
        <span className="typing-dot w-2 h-2 rounded-full bg-[hsl(var(--color-text-muted))]" />
        <span className="typing-dot w-2 h-2 rounded-full bg-[hsl(var(--color-text-muted))]" />
      </div>
    </div>
  );
}
