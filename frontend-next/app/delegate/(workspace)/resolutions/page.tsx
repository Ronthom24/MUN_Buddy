"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Flag, Pencil, Plus, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api, ApiRequestError } from "@/lib/api";
import type { DelegateProfile, Resolution } from "@/lib/types";

const STATUS_VARIANT: Record<Resolution["status"], "secondary" | "default" | "destructive" | "outline"> = {
  draft: "secondary",
  submitted: "outline",
  under_review: "outline",
  passed: "default",
  failed: "destructive",
};

export default function DelegateResolutionsPage() {
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [committeeId, setCommitteeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Resolution | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resolutionsRes, profileRes] = await Promise.all([
        api.get<{ success: true; resolutions: Resolution[] }>("/resolutions/mine"),
        api.get<{ success: true } & DelegateProfile>("/delegates/me"),
      ]);
      setResolutions(resolutionsRes.resolutions);
      setCommitteeId(profileRes.assignment.committeeId ?? null);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load resolutions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(resolution: Resolution) {
    setEditing(resolution);
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/resolutions/${editing.id}`, { title: form.get("title"), body: form.get("body") });
        toast.success("Resolution updated");
      } else {
        if (!committeeId) {
          toast.error("You need a published committee assignment before drafting a resolution");
          return;
        }
        await api.post("/resolutions", { title: form.get("title"), body: form.get("body"), committeeId });
        toast.success("Resolution drafted");
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not save resolution");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFileSubmit(id: number) {
    try {
      await api.patch(`/resolutions/${id}/submit`);
      toast.success("Resolution submitted for review");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not submit resolution");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resolutions</h1>
          <p className="text-muted-foreground">Draft and submit resolutions for your committee.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            <Plus className="mr-1 h-4 w-4" /> New resolution
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit resolution" : "New resolution"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" defaultValue={editing?.title} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Body</Label>
                  <Textarea id="body" name="body" rows={10} defaultValue={editing?.body ?? ""} required />
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
      </div>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : resolutions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Flag className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No resolutions drafted yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {resolutions.map((resolution) => (
            <Card key={resolution.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{resolution.title}</p>
                      <Badge variant={STATUS_VARIANT[resolution.status]}>{resolution.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{resolution.body}</p>
                    {resolution.organizer_notes && (
                      <p className="mt-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">
                        Organizer notes: {resolution.organizer_notes}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {resolution.status === "draft" && (
                      <>
                        <Button size="icon-xs" variant="ghost" onClick={() => openEdit(resolution)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="xs" variant="outline" onClick={() => handleFileSubmit(resolution.id)}>
                          <Send className="mr-1 h-3.5 w-3.5" /> Submit
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
