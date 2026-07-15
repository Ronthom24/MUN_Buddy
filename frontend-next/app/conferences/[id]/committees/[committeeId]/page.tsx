"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, FileText, Flag, Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { api, ApiRequestError } from "@/lib/api";
import type { Agenda, Committee, CommitteeStats, Portfolio } from "@/lib/types";

export default function CommitteeDetailPage() {
  const params = useParams<{ id: string; committeeId: string }>();

  const [committee, setCommittee] = useState<Committee | null>(null);
  const [stats, setStats] = useState<CommitteeStats | null>(null);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [agendaDialogOpen, setAgendaDialogOpen] = useState(false);
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [committeeRes, statsRes, agendaRes, portfolioRes] = await Promise.all([
        api.get<{ success: true; committee: Committee }>(`/committees/${params.committeeId}`),
        api.get<{ success: true; stats: CommitteeStats }>(`/committees/${params.committeeId}/stats`),
        api.get<{ success: true; agendas: Agenda[] }>(`/committees/${params.committeeId}/agenda`),
        api.get<{ success: true; portfolios: Portfolio[] }>(`/committees/${params.committeeId}/portfolios`),
      ]);
      setCommittee(committeeRes.committee);
      setStats(statsRes.stats);
      setAgendas(agendaRes.agendas);
      setPortfolios(portfolioRes.portfolios);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Failed to load committee";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [params.committeeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateAgenda(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await api.post(`/committees/${params.committeeId}/agenda`, {
        title: form.get("title"),
        description: form.get("description") || undefined,
        backgroundNotes: form.get("backgroundNotes") || undefined,
      });
      toast.success("Agenda item added");
      setAgendaDialogOpen(false);
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not add agenda item";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreatePortfolio(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await api.post(`/committees/${params.committeeId}/portfolios`, {
        name: form.get("name"),
        type: form.get("type") || "country",
      });
      toast.success("Portfolio added");
      setPortfolioDialogOpen(false);
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not add portfolio";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !committee) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/conferences/${params.id}/committees`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All committees
      </Link>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{committee.name}</h1>
              <Badge variant={committee.type === "crisis" ? "destructive" : "secondary"}>{committee.type}</Badge>
              <Badge variant="outline">{committee.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Chair: {committee.chair || "Unassigned"} · Vice Chair: {committee.vice_chair || "Unassigned"}
            </p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-semibold">
                {stats?.assignedCount ?? 0}
                {committee.capacity ? `/${committee.capacity}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">Delegates</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats?.totalPortfolios ?? 0}</p>
              <p className="text-xs text-muted-foreground">Portfolios</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats?.preferenceCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Preferences</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" /> Agenda
              </CardTitle>
              <CardDescription>Topics under discussion in this committee.</CardDescription>
            </div>
            <Dialog open={agendaDialogOpen} onOpenChange={setAgendaDialogOpen}>
              <DialogTrigger render={<Button size="xs" variant="outline" />}>
                <Plus className="h-3.5 w-3.5" />
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateAgenda}>
                  <DialogHeader>
                    <DialogTitle>Add agenda item</DialogTitle>
                    <DialogDescription>Delegates will see this once published.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" name="title" required placeholder="Climate Change and Security" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="backgroundNotes">Background notes</Label>
                      <Textarea id="backgroundNotes" name="backgroundNotes" rows={3} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Adding..." : "Add agenda item"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {agendas.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No agenda items yet.</p>
            ) : (
              <div className="space-y-3">
                {agendas.map((agenda, i) => (
                  <div key={agenda.id}>
                    {i > 0 && <Separator className="mb-3" />}
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{agenda.title}</p>
                      <Badge variant="outline">{agenda.status}</Badge>
                    </div>
                    {agenda.description && <p className="mt-1 text-sm text-muted-foreground">{agenda.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Flag className="h-4 w-4" /> Portfolios
              </CardTitle>
              <CardDescription>Countries and roles delegates can represent.</CardDescription>
            </div>
            <Dialog open={portfolioDialogOpen} onOpenChange={setPortfolioDialogOpen}>
              <DialogTrigger render={<Button size="xs" variant="outline" />}>
                <Plus className="h-3.5 w-3.5" />
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreatePortfolio}>
                  <DialogHeader>
                    <DialogTitle>Add portfolio</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="portfolioName">Name</Label>
                      <Input id="portfolioName" name="name" required placeholder="Brazil" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Adding..." : "Add portfolio"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {portfolios.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No portfolios yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {portfolios.map((portfolio) => (
                  <Badge key={portfolio.id} variant={portfolio.status === "assigned" ? "default" : "outline"}>
                    {portfolio.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
