"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { NotebookPen, Pencil, Plus, Trash2 } from "lucide-react";
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
import type { Note } from "@/lib/types";

export default function DelegateNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: true; notes: Note[] }>("/notes/mine");
      setNotes(res.notes);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load notes");
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

  function openEdit(note: Note) {
    setEditing(note);
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = { title: form.get("title"), content: form.get("content"), tags: form.get("tags") || undefined };
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/notes/${editing.id}`, payload);
        toast.success("Note updated");
      } else {
        await api.post("/notes", payload);
        toast.success("Note created");
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not save note");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/notes/${id}`);
      toast.success("Note deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not delete note");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
          <p className="text-muted-foreground">Personal notes for your research and preparation.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            <Plus className="mr-1 h-4 w-4" /> New note
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit note" : "New note"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" defaultValue={editing?.title} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea id="content" name="content" rows={6} defaultValue={editing?.content ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input id="tags" name="tags" defaultValue={editing?.tags ?? ""} placeholder="research, allies" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save note"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <NotebookPen className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No notes yet. Create your first one above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{note.title}</p>
                  <div className="flex shrink-0 gap-1">
                    <Button size="icon-xs" variant="ghost" onClick={() => openEdit(note)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon-xs" variant="ghost" onClick={() => handleDelete(note.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {note.content && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{note.content}</p>}
                {note.tags && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {note.tags.split(",").map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
