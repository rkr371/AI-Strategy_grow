import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import {
  LayoutDashboard, FileText, Plus, LogOut, Loader2, Menu, Sparkles,
  Bot, MessageSquare, BarChart2, Users, MessageCircle, Lightbulb, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { motion } from "framer-motion";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/analytics", label: "Analytics", icon: BarChart2 },
    ],
  },
  {
    label: "Marketing Expert",
    items: [
      { href: "/coach", label: "AI Chat", icon: Bot, badge: "Alex" },
      { href: "/conversations", label: "History", icon: MessageSquare },
      { href: "/missions", label: "Daily Missions", icon: Target },
    ],
  },
  {
    label: "Strategy",
    items: [
      { href: "/strategies", label: "Strategies", icon: FileText },
      { href: "/strategies/new", label: "New Strategy", icon: Plus },
    ],
  },
  {
    label: "Business Tools",
    items: [
      { href: "/clients", label: "Client Discovery", icon: Users },
      { href: "/communicate", label: "Communication", icon: MessageCircle },
      { href: "/startup-ideas", label: "Startup Ideas", icon: Lightbulb },
    ],
  },
];

function isActive(location: string, href: string): boolean {
  if (href === "/strategies") return location === "/strategies" || (location.startsWith("/strategies/") && !location.startsWith("/strategies/new"));
  if (href !== "/" && href !== "/strategies") return location === href || location.startsWith(href + "/");
  return location === href;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="h-14 flex items-center px-4 border-b border-white/5 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="size-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_12px_rgba(0,255,255,0.15)] group-hover:shadow-[0_0_18px_rgba(0,255,255,0.3)] transition-all duration-300">
            <Sparkles className="size-3.5" />
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground">StratGen AI</span>
        </Link>
      </div>

      <nav className="p-2 flex-1 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest px-3 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item, i) => {
                const active = isActive(location, item.href);
                return (
                  <motion.div key={item.href} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 relative group",
                        active
                          ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(0,255,255,0.08)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border border-transparent"
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 rounded-lg bg-primary/5"
                          transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                        />
                      )}
                      <item.icon className={cn("size-4 shrink-0 relative z-10", active ? "text-primary" : "")} />
                      <span className="relative z-10 flex-1">{item.label}</span>
                      {"badge" in item && item.badge && (
                        <Badge className="relative z-10 text-[9px] h-4 px-1.5 bg-primary/15 text-primary border-primary/20">
                          {item.badge as string}
                        </Badge>
                      )}
                      {active && (
                        <div className="ml-auto size-1.5 rounded-full bg-primary relative z-10 shadow-[0_0_5px_rgba(0,255,255,0.8)]" />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-2 border-t border-white/5 shrink-0">
        {!isLoaded ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : user ? (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors group">
            <Avatar className="size-7 border border-white/10 shrink-0">
              <AvatarImage src={user.imageUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                {user.firstName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden min-w-0">
              <p className="text-[11px] font-semibold truncate text-foreground">{user.fullName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.primaryEmailAddress?.emailAddress}</p>
            </div>
            <Button
              variant="ghost" size="icon"
              className="size-6 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              onClick={() => signOut({ redirectUrl: basePath || "/" })}
              data-testid="button-sign-out"
            >
              <LogOut className="size-3" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[100dvh] bg-background">
      <aside className="w-56 border-r border-white/5 bg-black/20 hidden md:flex flex-col backdrop-blur-xl shrink-0">
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden min-w-0">
        <div className="md:hidden flex items-center justify-between h-12 px-4 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <Link href="/" className="flex items-center gap-2 font-bold text-sm text-foreground">
            <div className="size-6 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <Sparkles className="size-3.5" />
            </div>
            StratGen AI
          </Link>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] p-0 bg-background/95 backdrop-blur-xl border-r border-white/5">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
