import { useListStrategies, useDeleteStrategy, getListStrategiesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Plus, Search, MoreVertical, FileText, Trash2, Eye, Calendar, Sparkles } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export function Strategies() {
  const { data: strategies, isLoading } = useListStrategies();
  const deleteMutation = useDeleteStrategy();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const filteredStrategies = strategies?.filter(s => 
    s.companyName.toLowerCase().includes(search.toLowerCase()) || 
    s.industry.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleDelete = (id: number) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStrategiesQueryKey() });
          toast({
            title: "Strategy deleted",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Strategies</h1>
          <p className="text-muted-foreground mt-1">Manage your generated marketing plans</p>
        </div>
        <Link href="/strategies/new">
          <Button className="shadow-lg shadow-primary/20">
            <Plus className="size-4 mr-2" />
            New Strategy
          </Button>
        </Link>
      </div>

      <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-4 bg-black/20">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search companies or industries..."
              className="pl-9 bg-background/50 border-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            ))}
          </div>
        ) : filteredStrategies.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="size-8 text-primary" />
            </div>
            {search ? (
              <>
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground max-w-md">No strategies match your search query "{search}".</p>
                <Button variant="link" onClick={() => setSearch("")} className="mt-4">Clear search</Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">No strategies yet</h3>
                <p className="text-muted-foreground max-w-md mb-6">Create your first AI-powered marketing strategy to see it here.</p>
                <Link href="/strategies/new">
                  <Button>
                    <Plus className="size-4 mr-2" />
                    Generate Strategy
                  </Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-black/40">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[300px]">Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Goals</TableHead>
                  <TableHead className="w-[150px]">Date</TableHead>
                  <TableHead className="text-right w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStrategies.map((strategy, i) => (
                  <motion.tr 
                    key={strategy.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group border-border hover:bg-white/[0.02] transition-colors"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-bold">{strategy.companyName.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <Link href={`/strategies/${strategy.id}`} className="hover:underline underline-offset-4 decoration-primary text-foreground">
                            {strategy.companyName}
                          </Link>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{strategy.targetAudience}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 text-foreground border-white/10 font-normal">
                        {strategy.industry}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px]">
                      <span className="line-clamp-1 text-sm">{strategy.goals}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5" />
                        {format(new Date(strategy.createdAt), "MMM d")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="size-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <Link href={`/strategies/${strategy.id}`}>
                            <DropdownMenuItem className="cursor-pointer">
                              <Eye className="size-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem 
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                            onClick={() => handleDelete(strategy.id)}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}