"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, FileText, Flag, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [chairDialogOpen, setChairDialogOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<Agenda | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);

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

  async function handleUpdateAgenda(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAgenda) return;
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await api.put(`/agenda/${editingAgenda.id}`, {
        title: form.get("title"),
        description: form.get("description") || undefined,
        backgroundNotes: form.get("backgroundNotes") || undefined,
        status: form.get("status"),
      });
      toast.success("Agenda item updated");
      setEditingAgenda(null);
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not update agenda item";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAgenda(agenda: Agenda) {
    try {
      await api.delete(`/agenda/${agenda.id}`);
      toast.success("Agenda item removed");
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not remove agenda item";
      toast.error(message);
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

  async function handleUpdatePortfolio(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingPortfolio) return;
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await api.put(`/portfolios/${editingPortfolio.id}`, {
        name: form.get("name"),
        type: form.get("type"),
      });
      toast.success("Portfolio updated");
      setEditingPortfolio(null);
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not update portfolio";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePortfolio(portfolio: Portfolio) {
    try {
      await api.delete(`/portfolios/${portfolio.id}`);
      toast.success("Portfolio removed");
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not remove portfolio";
      toast.error(message);
    }
  }

  async function handleUpdateChairs(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!committee) return;
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await api.put(`/committees/${committee.id}`, {
        chair: form.get("chair") || null,
        viceChair: form.get("viceChair") || null,
      });
      toast.success("Committee leadership updated");
      setChairDialogOpen(false);
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not update committee leadership";
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
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              Chair: {committee.chair || "Unassigned"} · Vice Chair: {committee.vice_chair || "Unassigned"}
              <Dialog open={chairDialogOpen} onOpenChange={setChairDialogOpen}>
                <DialogTrigger render={<Button size="icon-sm" variant="ghost" className="h-5 w-5" />}>
                  <Pencil className="h-3 w-3" />
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleUpdateChairs}>
                    <DialogHeader>
                      <DialogTitle>Committee leadership</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="chair">Chair</Label>
                        <Input id="chair" name="chair" defaultValue={committee.chair || ""} placeholder="Chair name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="viceChair">Vice Chair</Label>
                        <Input id="viceChair" name="viceChair" defaultValue={committee.vice_chair || ""} placeholder="Vice chair name" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? "Saving..." : "Save"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
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
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{agenda.title}</p>
                      <div className="flex shrink-0 items-center gap-1">
                        <Badge variant="outline">{agenda.status}</Badge>
                        <Button size="icon-sm" variant="ghost" onClick={() => setEditingAgenda(agenda)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon-sm" variant="ghost" onClick={() => handleDeleteAgenda(agenda)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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
                  <div
                    key={portfolio.id}
                    className="group flex items-center gap-1 rounded-full border border-border py-0.5 pl-3 pr-1 text-sm"
                  >
                    <Badge variant={portfolio.status === "assigned" ? "default" : "outline"} className="border-none p-0">
                      {portfolio.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{portfolio.type}</span>
                    <Button
                      size="icon-sm" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100"
                      onClick={() => setEditingPortfolio(portfolio)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon-sm" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100"
                      onClick={() => handleDeletePortfolio(portfolio)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(editingAgenda)} onOpenChange={(open) => !open && setEditingAgenda(null)}>
        <DialogContent>
          {editingAgenda && (
            <form onSubmit={handleUpdateAgenda}>
              <DialogHeader>
                <DialogTitle>Edit agenda item</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="editAgendaTitle">Title</Label>
                  <Input id="editAgendaTitle" name="title" required defaultValue={editingAgenda.title} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editAgendaDescription">Description</Label>
                  <Textarea id="editAgendaDescription" name="description" rows={3} defaultValue={editingAgenda.description || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editAgendaBackground">Background notes</Label>
                  <Textarea id="editAgendaBackground" name="backgroundNotes" rows={3} defaultValue={editingAgenda.background_notes || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editAgendaStatus">Status</Label>
                  <Select
                    name="status" defaultValue={editingAgenda.status}
                    items={{ draft: "Draft", published: "Published", archived: "Archived" }}
                  >
                    <SelectTrigger id="editAgendaStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingPortfolio)} onOpenChange={(open) => !open && setEditingPortfolio(null)}>
        <DialogContent>
          {editingPortfolio && (
            <form onSubmit={handleUpdatePortfolio}>
              <DialogHeader>
                <DialogTitle>Edit portfolio</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="editPortfolioName">Name</Label>
                  <Input id="editPortfolioName" name="name" required defaultValue={editingPortfolio.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPortfolioType">Type</Label>
                  <Select
                    name="type" defaultValue={editingPortfolio.type}
                    items={{ country: "Country", position: "Position", observer: "Observer" }}
                  >
                    <SelectTrigger id="editPortfolioType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="country">Country</SelectItem>
                      <SelectItem value="position">Position</SelectItem>
                      <SelectItem value="observer">Observer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
