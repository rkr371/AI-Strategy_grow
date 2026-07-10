import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Volume2, VolumeX, Mic, MicOff, Square, Play,
  ChevronDown, Loader2, Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Section {
  heading: string;
  body: string;
}

interface VoiceAssistantProps {
  companyName: string;
  sections: Section[];
  fullContent: string;
}

type VoiceState = "idle" | "loading" | "speaking" | "listening";
type VoiceEngine = "elevenlabs" | "browser" | null;

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`+([^`]*)`+/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\|.*?\|/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function WaveformBars({ active, color = "bg-primary" }: { active: boolean; color?: string }) {
  const count = 20;
  return (
    <div className="flex items-center gap-[2.5px] h-8">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={cn("w-[3px] rounded-full", active ? color : "bg-white/10")}
          animate={
            active
              ? {
                  height: ["6px", `${14 + ((i * 7 + 11) % 18)}px`, "6px"],
                }
              : { height: "4px" }
          }
          transition={
            active
              ? {
                  duration: 0.7 + (i % 5) * 0.12,
                  repeat: Infinity,
                  delay: i * 0.038,
                  ease: "easeInOut",
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: new () => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: new () => any;
  }
}

export function VoiceAssistant({ companyName, sections, fullContent }: VoiceAssistantProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [selectedSection, setSelectedSection] = useState<number>(-1);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [showSectionMenu, setShowSectionMenu] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [engine, setEngine] = useState<VoiceEngine>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (utteranceRef.current) {
      window.speechSynthesis?.cancel();
      utteranceRef.current = null;
    }
    setVoiceState("idle");
    setEngine(null);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setVoiceState("idle");
  }, []);

  useEffect(() => () => { stopAudio(); stopListening(); }, [stopAudio, stopListening]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowSectionMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getTextToSpeak = (): string => {
    if (selectedSection === -1) {
      const exec = sections.find(s => s.heading === "Executive Summary");
      return stripMarkdown(
        exec
          ? `Executive Summary for ${companyName}. ${exec.body}`
          : `Marketing strategy overview for ${companyName}. ${fullContent}`
      );
    }
    const s = sections[selectedSection];
    return s ? stripMarkdown(`${s.heading}. ${s.body}`) : "";
  };

  const getSelectedLabel = () =>
    selectedSection === -1 ? "Executive Summary" : (sections[selectedSection]?.heading ?? "Select section");

  const speakViaBrowser = (text: string) => {
    if (!window.speechSynthesis) {
      setErrorMsg("Speech synthesis not supported in this browser.");
      setVoiceState("idle");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 5000));
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Prefer a good English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith("en") && !v.localService === false)
      ?? voices.find(v => v.lang.startsWith("en"))
      ?? voices[0];
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => { setVoiceState("idle"); setEngine(null); };
    utterance.onerror = () => { setVoiceState("idle"); setEngine(null); };

    utteranceRef.current = utterance;
    setEngine("browser");
    setVoiceState("speaking");
    window.speechSynthesis.speak(utterance);
  };

  const speak = async () => {
    if (voiceState === "speaking") { stopAudio(); return; }
    if (voiceState !== "idle") return;

    const text = getTextToSpeak();
    if (!text) return;

    setErrorMsg(null);
    setVoiceState("loading");

    try {
      const res = await fetch(`${BASE_URL}/api/voice/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        // ElevenLabs not available — fall back to browser TTS
        speakViaBrowser(text);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); setVoiceState("idle"); setEngine(null); };
      audio.onerror = () => { setVoiceState("idle"); setEngine(null); };

      setEngine("elevenlabs");
      setVoiceState("speaking");
      await audio.play();
    } catch {
      // Network error — fall back to browser TTS
      const text2 = getTextToSpeak();
      speakViaBrowser(text2);
    }
  };

  const toggleListening = () => {
    if (voiceState === "listening") { stopListening(); return; }
    if (voiceState !== "idle") return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setErrorMsg("Speech recognition is not supported in this browser.");
      return;
    }

    setErrorMsg(null);
    setTranscript("");
    setInterimTranscript("");
    setVoiceState("listening");

    const rec = new SpeechRecognitionAPI();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      if (final) setTranscript(prev => prev + final);
      setInterimTranscript(interim);
    };

    rec.onend = () => { setInterimTranscript(""); setVoiceState("idle"); recognitionRef.current = null; };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setErrorMsg(`Mic error: ${e.error}`);
      }
      setVoiceState("idle");
      recognitionRef.current = null;
    };

    rec.start();
  };

  const isSpeaking = voiceState === "speaking";
  const isLoading = voiceState === "loading";
  const isListening = voiceState === "listening";

  return (
    <Card className="border-primary/20 bg-black/40 backdrop-blur-xl shadow-[0_0_40px_rgba(0,255,255,0.05)] overflow-hidden">
      <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="size-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Radio className="size-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Voice Assistant</h3>
          {engine === "elevenlabs" && (
            <span className="text-xs text-muted-foreground ml-1">— ElevenLabs AI</span>
          )}
          {engine === "browser" && (
            <span className="text-xs text-muted-foreground ml-1">— Browser TTS</span>
          )}
          {!engine && (
            <span className="text-xs text-muted-foreground ml-1">— AI-powered narration</span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 min-w-0" ref={menuRef}>
            <button
              onClick={() => setShowSectionMenu(v => !v)}
              className="flex items-center justify-between gap-2 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-sm transition-colors text-left"
            >
              <span className="truncate font-medium">{getSelectedLabel()}</span>
              <ChevronDown className={cn("size-4 text-muted-foreground shrink-0 transition-transform", showSectionMenu && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showSectionMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-1 z-30 rounded-lg border border-white/10 bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden"
                >
                  <div className="max-h-52 overflow-y-auto py-1">
                    <button
                      onClick={() => { setSelectedSection(-1); setShowSectionMenu(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors",
                        selectedSection === -1 && "text-primary bg-primary/5"
                      )}
                    >
                      Executive Summary
                    </button>
                    {sections.map((s, i) => (
                      <button
                        key={s.heading}
                        onClick={() => { setSelectedSection(i); setShowSectionMenu(false); }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors",
                          selectedSection === i && "text-primary bg-primary/5"
                        )}
                      >
                        {s.heading}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <motion.div whileTap={{ scale: 0.94 }}>
              <Button
                onClick={speak}
                disabled={isListening}
                size="sm"
                className={cn(
                  "gap-2 min-w-[116px] font-medium transition-all",
                  isSpeaking
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
                    : "shadow-[0_0_16px_rgba(0,255,255,0.2)] hover:shadow-[0_0_24px_rgba(0,255,255,0.35)]"
                )}
              >
                {isLoading ? (
                  <><Loader2 className="size-4 animate-spin" /> Loading…</>
                ) : isSpeaking ? (
                  <><Square className="size-3.5 fill-current" /> Stop</>
                ) : (
                  <><Play className="size-3.5 fill-current" /> Listen</>
                )}
              </Button>
            </motion.div>

            <motion.div whileTap={{ scale: 0.94 }}>
              <Button
                onClick={toggleListening}
                disabled={isSpeaking || isLoading}
                size="sm"
                variant="outline"
                title="Click to dictate / transcribe your voice"
                className={cn(
                  "gap-2 border transition-all",
                  isListening
                    ? "border-rose-400/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                    : "border-white/10 hover:border-white/20 hover:bg-white/5"
                )}
              >
                {isListening ? <><MicOff className="size-4" /> Stop</> : <><Mic className="size-4" /> Speak</>}
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1">
            <WaveformBars active={isSpeaking} color="bg-primary" />
          </div>
          <div className="flex items-center gap-1.5 text-xs shrink-0">
            {isSpeaking && (
              <motion.div
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="flex items-center gap-1.5 text-primary"
              >
                <div className="size-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(0,255,255,0.9)]" />
                <span className="font-medium">Speaking</span>
              </motion.div>
            )}
            {isListening && (
              <motion.div
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{ duration: 0.85, repeat: Infinity }}
                className="flex items-center gap-1.5 text-rose-300"
              >
                <div className="size-1.5 rounded-full bg-rose-400 shadow-[0_0_5px_rgba(239,68,68,0.9)]" />
                <span className="font-medium">Listening…</span>
              </motion.div>
            )}
            {isLoading && <span className="text-muted-foreground">Generating…</span>}
            {voiceState === "idle" && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Volume2 className="size-3.5" /> Ready
              </span>
            )}
          </div>
        </div>

        {/* Transcription */}
        <AnimatePresence>
          {(transcript || interimTranscript) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm">
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide flex items-center gap-1.5">
                  <Mic className="size-3" /> Transcription
                </p>
                <p className="text-foreground/90 leading-relaxed">
                  {transcript}
                  {interimTranscript && (
                    <span className="text-muted-foreground italic"> {interimTranscript}</span>
                  )}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {errorMsg && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 text-xs text-destructive/80 flex items-center gap-1.5"
            >
              <VolumeX className="size-3.5" /> {errorMsg}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
