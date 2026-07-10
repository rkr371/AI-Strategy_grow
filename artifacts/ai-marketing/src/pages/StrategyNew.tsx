import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGenerateStrategy } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Target, Building2, Briefcase, DollarSign, FileText, BrainCircuit, Cpu, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AI_THINKING_STEPS = [
  "Analyzing company profile...",
  "Researching target audience behavior...",
  "Mapping competitive landscape...",
  "Identifying high-value channels...",
  "Calculating budget allocation...",
  "Drafting 30-day growth plan...",
  "Generating SEO keyword clusters...",
  "Building KPI framework...",
  "Synthesizing strategy...",
];

function AiThinkingOverlay({ companyName }: { companyName: string }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStepIndex(i => (i + 1) % AI_THINKING_STEPS.length);
    }, 2200);
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 0.4, 92));
    }, 120);
    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[100px] animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-[80px] animate-pulse [animation-delay:1s]" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-teal-500/5 blur-[60px] animate-pulse [animation-delay:2s]" />

        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
            style={{ top: `${15 + i * 14}%` }}
            animate={{ opacity: [0, 0.6, 0], x: ["-100%", "100%"] }}
            transition={{ duration: 3.5, delay: i * 0.5, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg px-6">
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-150 animate-pulse" />
          <div className="relative size-24 rounded-full border border-primary/30 bg-black/40 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 rounded-full border-t-2 border-primary/60 border-r border-transparent"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-4 rounded-full border-b-2 border-cyan-400/50 border-l border-transparent"
            />
            <BrainCircuit className="size-9 text-primary relative z-10" />
          </div>

          {[Cpu, Zap, Sparkles].map((Icon, i) => (
            <motion.div
              key={i}
              className="absolute size-8 rounded-full bg-card/80 border border-primary/20 flex items-center justify-center text-primary/70"
              style={{ top: "50%", left: "50%", transformOrigin: "0 0" }}
              animate={{ rotate: [i * 120, i * 120 + 360] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              <motion.div
                style={{ rotate: -(i * 120) }}
                animate={{ rotate: [-(i * 120), -(i * 120 + 360)] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="flex items-center justify-center size-full"
              >
                <Icon className="size-3.5" />
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.h2
          className="text-2xl font-bold mb-2 tracking-tight"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Building strategy for{" "}
          <span className="text-primary">{companyName}</span>
        </motion.h2>

        <div className="h-7 mb-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="text-sm text-primary font-medium font-mono"
            >
              {AI_THINKING_STEPS[stepIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="w-64 mb-3">
          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-300"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Generating 10 strategy sections — usually 15-30 seconds
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-xs">
          {["Executive Summary", "Social Media", "SEO", "Ad Campaigns", "30-Day Plan", "KPIs"].map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 2.5, delay: i * 0.3, repeat: Infinity }}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-primary/20 text-primary/60 bg-primary/5"
            >
              {tag}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function StrategyNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const generateStrategy = useGenerateStrategy();

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [goals, setGoals] = useState("");
  const [budget, setBudget] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !industry || !targetAudience || !goals) {
      toast({
        title: "Missing fields",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }

    generateStrategy.mutate(
      {
        data: {
          companyName,
          industry,
          targetAudience,
          goals,
          budget: budget || undefined,
          additionalContext: additionalContext || undefined,
        },
      },
      {
        onSuccess: (data) => {
          toast({ title: "Strategy Generated", description: "Your AI marketing strategy is ready." });
          setLocation(`/strategies/${data.id}`);
        },
        onError: (err) => {
          toast({
            title: "Error",
            description: err?.message || "Failed to generate strategy. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <>
      <AnimatePresence>
        {generateStrategy.isPending && (
          <AiThinkingOverlay companyName={companyName} />
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/strategies")} className="rounded-full">
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Strategy</h1>
            <p className="text-muted-foreground mt-1">Generate a comprehensive marketing plan with AI</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-card/50 backdrop-blur-sm border-white/10 shadow-xl overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Company Profile</CardTitle>
                <CardDescription>Provide detailed information for a more accurate strategy.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="flex items-center gap-2 text-sm font-medium">
                        <Building2 className="size-4 text-primary" />
                        Company Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="companyName"
                        data-testid="input-company-name"
                        placeholder="e.g. Acme Corp"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        disabled={generateStrategy.isPending}
                        className="bg-black/20 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry" className="flex items-center gap-2 text-sm font-medium">
                        <Briefcase className="size-4 text-primary" />
                        Industry <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="industry"
                        data-testid="input-industry"
                        placeholder="e.g. B2B SaaS, E-commerce"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        disabled={generateStrategy.isPending}
                        className="bg-black/20 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetAudience" className="flex items-center gap-2 text-sm font-medium">
                      <Target className="size-4 text-primary" />
                      Target Audience <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="targetAudience"
                      data-testid="input-target-audience"
                      placeholder="Describe your ideal customers — demographics, pain points, behaviors"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      disabled={generateStrategy.isPending}
                      className="min-h-[100px] bg-black/20 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50 resize-y"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goals" className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="size-4 text-primary" />
                      Primary Goals <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="goals"
                      data-testid="input-goals"
                      placeholder="e.g. Increase signups by 20% in Q3, reduce customer acquisition cost"
                      value={goals}
                      onChange={(e) => setGoals(e.target.value)}
                      disabled={generateStrategy.isPending}
                      className="min-h-[100px] bg-black/20 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50 resize-y"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="budget" className="flex items-center gap-2 text-sm font-medium">
                        <DollarSign className="size-4 text-primary" />
                        Budget <span className="text-muted-foreground font-normal">(Optional)</span>
                      </Label>
                      <Input
                        id="budget"
                        data-testid="input-budget"
                        placeholder="e.g. $10,000/month"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        disabled={generateStrategy.isPending}
                        className="bg-black/20 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalContext" className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="size-4 text-primary" />
                      Additional Context <span className="text-muted-foreground font-normal">(Optional)</span>
                    </Label>
                    <Textarea
                      id="additionalContext"
                      data-testid="input-additional-context"
                      placeholder="Constraints, current marketing channels, competitors to watch..."
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      disabled={generateStrategy.isPending}
                      className="min-h-[100px] bg-black/20 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50 resize-y"
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}>
                      <Button
                        type="submit"
                        size="lg"
                        data-testid="button-generate"
                        disabled={generateStrategy.isPending}
                        className="px-8 font-semibold shadow-[0_0_20px_rgba(0,255,255,0.25)] hover:shadow-[0_0_30px_rgba(0,255,255,0.45)] transition-shadow duration-300"
                      >
                        <Sparkles className="size-4 mr-2" />
                        Generate Strategy
                      </Button>
                    </motion.div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-card/30 border-white/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  Tips for great results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Be specific with audience</p>
                  <p>"B2B marketing managers at Series A startups" works better than "marketers".</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Define clear goals</p>
                  <p>Include timeframes and metrics if possible (e.g., "50 qualified leads/month").</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Mention constraints</p>
                  <p>If you have a small team or zero ad budget, note it in the context field.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/30 border-white/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  What you'll get
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {[
                    "Executive Summary",
                    "Audience Analysis",
                    "Social Media Strategy",
                    "Content Ideas",
                    "Ad Campaign Concepts",
                    "30-Day Growth Plan",
                    "Competitor Analysis",
                    "SEO Suggestions",
                    "Budget Breakdown",
                    "KPI Goals",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="size-1.5 rounded-full bg-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
