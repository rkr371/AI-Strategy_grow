import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send, Mic, MicOff, Volume2, VolumeX, Plus, Trash2,
  MessageSquare, Sparkles, ChevronLeft, ChevronRight,
  Loader2, Bot, User, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface Conversation { id: number; title: string; createdAt: string; }
interface Message { id?: number; role: string; content: string; streaming?: boolean; }

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: new () => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: new () => any;
  }
}

function stripMarkdown(text: string) {
  return text
    .replace(/#{1,6}\s+/g, "").replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1").replace(/`+([^`]*)`+/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1").replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n").trim();
}

function speakText(text: string) {
  window.speechSynthesis?.cancel();
  const utterance = new SpeechSynthesisUtterance(text.slice(0, 3000));
  utterance.rate = 0.95; utterance.pitch = 1;
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const voice = voices.find(v => v.lang.startsWith("en") && !v.name.includes("Google US English") === false)
    ?? voices.find(v => v.lang.startsWith("en")) ?? voices[0];
  if (voice) utterance.voice = voice;
  window.speechSynthesis?.speak(utterance);
}

function MessageBubble({ msg, isStreaming }: { msg: Message; isStreaming?: boolean }) {
  const isAI = msg.role === "assistant";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex gap-3 group", isAI ? "items-start" : "items-start flex-row-reverse")}
    >
      <div className={cn(
        "size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold",
        isAI ? "bg-primary/15 border border-primary/25 text-primary" : "bg-white/8 border border-white/10 text-muted-foreground"
      )}>
        {isAI ? <Bot className="size-4" /> : <User className="size-4" />}
      </div>
      <div className={cn("flex-1 max-w-[80%]", !isAI && "flex justify-end")}>
        {isAI && (
          <p className="text-xs text-muted-foreground mb-1.5 font-medium flex items-center gap-1.5">
            <Sparkles className="size-3 text-primary" /> Alex — Marketing Expert
          </p>
        )}
        <div className={cn(
          "rounded-xl px-4 py-3 text-sm leading-relaxed",
          isAI
            ? "bg-black/30 border border-white/6 text-foreground/90 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:font-semibold prose-headings:text-foreground/90 prose-strong:text-foreground/90 prose-code:text-primary/90 prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded"
            : "bg-primary/10 border border-primary/20 text-foreground"
        )}>
          {isAI ? (
            <>
              <ReactMarkdown>{msg.content || " "}</ReactMarkdown>
              {isStreaming && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block w-1.5 h-4 bg-primary rounded-sm ml-0.5 align-text-bottom"
                />
              )}
            </>
          ) : (
            <p>{msg.content}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function Coach() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/gemini/conversations`);
        const data = await res.json() as Conversation[];
        setConversations(data);
        if (data.length > 0) loadConversation(data[0].id);
      } catch { /* no conversations yet */ }
      finally { setIsLoadingConvs(false); }
    })();
  }, []);

  const loadConversation = async (id: number) => {
    setCurrentId(id);
    setIsLoadingMsgs(true);
    try {
      const res = await fetch(`${BASE_URL}/api/gemini/conversations/${id}`);
      const data = await res.json() as { messages: Message[] };
      setMessages(data.messages ?? []);
    } catch {
      toast({ title: "Error", description: "Failed to load conversation.", variant: "destructive" });
    } finally { setIsLoadingMsgs(false); }
  };

  const createConversation = async () => {
    const title = `Chat ${format(new Date(), "MMM d, h:mm a")}`;
    try {
      const res = await fetch(`${BASE_URL}/api/gemini/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const conv = await res.json() as Conversation;
      setConversations(prev => [conv, ...prev]);
      setCurrentId(conv.id);
      setMessages([]);
    } catch {
      toast({ title: "Error", description: "Failed to create conversation.", variant: "destructive" });
    }
  };

  const deleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`${BASE_URL}/api/gemini/conversations/${id}`, { method: "DELETE" });
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentId === id) {
        setCurrentId(null);
        setMessages([]);
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete conversation.", variant: "destructive" });
    }
  };

  const sendMessage = async (content?: string) => {
    const text = (content ?? input).trim();
    if (!text || isStreaming) return;
    if (!currentId) {
      await createConversation();
      return;
    }

    setInput("");
    setTranscript("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const response = await fetch(`${BASE_URL}/api/gemini/conversations/${currentId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (!response.ok) throw new Error("Failed");

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6)) as { content?: string; done?: boolean; error?: string };
            if (data.content) { full += data.content; setStreamingContent(full); }
            if (data.done) {
              setMessages(prev => [...prev, { role: "assistant", content: full }]);
              setStreamingContent("");
              if (autoSpeak) speakText(stripMarkdown(full));
            }
          } catch { /* parse error, skip */ }
        }
      }
    } catch {
      toast({ title: "Error", description: "Failed to get response.", variant: "destructive" });
    } finally {
      setIsStreaming(false);
    }
  };

  const toggleListening = () => {
    if (isListening) { recognitionRef.current?.stop(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast({ title: "Not supported", description: "Speech recognition unavailable.", variant: "destructive" }); return; }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.continuous = false; rec.interimResults = true; rec.lang = "en-US";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let final = ""; let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      const combined = final || interim;
      setTranscript(combined);
      setInput(combined);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.start();
    setIsListening(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-0rem)] -m-4 md:-m-8 overflow-hidden bg-background">
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-r border-white/5 bg-black/20 flex flex-col overflow-hidden shrink-0"
          >
            <div className="p-3 border-b border-white/5 shrink-0">
              <Button onClick={createConversation} className="w-full gap-2 text-sm h-9" size="sm">
                <Plus className="size-4" /> New Chat
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {isLoadingConvs ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <MessageSquare className="size-8 opacity-20 mx-auto mb-2" />
                  <p>No conversations yet</p>
                </div>
              ) : conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all group flex items-start justify-between gap-2",
                    currentId === conv.id
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border border-transparent"
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-xs">{conv.title}</p>
                    <p className="text-[10px] opacity-50 mt-0.5">{format(new Date(conv.createdAt), "MMM d, h:mm a")}</p>
                  </div>
                  <button
                    onClick={(e) => void deleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0 mt-0.5"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-12 border-b border-white/5 px-4 flex items-center gap-3 bg-black/10 shrink-0">
          <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => setSidebarOpen(v => !v)}>
            {sidebarOpen ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="size-6 rounded-md bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Bot className="size-3.5 text-primary" />
            </div>
            <span className="font-semibold text-sm truncate">Alex — Your Marketing Expert</span>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] hidden sm:flex">AI Manager</Badge>
          </div>
          <button
            onClick={() => setAutoSpeak(v => !v)}
            className={cn(
              "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all",
              autoSpeak
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-white/10 bg-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {autoSpeak ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
            <span className="hidden sm:inline">Voice</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {!currentId ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md"
              >
                <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
                  <Bot className="size-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Meet Alex</h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Your dedicated Marketing Expert with 20+ years of experience. Ask me anything about growing your business — strategy, clients, content, or campaigns.
                </p>
                <Button onClick={createConversation} className="gap-2 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
                  <Plus className="size-4" /> Start a Conversation
                </Button>
                <div className="mt-6 grid grid-cols-2 gap-2">
                  {[
                    "How do I find my first 10 clients?",
                    "What social platforms should I focus on?",
                    "Write me a sales pitch for my business",
                    "Give me a 30-day growth plan",
                  ].map(prompt => (
                    <button
                      key={prompt}
                      onClick={async () => { await createConversation(); await sendMessage(prompt); }}
                      className="text-left px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/8 text-xs text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : isLoadingMsgs ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={cn("flex gap-3", i % 2 === 0 ? "" : "flex-row-reverse")}>
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <Skeleton className={cn("rounded-xl h-16", i % 2 === 0 ? "w-3/4" : "w-1/2")} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Zap className="size-10 text-primary/40 mb-3" />
              <p className="text-muted-foreground text-sm">Chat started. Ask me anything about your business.</p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-sm">
                {["What are my biggest growth opportunities?", "Review my marketing strategy", "Help me write a cold email", "What should I post this week?"].map(p => (
                  <button key={p} onClick={() => void sendMessage(p)}
                    className="text-left px-3 py-2 rounded-lg bg-white/[0.03] border border-white/8 text-xs text-muted-foreground hover:text-foreground hover:border-white/15 transition-all">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}
              {streamingContent && (
                <MessageBubble msg={{ role: "assistant", content: streamingContent }} isStreaming />
              )}
              {isStreaming && !streamingContent && (
                <div className="flex gap-3 items-start">
                  <div className="size-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
                    <Bot className="size-4 text-primary" />
                  </div>
                  <div className="bg-black/30 border border-white/6 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                          className="size-1.5 rounded-full bg-primary/60" />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/5 p-4 bg-black/10 shrink-0">
          <div className="max-w-3xl mx-auto flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentId ? "Ask Alex anything about your business…" : "Start a conversation to begin…"}
                disabled={isStreaming || !currentId}
                rows={1}
                className="resize-none min-h-[44px] max-h-32 pr-3 bg-black/30 border-white/10 focus:border-primary/40 text-sm placeholder:text-muted-foreground/50 overflow-y-auto"
              />
            </div>
            <button
              onClick={toggleListening}
              disabled={isStreaming}
              className={cn(
                "size-11 rounded-lg border flex items-center justify-center shrink-0 transition-all",
                isListening
                  ? "border-rose-400/40 bg-rose-500/10 text-rose-300 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                  : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground hover:border-white/20"
              )}
            >
              {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </button>
            <Button
              onClick={() => void sendMessage()}
              disabled={isStreaming || !input.trim() || !currentId}
              size="icon"
              className="size-11 shrink-0 shadow-[0_0_16px_rgba(0,255,255,0.2)]"
            >
              {isStreaming ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
          {isListening && (
            <p className="text-center text-xs text-rose-300/80 mt-2 flex items-center justify-center gap-1.5">
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
                className="size-1.5 rounded-full bg-rose-400" />
              Listening… speak now
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
