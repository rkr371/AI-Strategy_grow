import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2, Circle, Zap, Trophy, Target, Flame,
  RefreshCw, Sparkles, BarChart2, TrendingUp, Megaphone,
  Search, BookOpen, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface Mission {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  completed: boolean;
  xp: number;
  missionDate: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Content: <BookOpen className="size-3.5" />,
  Outreach: <Users className="size-3.5" />,
  Analytics: <BarChart2 className="size-3.5" />,
  Social: <Megaphone className="size-3.5" />,
  SEO: <Search className="size-3.5" />,
  Growth: <TrendingUp className="size-3.5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  Content: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Outreach: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Analytics: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Social: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  SEO: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Growth: "bg-primary/10 text-primary border-primary/20",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low: "text-muted-foreground bg-white/5 border-white/10",
};

function MissionCard({ mission, onToggle }: { mission: Mission; onToggle: (id: number, completed: boolean) => void }) {
  const [loading, setLoading] = useState(false);
  const catColor = CATEGORY_COLORS[mission.category] ?? "bg-primary/10 text-primary border-primary/20";
  const catIcon = CATEGORY_ICONS[mission.category] ?? <Sparkles className="size-3.5" />;
  const priColor = PRIORITY_COLORS[mission.priority] ?? "text-muted-foreground bg-white/5 border-white/10";

  const handleToggle = async () => {
    setLoading(true);
    await onToggle(mission.id, mission.completed);
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <Card className={cn(
        "border transition-all duration-300 cursor-pointer hover:border-white/15",
        mission.completed
          ? "bg-black/10 border-white/5 opacity-60"
          : "bg-card/50 backdrop-blur-sm border-white/8 shadow-md hover:shadow-lg"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <button
              onClick={handleToggle}
              disabled={loading}
              className="mt-0.5 shrink-0 transition-all"
            >
              {loading ? (
                <RefreshCw className="size-5 animate-spin text-primary" />
              ) : mission.completed ? (
                <CheckCircle2 className="size-5 text-emerald-400" />
              ) : (
                <Circle className="size-5 text-muted-foreground hover:text-primary transition-colors" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className={cn("text-sm font-semibold", mission.completed && "line-through text-muted-foreground")}>
                  {mission.title}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge className={cn("text-[10px] h-5 px-1.5 border", priColor)}>
                    {mission.priority}
                  </Badge>
                  <Badge className={cn("text-[10px] h-5 px-1.5 border gap-1", catColor)}>
                    {catIcon} {mission.category}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{mission.description}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <Zap className="size-3 text-amber-400" />
                <span className="text-[10px] text-amber-400 font-semibold">+{mission.xp} XP</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function Missions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const today = format(new Date(), "EEEE, MMMM d");
  const completed = missions.filter(m => m.completed).length;
  const totalXP = missions.filter(m => m.completed).reduce((sum, m) => sum + m.xp, 0);
  const maxXP = missions.reduce((sum, m) => sum + m.xp, 0);
  const progress = missions.length > 0 ? Math.round((completed / missions.length) * 100) : 0;

  const fetchMissions = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/coach/missions`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as Mission[];
      setMissions(data);
    } catch {
      toast({ title: "Error", description: "Failed to load missions.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { void fetchMissions(); }, []);

  const toggleMission = async (id: number, currentCompleted: boolean) => {
    const endpoint = currentCompleted ? "uncomplete" : "complete";
    try {
      const res = await fetch(`${BASE_URL}/api/coach/missions/${id}/${endpoint}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json() as Mission;
      setMissions(prev => prev.map(m => m.id === id ? updated : m));
      if (!currentCompleted) {
        toast({ title: `+${updated.xp} XP earned!`, description: `Mission "${updated.title}" completed.` });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update mission.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-24 rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const pendingMissions = missions.filter(m => !m.completed);
  const completedMissions = missions.filter(m => m.completed);

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Target className="size-7 text-primary" /> Daily Missions
          </h1>
          <p className="text-muted-foreground mt-1">{today} — AI-generated growth tasks</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetchMissions(true)}
          disabled={isRefreshing} className="gap-2">
          <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Progress card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-r from-primary/10 to-violet-500/10 border-primary/20 p-5">
          <div className="flex items-center gap-4">
            <div className={cn(
              "size-14 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0",
              progress === 100
                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                : "bg-primary/15 border border-primary/25 text-primary"
            )}>
              {progress === 100 ? <Trophy className="size-7" /> : <Flame className="size-7" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">
                  {progress === 100 ? "All missions complete! 🎉" : `${completed} of ${missions.length} missions done`}
                </p>
                <div className="flex items-center gap-1.5">
                  <Zap className="size-4 text-amber-400" />
                  <span className="text-sm font-bold text-amber-400">{totalXP}/{maxXP} XP</span>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-[10px] text-muted-foreground mt-1.5">{progress}% complete</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Pending missions */}
      {pendingMissions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Pending ({pendingMissions.length})
          </h2>
          {pendingMissions.map(m => (
            <MissionCard key={m.id} mission={m} onToggle={(id, done) => void toggleMission(id, done)} />
          ))}
        </div>
      )}

      {/* Completed missions */}
      <AnimatePresence>
        {completedMissions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" /> Completed ({completedMissions.length})
            </h2>
            {completedMissions.map(m => (
              <MissionCard key={m.id} mission={m} onToggle={(id, done) => void toggleMission(id, done)} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {missions.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <Target className="size-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No missions generated yet.</p>
          <Button onClick={() => void fetchMissions(true)} className="gap-2">
            <Sparkles className="size-4" /> Generate Today's Missions
          </Button>
        </div>
      )}
    </div>
  );
}
