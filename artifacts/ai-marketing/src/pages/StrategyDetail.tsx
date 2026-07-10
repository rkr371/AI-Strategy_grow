import { useState, useRef } from "react";
import { useGetStrategy, useDeleteStrategy, getListStrategiesQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Trash2, Calendar, Target, Briefcase,
  DollarSign, Sparkles, Users, Share2,
  Lightbulb, Megaphone, TrendingUp, BarChart2,
  Search, PieChart, CheckCircle2, Download, Loader2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { VoiceAssistant } from "@/components/VoiceAssistant";

const SECTION_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  "Executive Summary":         { icon: <Sparkles className="size-5" />,     color: "text-violet-400",  bg: "from-violet-500/10" },
  "Target Audience Analysis":  { icon: <Users className="size-5" />,         color: "text-sky-400",     bg: "from-sky-500/10" },
  "Social Media Strategy":     { icon: <Share2 className="size-5" />,        color: "text-pink-400",    bg: "from-pink-500/10" },
  "Content Ideas":             { icon: <Lightbulb className="size-5" />,     color: "text-amber-400",   bg: "from-amber-500/10" },
  "Ad Campaign Ideas":         { icon: <Megaphone className="size-5" />,     color: "text-orange-400",  bg: "from-orange-500/10" },
  "30-Day Growth Plan":        { icon: <TrendingUp className="size-5" />,    color: "text-emerald-400", bg: "from-emerald-500/10" },
  "Competitor Analysis":       { icon: <BarChart2 className="size-5" />,     color: "text-red-400",     bg: "from-red-500/10" },
  "SEO Suggestions":           { icon: <Search className="size-5" />,        color: "text-cyan-400",    bg: "from-cyan-500/10" },
  "Estimated Marketing Budget":{ icon: <PieChart className="size-5" />,      color: "text-lime-400",    bg: "from-lime-500/10" },
  "KPI Goals":                 { icon: <CheckCircle2 className="size-5" />,  color: "text-teal-400",    bg: "from-teal-500/10" },
};

function parseSections(content: string): { heading: string; body: string }[] {
  const lines = content.split("\n");
  const sections: { heading: string; body: string }[] = [];
  let current: { heading: string; body: string } | null = null;

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      if (current) sections.push(current);
      current = { heading: h2[1].trim(), body: "" };
    } else if (current) {
      current.body += line + "\n";
    }
  }
  if (current) sections.push(current);
  return sections;
}

function stripMarkdownPlain(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`+([^`]*)`+/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "  - ")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\|.*?\|/g, "")
    .replace(/^[-=]{3,}$/gm, "")
    .trim();
}

function SectionCard({ heading, body, index }: { heading: string; body: string; index: number }) {
  const meta = SECTION_META[heading];
  const color = meta?.color ?? "text-primary";
  const bg = meta?.bg ?? "from-primary/10";
  const icon = meta?.icon ?? <Sparkles className="size-5" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
    >
      <Card className="overflow-hidden border-white/5 bg-black/30 backdrop-blur-sm shadow-lg">
        <div className={`flex items-center gap-3 px-6 py-4 bg-gradient-to-r ${bg} to-transparent border-b border-white/5`}>
          <span className={color}>{icon}</span>
          <h2 className={`text-base font-semibold ${color}`}>{heading}</h2>
          <span className="ml-auto text-xs text-muted-foreground font-mono opacity-60">
            {String(index + 1).padStart(2, "0")} / {Object.keys(SECTION_META).length}
          </span>
        </div>
        <div className="px-6 py-5 prose prose-invert prose-sm max-w-none
          prose-headings:text-foreground/90 prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
          prose-p:text-muted-foreground prose-p:leading-relaxed
          prose-li:text-muted-foreground prose-li:leading-relaxed
          prose-strong:text-foreground/90
          prose-table:text-sm prose-td:py-2 prose-th:py-2
          prose-th:text-foreground/80 prose-td:text-muted-foreground
          prose-th:border-white/10 prose-td:border-white/5
          prose-a:text-primary hover:prose-a:text-primary/80
          prose-code:text-primary/90 prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded
          prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground
        ">
          <ReactMarkdown>{body.trim()}</ReactMarkdown>
        </div>
      </Card>
    </motion.div>
  );
}

export function StrategyDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: strategy, isLoading, error } = useGetStrategy(id, {
    query: { enabled: !isNaN(id) },
  });

  const deleteMutation = useDeleteStrategy();

  const handleDelete = () => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStrategiesQueryKey() });
        toast({ title: "Strategy deleted", description: "The strategy has been permanently removed." });
        setLocation("/strategies");
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to delete strategy. Please try again.", variant: "destructive" });
      },
    });
  };

  const handleExportPDF = async () => {
    if (!strategy) return;
    setIsExportingPDF(true);

    try {
      const { jsPDF } = await import("jspdf");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 18;
      const maxW = pageW - margin * 2;
      let y = margin;

      const addPageIfNeeded = (height: number) => {
        if (y + height > pageH - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // Header bar
      doc.setFillColor(0, 200, 200);
      doc.rect(0, 0, pageW, 2, "F");

      // Title
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 30);
      doc.text(strategy.companyName, margin, y + 10);
      y += 14;

      // Subtitle
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 120);
      doc.text(
        `${strategy.industry}  ·  ${format(new Date(strategy.createdAt), "MMM d, yyyy")}  ·  AI Marketing Strategy`,
        margin, y
      );
      y += 6;

      // Meta chips row
      const chips = [
        strategy.targetAudience ? `Audience: ${strategy.targetAudience}` : null,
        strategy.budget ? `Budget: ${strategy.budget}` : null,
      ].filter(Boolean) as string[];

      if (chips.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 100);
        const chipText = chips.join("   |   ");
        const wrapped = doc.splitTextToSize(chipText, maxW);
        doc.text(wrapped, margin, y);
        y += wrapped.length * 4 + 2;
      }

      // Divider
      doc.setDrawColor(0, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 8;

      // Sections
      const parsedSections = parseSections(strategy.content);

      for (const section of parsedSections) {
        addPageIfNeeded(20);

        // Section heading
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 20, 30);
        doc.text(section.heading, margin, y);
        y += 6;

        // Thin underline
        doc.setDrawColor(220, 220, 240);
        doc.setLineWidth(0.2);
        doc.line(margin, y, pageW - margin, y);
        y += 5;

        // Body text
        const bodyPlain = stripMarkdownPlain(section.body);
        const paragraphs = bodyPlain.split("\n").filter(p => p.trim().length > 0);

        doc.setFontSize(9.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(55, 55, 70);

        for (const para of paragraphs) {
          const lines = doc.splitTextToSize(para.trim(), maxW);
          addPageIfNeeded(lines.length * 4.5 + 2);
          doc.text(lines, margin, y);
          y += lines.length * 4.5 + 1.5;
        }

        y += 7;
      }

      // Footer on each page
      const totalPages = (doc.internal as { getNumberOfPages(): number }).getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 180);
        doc.text(
          `${strategy.companyName} — Marketing Strategy  |  Page ${p} of ${totalPages}`,
          margin,
          pageH - 8
        );
        doc.text("Generated by StratGen AI", pageW - margin, pageH - 8, { align: "right" });
      }

      doc.save(`${strategy.companyName.replace(/\s+/g, "-").toLowerCase()}-strategy.pdf`);
      toast({ title: "PDF exported", description: "Strategy downloaded successfully." });
    } catch (err) {
      toast({ title: "Export failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (isNaN(id)) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Invalid Strategy ID</h2>
        <Button onClick={() => setLocation("/strategies")}>Back to Strategies</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
      </div>
    );
  }

  if (error || !strategy) {
    return (
      <div className="p-12 text-center bg-card rounded-xl border border-border mt-8 max-w-2xl mx-auto">
        <div className="size-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
          <Trash2 className="size-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Strategy not found</h2>
        <p className="text-muted-foreground mb-6">The strategy you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => setLocation("/strategies")}>View all strategies</Button>
      </div>
    );
  }

  const sections = parseSections(strategy.content);
  const hasSections = sections.length > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16" ref={contentRef}>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"
      >
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation("/strategies")} className="rounded-full shrink-0 mt-1">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{strategy.companyName}</h1>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {strategy.industry}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-4" />
                Generated {format(new Date(strategy.createdAt), "MMM d, yyyy")}
              </span>
              {hasSections && (
                <span className="flex items-center gap-1.5">
                  <Sparkles className="size-4 text-primary" />
                  {sections.length} sections
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            data-testid="button-export-pdf"
          >
            {isExportingPDF ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Download className="size-4 mr-2" />
            )}
            Export PDF
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive/30 hover:text-destructive">
                <Trash2 className="size-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete strategy?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the strategy for {strategy.companyName}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-transparent">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        <Card className="p-4 bg-black/20 border-white/5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <Target className="size-4 text-primary" />
            <h3 className="text-xs font-medium uppercase tracking-wide">Target Audience</h3>
          </div>
          <p className="text-sm font-medium leading-snug">{strategy.targetAudience}</p>
        </Card>
        <Card className="p-4 bg-black/20 border-white/5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <Briefcase className="size-4 text-primary" />
            <h3 className="text-xs font-medium uppercase tracking-wide">Primary Goals</h3>
          </div>
          <p className="text-sm font-medium line-clamp-2 leading-snug">{strategy.goals}</p>
        </Card>
        <Card className="p-4 bg-black/20 border-white/5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <DollarSign className="size-4 text-primary" />
            <h3 className="text-xs font-medium uppercase tracking-wide">Budget</h3>
          </div>
          <p className="text-sm font-medium leading-snug">{strategy.budget || "Not specified"}</p>
        </Card>
      </motion.div>

      {hasSections && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <VoiceAssistant
            companyName={strategy.companyName}
            sections={sections}
            fullContent={strategy.content}
          />
        </motion.div>
      )}

      {hasSections ? (
        <div className="space-y-4">
          {sections.map((section, i) => (
            <SectionCard key={section.heading} heading={section.heading} body={section.body} index={i} />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm shadow-xl">
          <div className="h-2 bg-gradient-to-r from-primary/80 to-purple-600/80 w-full" />
          <div className="p-6 md:p-10 prose prose-invert prose-primary max-w-none">
            <ReactMarkdown>{strategy.content}</ReactMarkdown>
          </div>
        </Card>
      )}
    </div>
  );
}
