"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Send, Sparkles } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { loadChatHistory, saveChatHistory } from "../../lib/storage";
import type { ChatMessage } from "../../lib/types";
import { GlassCard, Spinner } from "../ui/Primitives";
import { cn } from "../../lib/utils";

/** Minimal shape of the (non-standard, Chrome-family-only) Web Speech API —
 *  not part of TypeScript's DOM lib, so it's declared locally rather than
 *  reached for with `any`. */
interface MinimalSpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: { [i: number]: { [i: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => MinimalSpeechRecognition;

export function ChatWindow() {
  const { t, settings } = useSettings();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);

  useEffect(() => setMessages(loadChatHistory()), []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: trimmed, createdAt: Date.now() };
    const withUser = [...messages, userMessage];
    setMessages(withUser);
    saveChatHistory(withUser);
    setInput("");
    setSending(true);
    setNotConfigured(false);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: withUser.map(({ role, content }) => ({ role, content })), language: settings.language }),
      });

      if (res.status === 501) {
        setNotConfigured(true);
        return;
      }
      if (!res.ok || !res.body) throw new Error("chat request failed");

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "", createdAt: Date.now() }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: assistantText } : m)));
      }
      setMessages((prev) => {
        const finalMessages = prev.map((m) => (m.id === assistantId ? { ...m, content: assistantText } : m));
        saveChatHistory(finalMessages);
        return finalMessages;
      });
    } catch {
      setMessages((prev) => {
        const next = [...prev, { id: crypto.randomUUID(), role: "assistant" as const, content: `\u26a0\ufe0f ${t("common.retry")}`, createdAt: Date.now() }];
        saveChatHistory(next);
        return next;
      });
    } finally {
      setSending(false);
    }
  }

  function toggleVoiceInput() {
    const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new Ctor();
    recognition.lang = settings.language === "ar" ? "ar-SA" : settings.language === "bn" ? "bn-BD" : "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  const voiceSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  return (
    <GlassCard className="flex h-[70vh] flex-col overflow-hidden p-0">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-[var(--text-muted)]">
            <Sparkles className="text-[var(--gold)]" />
            <p className="max-w-xs text-sm">{t("aiPage.placeholder")}</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user" ? "ink-btn" : "border border-[var(--surface-glass-border)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
              )}
            >
              {m.content || <Spinner size={14} />}
            </div>
          </div>
        ))}
        {notConfigured && <p className="text-center text-xs text-[var(--text-muted)]">{t("aiPage.notConfigured")}</p>}
      </div>
      <p className="border-t border-[var(--surface-glass-border)] px-5 py-2 text-center text-[11px] text-[var(--text-muted)]">{t("aiPage.disclaimer")}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage(input);
        }}
        className="flex items-center gap-2 border-t border-[var(--surface-glass-border)] p-3"
      >
        {voiceSupported && (
          <button
            type="button"
            onClick={toggleVoiceInput}
            aria-label={t("aiPage.voiceInput")}
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition",
              listening ? "border-[var(--gold)] text-[var(--gold)]" : "border-[var(--surface-glass-border)] text-[var(--text-muted)]"
            )}
          >
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("aiPage.placeholder")}
          className="flex-1 rounded-full border border-[var(--surface-glass-border)] bg-transparent px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--gold)]"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Send"
          className="ink-btn inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
        >
          <Send size={15} />
        </button>
      </form>
    </GlassCard>
  );
}
