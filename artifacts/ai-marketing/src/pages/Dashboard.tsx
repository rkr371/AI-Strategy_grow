import { useGetStrategyStats } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  FileText, TrendingUp, Briefcase, Plus, ArrowRight, Activity,
  Calendar, Bot, Target, Users, MessageCircle, Lightbulb, BarChart2,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useUser } from "@clerk/react";

const QUICK_ACCESS = [
  {
    href: "/coach",
    icon: Bot,
    label: "Marketing Expert",
    desc: "Chat with Alex, your AI manager",
    color: "text-primary",
    bg: "from-primary/10",
    border: "border-primary/20",
  },
  {
    href: "/missions",
    icon: Target,
    label: "Daily Missions",
    desc: "Today's AI-generated growth tasks",
    color: "text-amber-400",
    bg: "from-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    href: "/analytics",
    icon: BarChart2,
    label: "Analytics",
    desc: "Performance charts and insights",
    color: "text-sky-400",
    bg: "from-sky-500/10",
    border: "border-sky-500/20",
  },
  {
    href: "/clients",
    icon: Users,
    label: "Client Discovery",
    desc: "Find and track ideal clients",
    color: "text-emerald-400",
    bg: "from-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    href: "/communicate",
    icon: MessageCircle,
    label: "Communication",
    desc: "AI-written emails and pitches",
    color: "text-pink-400",
    bg: "from-pink-500/10",
    border: "border-pink-500/20",
  },
  {
    href: "/startup-ideas",
    icon: Lightbulb,
    label: "Startup Ideas",
    desc: "Validated ideas from global trends",
    color: "text-violet-400",
    bg: "from-violet-500/10",
    border: "border-violet-500/20",
  },
];

export function Dashboard() {
  const { data: stats, isLoading } = useGetStrategyStats();
  const { user } = useUser();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[360px] lg:col-span-2 rounded-xl" />
          <Skeleton className="h-[360px] rounded-xl" />
        </div>
      </div>
    );
  }

  const dashboardStats = stats ?? { total: 0, thisWeek: 0, topIndustries: [], recentStrategies: [] };
  const hasData = dashboardStats.total > 0;
  const firstName = user?.firstName ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Your marketing command center.</p>
        </div>
        <Link href="/strategies/new">
          <Button className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-2">
            <Plus className="size-4" /> New Strategy
          </Button>
        </Link>
      </div>

      {/* KPI stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <FileText className="size-14" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Strategies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{dashboardStats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Generated all time</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
              <TrendingUp className="size-14" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{dashboardStats.thisWeek}</div>
              <p className="text-xs text-primary/80 mt-1 flex items-center gap-1">
                <Activity className="size-3" /> Active this week
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="col-span-2 sm:col-span-1">
          <Card className="bg-card/50 backdrop-blur-sm border-white/5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Briefcase className="size-14" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Industry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate h-10 flex items-end">
                {dashboardStats.topIndustries[0]?.industry ?? "None yet"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardStats.topIndustries[0]?.count
                  ? `${dashboardStats.topIndustries[0].count} strategies`
                  : "Generate to see trends"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Marketing Expert CTA */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Link href="/coach">
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 hover:border-primary/30 transition-all cursor-pointer group p-5">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(0,255,255,0.12)] group-hover:shadow-[0_0_30px_rgba(0,255,255,0.2)] transition-all shrink-0">
                <Bot className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground flex items-center gap-2">
                  Chat with Alex — Your Marketing Expert
                  <Sparkles className="size-4 text-primary" />
                </p>
                <p className="text-sm text-muted-foreground">
                  Ask about strategy, clients, content, campaigns — your dedicated AI manager is ready.
                </p>
              </div>
              <ArrowRight className="size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          </Card>
        </Link>
      </motion.div>

      {/* Quick Access grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {QUICK_ACCESS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.href} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.05 }}>
                <Link href={item.href}>
                  <Card className={`bg-gradient-to-br ${item.bg} to-transparent ${item.border} border hover:border-opacity-60 transition-all cursor-pointer group hover:shadow-lg p-4`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`size-5 ${item.color} shrink-0 mt-0.5`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground/90 group-hover:text-foreground transition-colors truncate">{item.label}</p>
                        <p className="text-xs text-muted-foreground leading-tight mt-0.5 line-clamp-2">{item.desc}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-white/5 shadow-xl">
          <CardHeader>
            <CardTitle>Industry Distribution</CardTitle>
            <CardDescription>Strategies broken down by target market</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 h-[320px]">
            {!hasData ? (
              <div className="h-full w-full flex items-center justify-center flex-col text-muted-foreground gap-3">
                <BarChart className="size-12 opacity-20" />
                <p className="text-sm">Not enough data yet</p>
                <Link href="/strategies/new">
                  <Button variant="outline" size="sm">Generate your first strategy</Button>
                </Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardStats.topIndustries} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <XAxis dataKey="industry" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
                  <Tooltip
                    cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {dashboardStats.topIndustries.map((_: unknown, index: number) => (
                      <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-white/5 shadow-xl flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
            <div className="space-y-1">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest strategies</CardDescription>
            </div>
            <Link href="/strategies">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {!hasData ? (
              <div className="h-full flex items-center justify-center p-8 text-center text-muted-foreground flex-col gap-3">
                <p className="text-sm">No strategies generated yet.</p>
                <Link href="/strategies/new">
                  <Button variant="outline" size="sm">Create your first</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {dashboardStats.recentStrategies.map((strategy) => (
                  <Link key={strategy.id} href={`/strategies/${strategy.id}`}>
                    <div className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group flex items-start gap-3">
                      <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary text-sm font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {strategy.companyName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">{strategy.companyName}</h4>
                        <p className="text-xs text-muted-foreground truncate">{strategy.industry}</p>
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                          <Calendar className="size-3" />
                          {format(new Date(strategy.createdAt), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
