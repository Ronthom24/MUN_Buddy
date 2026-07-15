"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Mic, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api, ApiRequestError } from "@/lib/api";
import type { DelegateDocument } from "@/lib/types";

type DocType = "position_paper" | "speech";

const TYPE_LABEL: Record<DocType, { label: string; singular: string; icon: typeof FileText; empty: string }> = {
  position_paper: { label: "Position Papers", singular: "position paper", icon: FileText, empty: "No position papers yet." },
  speech: { label: "Speeches", singular: "speech", icon: Mic, empty: "No speeches yet." },
};

export default function DelegateDocumentsPage() {
  const [documents, setDocuments] = useState<DelegateDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<DocType>("position_paper");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DelegateDocument | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: true; documents: DelegateDocument[] }>("/documents/mine");
      setDocuments(res.documents);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate(type: DocType) {
    setEditing(null);
    setActiveType(type);
    setDialogOpen(true);
  }

  function openEdit(doc: DelegateDocument) {
    setEditing(doc);
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/documents/${editing.id}`, {
          title: form.get("title"),
          content: form.get("content"),
          status: form.get("status"),
        });
        toast.success("Saved");
      } else {
        await api.post("/documents", {
          type: activeType,
          title: form.get("title"),
          content: form.get("content"),
        });
        toast.success("Created");
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not save document");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/documents/${id}`);
      toast.success("Deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not delete document");
    }
  }

  const grouped: Record<DocType, DelegateDocument[]> = {
    position_paper: documents.filter((d) => d.type === "position_paper"),
    speech: documents.filter((d) => d.type === "speech"),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Position Paper &amp; Speech</h1>
        <p className="text-muted-foreground">Draft and manage your written submissions for this conference.</p>
      </div>

      <Tabs value={activeType} onValueChange={(value) => setActiveType((value as DocType) ?? "position_paper")}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="position_paper">Position Papers</TabsTrigger>
            <TabsTrigger value="speech">Speeches</TabsTrigger>
          </TabsList>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button onClick={() => openCreate(activeType)} size="sm" />}>
              <Plus className="mr-1 h-4 w-4" /> New {TYPE_LABEL[activeType].singular}
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editing ? "Edit" : "New"} {editing ? editing.type.replace("_", " ") : TYPE_LABEL[activeType].singular}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" name="title" defaultValue={editing?.title} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea id="content" name="content" rows={10} defaultValue={editing?.content ?? ""} />
                  </div>
                  {editing && (
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        name="status"
                        defaultValue={editing.status}
                        className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                      >
                        <option value="draft">Draft</option>
                        <option value="final">Final</option>
                      </select>
                    </div>
                  )}
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

        {(["position_paper", "speech"] as DocType[]).map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : grouped[type].length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
                  {(() => {
                    const Icon = TYPE_LABEL[type].icon;
                    return <Icon className="h-8 w-8 text-muted-foreground" />;
                  })()}
                  <p className="text-sm text-muted-foreground">{TYPE_LABEL[type].empty}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {grouped[type].map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="flex items-start justify-between gap-3 p-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{doc.title}</p>
                          <Badge variant={doc.status === "final" ? "default" : "secondary"}>{doc.status}</Badge>
                        </div>
                        {doc.content && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{doc.content}</p>}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button size="icon-xs" variant="ghost" onClick={() => openEdit(doc)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon-xs" variant="ghost" onClick={() => handleDelete(doc.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
