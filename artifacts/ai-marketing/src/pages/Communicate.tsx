import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Mail, Megaphone, Send, Loader2,
  Copy, CheckCheck, Sparkles, Pencil, PhoneCall, AtSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const MESSAGE_TYPES = [
  { id: "email", label: "Cold Email", icon: Mail, color: "text-sky-400", bg: "from-sky-500/10" },
  { id: "pitch", label: "Sales Pitch", icon: Megaphone, color: "text-amber-400", bg: "from-amber-500/10" },
  { id: "dm", label: "Social DM", icon: AtSign, color: "text-pink-400", bg: "from-pink-500/10" },
  { id: "follow-up", label: "Follow-Up", icon: PhoneCall, color: "text-emerald-400", bg: "from-emerald-500/10" },
  { id: "proposal", label: "Proposal", icon: Pencil, color: "text-violet-400", bg: "from-violet-500/10" },
  { id: "announcement", label: "Announcement", icon: MessageSquare, color: "text-primary", bg: "from-primary/10" },
];

const TONES = ["Professional but friendly", "Direct and confident", "Warm and personal", "Formal and polished", "Casual and energetic"];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-white/5 transition-colors">
      {copied ? <CheckCheck className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy all"}
    </button>
  );
}

export function Communicate() {
  const [type, setType] = useState("email");
  const [form, setForm] = useState({ companyName: "", product: "", audience: "", tone: TONES[0], context: "" });
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!form.product && !form.context) {
      toast({ title: "Add context", description: "Tell me about your product or the situation.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setResult("");
    try {
      const res = await fetch(`${BASE_URL}/api/coach/communicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...form }),
      });
      const data = await res.json() as { content: string };
      setResult(data.content ?? "");
    } catch {
      toast({ title: "Error", description: "Failed to generate communication.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedType = MESSAGE_TYPES.find(t => t.id === type)!;

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <MessageSquare className="size-7 text-primary" /> Communication Assistant
        </h1>
        <p className="text-muted-foreground mt-1">Your Marketing Expert writes professional messages ready to send.</p>
      </div>

      {/* Type selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {MESSAGE_TYPES.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center",
                type === t.id
                  ? `bg-gradient-to-b ${t.bg} to-transparent border-white/15 shadow-md`
                  : "bg-black/20 border-white/6 hover:border-white/15 hover:bg-white/[0.03]"
              )}
            >
              <Icon className={cn("size-5", type === t.id ? t.color : "text-muted-foreground")} />
              <span className={cn("text-xs font-medium", type === t.id ? "text-foreground" : "text-muted-foreground")}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/8 shadow-xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <selectedType.icon className={cn("size-4", selectedType.color)} />
            {selectedType.label} Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Your Company Name</Label>
              <Input placeholder="e.g. StratGen AI" value={form.companyName}
                onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
                className="bg-black/30 border-white/10 focus:border-primary/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Product / Service *</Label>
              <Input placeholder="What are you offering?" value={form.product}
                onChange={e => setForm(p => ({ ...p, product: e.target.value }))}
                className="bg-black/30 border-white/10 focus:border-primary/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Target Recipient</Label>
              <Input placeholder="e.g. Small business owners" value={form.audience}
                onChange={e => setForm(p => ({ ...p, audience: e.target.value }))}
                className="bg-black/30 border-white/10 focus:border-primary/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tone</Label>
              <select value={form.tone} onChange={e => setForm(p => ({ ...p, tone: e.target.value }))}
                className="w-full h-10 px-3 rounded-md bg-black/30 border border-white/10 text-sm text-foreground focus:border-primary/40 outline-none">
                {TONES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Additional Context</Label>
              <Textarea placeholder="Any specific situation, goals, or context Alex should know about…"
                value={form.context} rows={3}
                onChange={e => setForm(p => ({ ...p, context: e.target.value }))}
                className="bg-black/30 border-white/10 focus:border-primary/40 resize-none" />
            </div>
          </div>
          <Button onClick={() => void handleGenerate()} disabled={isLoading}
            className="gap-2 w-full sm:w-auto shadow-[0_0_20px_rgba(0,255,255,0.2)]">
            {isLoading
              ? <><Loader2 className="size-4 animate-spin" /> Writing…</>
              : <><Sparkles className="size-4" /> Generate {selectedType.label}</>}
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      )}

      <AnimatePresence>
        {result && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-card/50 backdrop-blur-sm border-primary/15 shadow-xl overflow-hidden">
              <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <selectedType.icon className={cn("size-4", selectedType.color)} />
                    {selectedType.label}
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Written by Alex</Badge>
                  </CardTitle>
                  <CopyButton text={result} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert prose-sm max-w-none
                  prose-headings:text-foreground/90 prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
                  prose-p:text-muted-foreground prose-p:leading-relaxed
                  prose-li:text-muted-foreground
                  prose-strong:text-foreground/90
                  prose-h2:text-primary prose-h2:text-base
                  prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground
                  prose-code:text-primary/90 prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
