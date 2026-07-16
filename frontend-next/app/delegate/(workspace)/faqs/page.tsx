"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { HelpCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { api, ApiRequestError } from "@/lib/api";
import type { Faq, FaqCategory } from "@/lib/types";

const CATEGORIES: { value: FaqCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "registration", label: "Registration" },
  { value: "committees", label: "Committees" },
  { value: "venue", label: "Venue" },
  { value: "accommodation", label: "Accommodation" },
  { value: "certificates", label: "Certificates" },
  { value: "payments", label: "Payments" },
  { value: "schedule", label: "Schedule" },
  { value: "resources", label: "Resources" },
];
const CATEGORY_ITEMS = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

export default function DelegateFaqsPage() {
  const [published, setPublished] = useState<Faq[]>([]);
  const [mine, setMine] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [conferenceId, setConferenceId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await api.get<{ success: true; conference: { id: number } | null }>("/delegates/me");
      const confId = me.conference?.id ?? null;
      setConferenceId(confId);
      const [publishedRes, mineRes] = await Promise.all([
        confId
          ? api.get<{ success: true; faqs: Faq[] }>(`/conferences/${confId}/faqs/published`)
          : Promise.resolve({ success: true as const, faqs: [] }),
        api.get<{ success: true; faqs: Faq[] }>("/delegates/me/faqs"),
      ]);
      setPublished(publishedRes.faqs);
      setMine(mineRes.faqs);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAsk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await api.post("/delegates/me/faqs", { question: form.get("question"), category: form.get("category") });
      toast.success("Question submitted — organizers have been notified");
      setDialogOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not submit question");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">FAQs</h1>
          <p className="text-muted-foreground">Answers from your organizers, and a place to ask your own.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button disabled={!conferenceId} />}>
            <Plus className="mr-1 h-4 w-4" /> Ask a question
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAsk}>
              <DialogHeader>
                <DialogTitle>Ask a question</DialogTitle>
                <DialogDescription>Your organizers will be notified and can answer it here.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" items={CATEGORY_ITEMS} defaultValue="general">
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="question">Your question</Label>
                  <Textarea id="question" name="question" rows={3} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit question"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frequently asked questions</CardTitle>
          <CardDescription>Published answers from your organizers.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : published.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <HelpCircle className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No published FAQs yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {published.map((f) => (
                <div key={f.id} className="p-5">
                  <div className="flex items-center gap-2">
                    {Boolean(f.is_pinned) && <Badge variant="outline">Pinned</Badge>}
                    <Badge variant="outline">{CATEGORY_ITEMS[f.category] || f.category}</Badge>
                  </div>
                  <p className="mt-2 font-medium">{f.question}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{f.answer}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {mine.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your questions</CardTitle>
            <CardDescription>Questions you've asked, whether answered yet or not.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {mine.map((f) => (
                <div key={f.id} className="p-5">
                  <div className="flex items-center gap-2">
                    <Badge variant={f.status === "pending" ? "outline" : "default"}>{f.status}</Badge>
                    <Badge variant="outline">{CATEGORY_ITEMS[f.category] || f.category}</Badge>
                  </div>
                  <p className="mt-2 font-medium">{f.question}</p>
                  {f.answer && <p className="mt-1 text-sm text-muted-foreground">{f.answer}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
