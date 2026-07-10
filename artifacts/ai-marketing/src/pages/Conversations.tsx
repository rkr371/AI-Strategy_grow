import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Plus, Trash2, Search, Bot, ArrowRight,
  Calendar, Clock,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface Conversation { id: number; title: string; createdAt: string; }
interface ConvWithPreview extends Conversation { preview?: string; messageCount?: number; }

export function Conversations() {
  const [, setLocation] = useLocation();
  const [conversations, setConversations] = useState<ConvWithPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/gemini/conversations`);
        const data = await res.json() as Conversation[];
        setConversations(data);
      } catch {
        toast({ title: "Error", description: "Failed to load conversations.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const createAndOpen = async () => {
    const title = `Chat ${format(new Date(), "MMM d, h:mm a")}`;
    try {
      const res = await fetch(`${BASE_URL}/api/gemini/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const conv = await res.json() as Conversation;
      setLocation("/coach");
    } catch {
      toast({ title: "Error", description: "Failed to create conversation.", variant: "destructive" });
    }
  };

  const deleteConversation = async (id: number) => {
    try {
      await fetch(`${BASE_URL}/api/gemini/conversations/${id}`, { method: "DELETE" });
      setConversations(prev => prev.filter(c => c.id !== id));
      toast({ title: "Deleted", description: "Conversation removed." });
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, ConvWithPreview[]>>((acc, conv) => {
    const key = format(new Date(conv.createdAt), "MMMM d, yyyy");
    if (!acc[key]) acc[key] = [];
    acc[key].push(conv);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <MessageSquare className="size-7 text-primary" /> Conversation History
          </h1>
          <p className="text-muted-foreground mt-1">
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""} with your Marketing Expert
          </p>
        </div>
        <Button onClick={() => void createAndOpen()} className="gap-2 shadow-lg shadow-primary/20 shrink-0">
          <Plus className="size-4" /> New Chat
        </Button>
      </div>

      {/* Search */}
      {conversations.length > 3 && (
        <div className="relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="pl-9 bg-black/30 border-white/10 focus:border-primary/40" />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16">
          <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Bot className="size-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">No conversations yet</h2>
          <p className="text-muted-foreground mb-6">Start a conversation with your Marketing Expert.</p>
          <Button onClick={() => void createAndOpen()} className="gap-2">
            <Plus className="size-4" /> Start Your First Chat
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="size-8 opacity-30 mx-auto mb-2" />
          <p>No conversations match your search.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, convs]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{date}</span>
              </div>
              <div className="space-y-2">
                {convs.map((conv, i) => (
                  <motion.div key={conv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card className="bg-card/50 backdrop-blur-sm border-white/8 hover:border-white/15 transition-all group cursor-pointer"
                      onClick={() => setLocation("/coach")}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                            <Bot className="size-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{conv.title}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <Clock className="size-3" />
                              {formatDistanceToNow(new Date(conv.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] hidden sm:flex">
                              Marketing Expert
                            </Badge>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button onClick={e => e.stopPropagation()}
                                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1.5 rounded-md hover:bg-destructive/10">
                                  <Trash2 className="size-4" />
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-card border-border" onClick={e => e.stopPropagation()}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete "{conv.title}" and all its messages.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-transparent">Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => void deleteConversation(conv.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
