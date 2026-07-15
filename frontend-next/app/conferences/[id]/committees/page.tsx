"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Gavel, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { api, ApiRequestError } from "@/lib/api";
import type { Committee, CommitteeStats } from "@/lib/types";

export default function CommitteesPage() {
  const params = useParams<{ id: string }>();
  const conferenceId = params.id;

  const [committees, setCommittees] = useState<Committee[]>([]);
  const [statsByCommittee, setStatsByCommittee] = useState<Record<number, CommitteeStats>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: true; committees: Committee[] }>(`/conferences/${conferenceId}/committees`);
      setCommittees(res.committees);

      const statsList = await Promise.all(
        res.committees.map((c) =>
          api.get<{ success: true; stats: CommitteeStats }>(`/committees/${c.id}/stats`).then((r) => [c.id, r.stats] as const)
        )
      );
      setStatsByCommittee(Object.fromEntries(statsList));
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Failed to load committees";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await api.post(`/conferences/${conferenceId}/committees`, {
        name: form.get("name"),
        chair: form.get("chair") || undefined,
        viceChair: form.get("viceChair") || undefined,
        capacity: form.get("capacity") ? Number(form.get("capacity")) : undefined,
        type: form.get("type") || "standard",
      });
      toast.success("Committee created");
      setDialogOpen(false);
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not create committee";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Committees</CardTitle>
            <CardDescription>Create and manage the academic bodies of this conference.</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="mr-1 h-4 w-4" /> New committee
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create a committee</DialogTitle>
                  <DialogDescription>Add an academic body delegates can be assigned to.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Committee name</Label>
                    <Input id="name" name="name" required placeholder="UNSC" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="chair">Chair</Label>
                      <Input id="chair" name="chair" placeholder="Full name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="viceChair">Vice chair</Label>
                      <Input id="viceChair" name="viceChair" placeholder="Full name" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input id="capacity" name="capacity" type="number" min={1} placeholder="20" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Creating..." : "Create committee"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : committees.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Gavel className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No committees yet. Create your first one above.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {committees.map((committee) => {
                const stats = statsByCommittee[committee.id];
                const occupancy = committee.capacity && stats ? stats.assignedCount / committee.capacity : 0;
                return (
                  <Link key={committee.id} href={`/conferences/${conferenceId}/committees/${committee.id}`}>
                    <Card className="h-full transition-shadow hover:shadow-md">
                      <CardContent className="space-y-3 p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold leading-tight">{committee.name}</p>
                            <p className="text-xs text-muted-foreground">{committee.chair || "No chair assigned"}</p>
                          </div>
                          <Badge variant={committee.type === "crisis" ? "destructive" : "secondary"}>
                            {committee.type}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" /> Occupancy
                            </span>
                            <span>
                              {stats?.assignedCount ?? 0}
                              {committee.capacity ? ` / ${committee.capacity}` : ""}
                            </span>
                          </div>
                          <Progress value={occupancy * 100} />
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">{stats?.totalPortfolios ?? 0} portfolios</Badge>
                          <Badge variant="outline">{committee.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
