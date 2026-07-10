import { useGetStrategyStats } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, AreaChart, Area, CartesianGrid,
} from "recharts";
import {
  TrendingUp, FileText, Briefcase, Brain, Plus, Activity,
  Users, Target, BarChart2, Sparkles,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { motion } from "framer-motion";

const COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  borderColor: "hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

function StatCard({
  icon, label, value, sub, color = "text-primary", delay = 0,
}: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="bg-card/50 backdrop-blur-sm border-white/5 shadow-xl relative overflow-hidden">
        <div className={`absolute top-0 right-0 p-4 opacity-10 ${color}`}>
          <div className="size-14">{icon}</div>
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-4xl font-bold ${color}`}>{value}</div>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function buildWeeklyData(recentStrategies: { createdAt: string }[]) {
  const days: { day: string; strategies: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const dayStr = format(d, "EEE");
    const count = recentStrategies.filter(s =>
      format(new Date(s.createdAt), "yyyy-MM-dd") === format(d, "yyyy-MM-dd")
    ).length;
    days.push({ day: dayStr, strategies: count });
  }
  return days;
}

export function Analytics() {
  const { data: stats, isLoading } = useGetStrategyStats();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const s = stats ?? { total: 0, thisWeek: 0, topIndustries: [], recentStrategies: [] };
  const hasData = s.total > 0;
  const weeklyData = buildWeeklyData(s.recentStrategies ?? []);
  const growthRate = s.thisWeek > 0 && s.total > s.thisWeek
    ? Math.round((s.thisWeek / (s.total - s.thisWeek)) * 100) : 0;

  const pieData = (s.topIndustries ?? []).map(({ industry, count }: { industry: string; count: number }) => ({
    name: industry, value: count,
  }));

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BarChart2 className="size-7 text-primary" /> Business Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Track your growth and performance metrics.</p>
        </div>
        <Link href="/strategies/new">
          <Button className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="size-4" /> New Strategy
          </Button>
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<FileText className="size-14" />} label="Total Strategies" value={s.total}
          sub="All time" delay={0.05} />
        <StatCard icon={<TrendingUp className="size-14" />} label="This Week" value={s.thisWeek}
          sub={growthRate > 0 ? `+${growthRate}% growth` : "Keep generating"} color="text-emerald-400" delay={0.1} />
        <StatCard icon={<Briefcase className="size-14" />} label="Industries Covered"
          value={(s.topIndustries ?? []).length} sub="Diverse portfolio" color="text-sky-400" delay={0.15} />
        <StatCard icon={<Brain className="size-14" />} label="AI Insights" value={s.total > 0 ? `${(s.total * 10)} sections` : "0"}
          sub="Generated content" color="text-violet-400" delay={0.2} />
      </div>

      {/* AI Insight Banner */}
      {hasData && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="bg-gradient-to-r from-primary/10 to-violet-500/10 border-primary/20 p-5">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                <Sparkles className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">AI Growth Insight</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.thisWeek > 0
                    ? `Strong momentum — you generated ${s.thisWeek} ${s.thisWeek === 1 ? "strategy" : "strategies"} this week. ${(s.topIndustries ?? [])[0] ? `Your most active industry is ${(s.topIndustries as Array<{ industry: string; count: number }>)[0].industry}, indicating a clear specialization forming.` : ""} Continue this pace to build a comprehensive marketing library.`
                    : `You have ${s.total} ${s.total === 1 ? "strategy" : "strategies"} in your library. Generate more strategies to unlock deeper analytics and trend insights from your Marketing Expert.`
                  }
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-white/5 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-primary" /> Weekly Activity
            </CardTitle>
            <CardDescription>Strategies generated in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {!hasData ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm flex-col gap-2">
                <BarChart2 className="size-10 opacity-20" />
                <span>No data yet</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="strategies" stroke="hsl(var(--primary))" strokeWidth={2}
                    fill="url(#areaGrad)" name="Strategies" dot={{ fill: "hsl(var(--primary))", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-white/5 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4 text-primary" /> Industry Distribution
            </CardTitle>
            <CardDescription>Breakdown by market segment</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {!hasData || pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm flex-col gap-2">
                <Target className="size-10 opacity-20" />
                <span>No data yet</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={85} dataKey="value"
                    nameKey="name" stroke="none" paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false} fontSize={10}>
                    {pieData.map((_: unknown, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val: number) => [`${val} strategies`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Industry bar chart */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/5 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4 text-primary" /> Strategy Performance by Industry
          </CardTitle>
          <CardDescription>Volume comparison across all industries</CardDescription>
        </CardHeader>
        <CardContent className="h-[260px]">
          {!hasData ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm flex-col gap-2">
              <BarChart2 className="size-10 opacity-20" />
              <span>Generate strategies to see this chart</span>
              <Link href="/strategies/new">
                <Button size="sm" variant="outline" className="mt-2">Generate Now</Button>
              </Link>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.topIndustries ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="industry" stroke="#888" fontSize={11} tickLine={false} axisLine={false}
                  angle={-30} textAnchor="end" interval={0} />
                <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Strategies" maxBarSize={56}>
                  {(s.topIndustries ?? []).map((_: unknown, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {!hasData && (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">Generate your first strategy to unlock all analytics.</p>
          <Link href="/strategies/new">
            <Button className="gap-2">
              <Plus className="size-4" /> Generate Your First Strategy
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
