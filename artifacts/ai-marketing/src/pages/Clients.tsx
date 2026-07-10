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
  Users, Search, Sparkles, ChevronRight, Building2,
  Target, DollarSign, Loader2, Copy, CheckCheck, UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface Lead { id: number; companyName: string; industry: string; contactType: string; platform: string; notes?: string; status: string; }

const STATUS_COLORS: Record<string, string> = {
  prospect: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  contacted: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  qualified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed: "bg-primary/10 text-primary border-primary/20",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-white/5">
      {copied ? <CheckCheck className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function Clients() {
  const [form, setForm] = useState({ companyName: "", industry: "", product: "", targetAudience: "", budget: "" });
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const { toast } = useToast();

  const handleDiscover = async () => {
    if (!form.industry && !form.product) {
      toast({ title: "Add details", description: "Enter at least your industry or product.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setResult("");
    try {
      const res = await fetch(`${BASE_URL}/api/coach/client-discovery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { discovery: string };
      setResult(data.discovery ?? "");
    } catch {
      toast({ title: "Error", description: "Failed to generate discovery.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const saveLead = async (lead: Omit<Lead, "id" | "status">) => {
    try {
      const res = await fetch(`${BASE_URL}/api/coach/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, status: "prospect" }),
      });
      const data = await res.json() as Lead;
      setLeads(prev => [...prev, data]);
      toast({ title: "Lead saved!", description: `${lead.companyName} added to your pipeline.` });
    } catch {
      toast({ title: "Error", description: "Failed to save lead.", variant: "destructive" });
    }
  };

  const updateLeadStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/coach/leads/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const updated = await res.json() as Lead;
      setLeads(prev => prev.map(l => l.id === id ? updated : l));
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Users className="size-7 text-primary" /> Client Discovery
        </h1>
        <p className="text-muted-foreground mt-1">Your Marketing Expert analyzes your business and finds ideal clients.</p>
      </div>

      {/* Input form */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/8 shadow-xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="size-4 text-primary" /> Tell me about your business
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Company Name</Label>
              <Input placeholder="e.g. StratGen AI" value={form.companyName}
                onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
                className="bg-black/30 border-white/10 focus:border-primary/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Industry *</Label>
              <Input placeholder="e.g. SaaS, Consulting, E-commerce" value={form.industry}
                onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
                className="bg-black/30 border-white/10 focus:border-primary/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Product / Service *</Label>
              <Input placeholder="What do you sell?" value={form.product}
                onChange={e => setForm(p => ({ ...p, product: e.target.value }))}
                className="bg-black/30 border-white/10 focus:border-primary/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Target Audience</Label>
              <Input placeholder="Who do you serve?" value={form.targetAudience}
                onChange={e => setForm(p => ({ ...p, targetAudience: e.target.value }))}
                className="bg-black/30 border-white/10 focus:border-primary/40" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Marketing Budget</Label>
              <Input placeholder="e.g. $500/month, $5,000 total" value={form.budget}
                onChange={e => setForm(p => ({ ...p, budget: e.target.value }))}
                className="bg-black/30 border-white/10 focus:border-primary/40" />
            </div>
          </div>
          <Button onClick={() => void handleDiscover()} disabled={isLoading} className="gap-2 w-full sm:w-auto shadow-[0_0_20px_rgba(0,255,255,0.2)]">
            {isLoading ? <><Loader2 className="size-4 animate-spin" /> Analyzing…</> : <><Sparkles className="size-4" /> Find My Ideal Clients</>}
          </Button>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-card/50 backdrop-blur-sm border-primary/15 shadow-xl overflow-hidden">
              <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="size-4 text-primary" /> Client Discovery Report
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Alex's Analysis</Badge>
                  </CardTitle>
                  <CopyButton text={result} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert prose-sm max-w-none
                  prose-headings:text-foreground/90 prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
                  prose-p:text-muted-foreground prose-p:leading-relaxed
                  prose-li:text-muted-foreground prose-li:leading-relaxed
                  prose-strong:text-foreground/90
                  prose-h2:text-primary prose-h2:text-base
                  prose-code:text-primary/90 prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {/* Quick save lead */}
            {form.companyName && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4">
                <Button variant="outline" size="sm" className="gap-2"
                  onClick={() => void saveLead({ companyName: form.companyName, industry: form.industry, contactType: "potential", platform: "direct", notes: form.product })}>
                  <UserPlus className="size-4" /> Save as Lead
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lead pipeline */}
      {leads.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Building2 className="size-4" /> Lead Pipeline ({leads.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {leads.map(lead => (
              <Card key={lead.id} className="bg-card/40 border-white/8 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{lead.companyName}</p>
                    <p className="text-xs text-muted-foreground">{lead.industry}</p>
                    {lead.notes && <p className="text-xs text-muted-foreground/60 mt-1 truncate">{lead.notes}</p>}
                  </div>
                  <select
                    value={lead.status}
                    onChange={e => void updateLeadStatus(lead.id, e.target.value)}
                    className={cn(
                      "text-[10px] font-semibold px-2 py-1 rounded-md border cursor-pointer bg-transparent shrink-0",
                      STATUS_COLORS[lead.status] ?? "text-muted-foreground border-white/10"
                    )}
                  >
                    <option value="prospect">Prospect</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
