import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb, Zap, Loader2, Sparkles, Copy, CheckCheck,
  Globe, TrendingUp, Rocket,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const INDUSTRIES = [
  "SaaS / Software", "E-commerce", "Health & Wellness", "Education",
  "Fintech", "AI / Machine Learning", "Creator Economy", "B2B Services",
  "Sustainability", "Real Estate", "Food & Beverage", "Travel",
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-white/5 transition-colors">
      {copied ? <CheckCheck className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function StartupIdeas() {
  const [form, setForm] = useState({ industry: "", interests: "", skills: "", budget: "" });
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsLoading(true);
    setResult("");
    try {
      const res = await fetch(`${BASE_URL}/api/coach/startup-ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { ideas: string };
      setResult(data.ideas ?? "");
    } catch {
      toast({ title: "Error", description: "Failed to generate ideas.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Lightbulb className="size-7 text-primary" /> Startup Idea Generator
        </h1>
        <p className="text-muted-foreground mt-1">Your Marketing Expert analyzes global trends and generates validated startup ideas.</p>
      </div>

      {/* Inspiration banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Globe, label: "Global Trend Analysis", desc: "Pulls from emerging market signals", color: "text-sky-400" },
          { icon: TrendingUp, label: "Market Validation Score", desc: "Each idea rated for viability", color: "text-emerald-400" },
          { icon: Rocket, label: "Launch Roadmap Included", desc: "30-day action plan for each idea", color: "text-violet-400" },
        ].map(({ icon: Icon, label, desc, color }) => (
          <Card key={label} className="bg-black/20 border-white/6 p-4">
            <div className="flex items-center gap-3">
              <Icon className={`size-5 ${color} shrink-0`} />
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Industry quick-select */}
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Quick-select industry</p>
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map(ind => (
            <button key={ind} onClick={() => setForm(p => ({ ...p, industry: ind }))}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${form.industry === ind
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-white/[0.03] text-muted-foreground border-white/8 hover:border-white/20 hover:text-foreground"}`}>
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/8 shadow-xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="size-4 text-primary" /> Personalize Your Ideas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Industry Focus</Label>
              <Input placeholder="e.g. SaaS, Health, Education" value={form.industry}
                onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
                className="bg-black/30 border-white/10 focus:border-primary/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Personal Interests</Label>
              <Input placeholder="e.g. fitness, travel, cooking" value={form.interests}
                onChange={e => setForm(p => ({ ...p, interests: e.target.value }))}
                className="bg-black/30 border-white/10 focus:border-primary/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Your Skills</Label>
              <Input placeholder="e.g. coding, marketing, design" value={form.skills}
                onChange={e => setForm(p => ({ ...p, skills: e.target.value }))}
                className="bg-black/30 border-white/10 focus:border-primary/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Available Capital</Label>
              <Input placeholder="e.g. $0, $5K, $50K" value={form.budget}
                onChange={e => setForm(p => ({ ...p, budget: e.target.value }))}
                className="bg-black/30 border-white/10 focus:border-primary/40" />
            </div>
          </div>
          <Button onClick={() => void handleGenerate()} disabled={isLoading}
            className="gap-2 w-full sm:w-auto shadow-[0_0_20px_rgba(0,255,255,0.2)]">
            {isLoading
              ? <><Loader2 className="size-4 animate-spin" /> Analyzing trends…</>
              : <><Sparkles className="size-4" /> Generate 3 Startup Ideas</>}
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground animate-pulse flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> Analyzing global market trends and generating ideas…
          </p>
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
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
                    <Lightbulb className="size-4 text-primary" /> Your Startup Ideas
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Alex's Research</Badge>
                  </CardTitle>
                  <CopyButton text={result} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert prose-sm max-w-none
                  prose-headings:text-foreground/90 prose-headings:font-semibold prose-headings:mt-5 prose-headings:mb-2
                  prose-p:text-muted-foreground prose-p:leading-relaxed
                  prose-li:text-muted-foreground prose-li:leading-relaxed
                  prose-strong:text-foreground/90
                  prose-h2:text-lg prose-h2:text-primary
                  prose-h3:text-base
                  prose-hr:border-white/10
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
