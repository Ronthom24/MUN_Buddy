"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Download, FileText, HelpCircle, History, Megaphone, Mail, Pin, Plus, Send, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { api, ApiRequestError, resolveFileUrl } from "@/lib/api";
import { downloadBlob } from "@/lib/utils";
import type {
  Announcement, Committee, Conference, EmailBroadcast, EmailTemplate, Faq, Resource, ResourceVersion,
} from "@/lib/types";

const ANNOUNCEMENT_CATEGORIES = [
  "general_update", "registration", "assignments", "resources", "committee_update", "emergency_notice",
];
const AUDIENCES = ["all", "delegates", "organizers", "committee_staff"];
const RESOURCE_CATEGORIES = [
  "background_guide", "research_paper", "rules_of_procedure", "conference_handbook", "position_paper_guide", "other",
];
const FAQ_CATEGORIES = [
  "general", "registration", "committees", "venue", "accommodation", "certificates", "payments", "schedule", "resources",
];
const BROADCAST_AUDIENCES = ["all", "approved", "committee", "waitlisted", "rejected"];

export default function CommunicationPage() {
  const params = useParams<{ id: string }>();
  const conferenceId = params.id;

  const [conference, setConference] = useState<Conference | null>(null);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [broadcasts, setBroadcasts] = useState<EmailBroadcast[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [versionsResource, setVersionsResource] = useState<Resource | null>(null);
  const [versions, setVersions] = useState<ResourceVersion[]>([]);
  const [answerFaq, setAnswerFaq] = useState<Faq | null>(null);
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  const committeeItems = useMemo(
    () => ({ none: "Entire conference", ...Object.fromEntries(committees.map((c) => [String(c.id), c.name])) }),
    [committees]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const conferenceRes = await api.get<{ success: true; conference: Conference }>(`/conferences/${conferenceId}`);
      setConference(conferenceRes.conference);

      const [committeesRes, announcementsRes, resourcesRes, faqsRes, broadcastsRes, templatesRes] = await Promise.all([
        api.get<{ success: true; committees: Committee[] }>(`/conferences/${conferenceId}/committees`),
        api.get<{ success: true; announcements: Announcement[] }>(`/conferences/${conferenceId}/announcements`),
        api.get<{ success: true; resources: Resource[] }>(`/conferences/${conferenceId}/resources`),
        api.get<{ success: true; faqs: Faq[] }>(`/conferences/${conferenceId}/faqs`),
        api.get<{ success: true; broadcasts: EmailBroadcast[] }>(`/conferences/${conferenceId}/broadcasts`),
        api.get<{ success: true; templates: EmailTemplate[] }>(`/organizations/${conferenceRes.conference.organization_id}/email-templates`),
      ]);
      setCommittees(committeesRes.committees);
      setAnnouncements(announcementsRes.announcements);
      setResources(resourcesRes.resources);
      setFaqs(faqsRes.faqs);
      setBroadcasts(broadcastsRes.broadcasts);
      setTemplates(templatesRes.templates);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load communication data");
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    load();
  }, [load]);

  // ---- Announcements ----
  async function handleSaveAnnouncement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const committeeId = form.get("committeeId");
    const payload = {
      title: form.get("title"),
      content: form.get("content"),
      category: form.get("category"),
      targetAudience: form.get("targetAudience"),
      priority: form.get("priority"),
      status: form.get("status"),
      publishDate: form.get("publishDate") || undefined,
      committeeId: committeeId && committeeId !== "none" ? Number(committeeId) : null,
    };
    setSubmitting(true);
    try {
      if (editingAnnouncement) {
        await api.put(`/announcements/${editingAnnouncement.id}`, payload);
        toast.success("Announcement updated");
      } else {
        await api.post(`/conferences/${conferenceId}/announcements`, payload);
        toast.success("Announcement saved");
      }
      setAnnouncementDialogOpen(false);
      setEditingAnnouncement(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not save announcement");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAnnouncement(a: Announcement) {
    try {
      await api.delete(`/announcements/${a.id}`);
      toast.success("Announcement deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not delete announcement");
    }
  }

  // ---- Resources ----
  async function handleSaveResource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const committeeId = formData.get("committeeId");
    if (committeeId === "none") formData.delete("committeeId");

    setSubmitting(true);
    try {
      if (editingResource) {
        const payload = {
          title: formData.get("title"),
          category: formData.get("category"),
          tags: formData.get("tags"),
          description: formData.get("description"),
          visibility: formData.get("visibility"),
          status: formData.get("status"),
          committeeId: committeeId && committeeId !== "none" ? Number(committeeId) : null,
        };
        await api.put(`/resources/${editingResource.id}`, payload);
        toast.success("Resource updated");
      } else {
        await api.postForm(`/conferences/${conferenceId}/resources`, formData);
        toast.success("Resource uploaded");
      }
      setResourceDialogOpen(false);
      setEditingResource(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not save resource");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownloadResource(r: Resource) {
    try {
      const blob = await api.getBlob(`/resources/${r.id}/download`);
      const ext = r.file_path?.includes(".") ? r.file_path.slice(r.file_path.lastIndexOf(".")) : "";
      downloadBlob(blob, `${r.title}${ext}`);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not download resource");
    }
  }

  async function handleDeleteResource(r: Resource) {
    try {
      await api.delete(`/resources/${r.id}`);
      toast.success("Resource deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not delete resource");
    }
  }

  async function openVersions(resource: Resource) {
    setVersionsResource(resource);
    try {
      const res = await api.get<{ success: true; versions: ResourceVersion[] }>(`/resources/${resource.id}/versions`);
      setVersions(res.versions);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not load versions");
    }
  }

  async function handleUploadVersion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!versionsResource) return;
    const formData = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await api.postForm(`/resources/${versionsResource.id}/versions`, formData);
      toast.success("New version uploaded");
      await openVersions(versionsResource);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not upload version");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- FAQs ----
  async function handleAnswerFaq(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!answerFaq) return;
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await api.patch(`/faqs/${answerFaq.id}/answer`, { answer: form.get("answer"), status: form.get("status") });
      toast.success("Answer saved");
      setAnswerFaq(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not save answer");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTogglePin(faq: Faq) {
    try {
      await api.put(`/faqs/${faq.id}`, { isPinned: faq.is_pinned ? false : true });
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not update FAQ");
    }
  }

  async function handleDeleteFaq(faq: Faq) {
    try {
      await api.delete(`/faqs/${faq.id}`);
      toast.success("FAQ removed");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not remove FAQ");
    }
  }

  // ---- Broadcasts ----
  async function handleCreateBroadcast(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const committeeId = form.get("committeeId");
    setSubmitting(true);
    try {
      await api.post(`/conferences/${conferenceId}/broadcasts`, {
        subject: form.get("subject"),
        body: form.get("body"),
        audience: form.get("audience"),
        committeeId: form.get("audience") === "committee" && committeeId ? Number(committeeId) : undefined,
      });
      toast.success("Broadcast created as a draft");
      setBroadcastDialogOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not create broadcast");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendBroadcast(broadcast: EmailBroadcast) {
    try {
      await api.post(`/conferences/${conferenceId}/broadcasts/${broadcast.id}/send`);
      toast.success("Broadcast sent");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not send broadcast");
    }
  }

  async function handleSaveTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!conference) return;
    const form = new FormData(event.currentTarget);
    const payload = { name: form.get("name"), subject: form.get("subject"), body: form.get("body") };
    setSubmitting(true);
    try {
      if (editingTemplate) {
        await api.put(`/organizations/${conference.organization_id}/email-templates/${editingTemplate.id}`, payload);
        toast.success("Template updated");
      } else {
        await api.post(`/organizations/${conference.organization_id}/email-templates`, payload);
        toast.success("Template created");
      }
      setTemplateDialogOpen(false);
      setEditingTemplate(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not save template");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTemplate(template: EmailTemplate) {
    if (!conference) return;
    try {
      await api.delete(`/organizations/${conference.organization_id}/email-templates/${template.id}`);
      toast.success("Template deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not delete template");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Communication Center</h1>
        <p className="text-muted-foreground">Announcements, resources, FAQs, and email broadcasts in one place.</p>
      </div>

      <Tabs defaultValue="announcements">
        <TabsList>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="faqs">
            FAQs {faqs.filter((f) => f.status === "pending").length > 0 && (
              <Badge variant="destructive" className="ml-1.5">{faqs.filter((f) => f.status === "pending").length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="broadcasts">Email Broadcasts</TabsTrigger>
        </TabsList>

        {/* ---------------- Announcements ---------------- */}
        <TabsContent value="announcements" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Announcements</CardTitle>
                <CardDescription>Official updates, scheduled or published immediately.</CardDescription>
              </div>
              <Dialog
                open={announcementDialogOpen}
                onOpenChange={(open) => {
                  setAnnouncementDialogOpen(open);
                  if (!open) setEditingAnnouncement(null);
                }}
              >
                <DialogTrigger render={<Button size="sm" onClick={() => setEditingAnnouncement(null)} />}>
                  <Plus className="mr-1 h-4 w-4" /> New announcement
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleSaveAnnouncement}>
                    <DialogHeader>
                      <DialogTitle>{editingAnnouncement ? "Edit announcement" : "New announcement"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="announcement-title">Title</Label>
                        <Input id="announcement-title" name="title" required defaultValue={editingAnnouncement?.title} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="content">Content</Label>
                        <Textarea id="content" name="content" rows={4} required defaultValue={editingAnnouncement?.content} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="announcement-category">Category</Label>
                          <Select
                            name="category"
                            items={Object.fromEntries(ANNOUNCEMENT_CATEGORIES.map((c) => [c, c.replace("_", " ")]))}
                            defaultValue={editingAnnouncement?.category || "general_update"}
                          >
                            <SelectTrigger id="announcement-category" className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ANNOUNCEMENT_CATEGORIES.map((c) => (
                                <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="priority">Priority</Label>
                          <Select
                            name="priority"
                            items={{ normal: "Normal", important: "Important", urgent: "Urgent" }}
                            defaultValue={editingAnnouncement?.priority || "normal"}
                          >
                            <SelectTrigger id="priority" className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="important">Important</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="targetAudience">Audience</Label>
                          <Select
                            name="targetAudience"
                            items={Object.fromEntries(AUDIENCES.map((a) => [a, a.replace("_", " ")]))}
                            defaultValue={editingAnnouncement?.target_audience || "all"}
                          >
                            <SelectTrigger id="targetAudience" className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {AUDIENCES.map((a) => (
                                <SelectItem key={a} value={a}>{a.replace("_", " ")}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="announcement-committeeId">Restrict to committee</Label>
                          <Select
                            name="committeeId" items={committeeItems}
                            defaultValue={editingAnnouncement?.committee_id ? String(editingAnnouncement.committee_id) : "none"}
                          >
                            <SelectTrigger id="announcement-committeeId" className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Entire conference</SelectItem>
                              {committees.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="announcement-status">Status</Label>
                          <Select
                            name="status"
                            items={{ draft: "Draft", scheduled: "Scheduled", published: "Published" }}
                            defaultValue={editingAnnouncement?.status || "draft"}
                          >
                            <SelectTrigger id="announcement-status" className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="publishDate">Publish at (if scheduled)</Label>
                          <Input
                            id="publishDate" name="publishDate" type="datetime-local"
                            defaultValue={editingAnnouncement?.publish_date?.slice(0, 16)}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save announcement"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : announcements.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <Megaphone className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No announcements yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reads</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {announcements.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {a.committee_name || a.target_audience.replace("_", " ")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={a.priority === "urgent" ? "destructive" : "outline"}>{a.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={a.status === "published" ? "default" : "outline"}>{a.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.read_count ?? 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="xs" variant="ghost"
                              onClick={() => {
                                setEditingAnnouncement(a);
                                setAnnouncementDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button size="xs" variant="ghost" onClick={() => handleDeleteAnnouncement(a)}>Delete</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Resources ---------------- */}
        <TabsContent value="resources" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Resources</CardTitle>
                <CardDescription>Background guides, handbooks, and other conference files.</CardDescription>
              </div>
              <Dialog
                open={resourceDialogOpen}
                onOpenChange={(open) => {
                  setResourceDialogOpen(open);
                  if (!open) setEditingResource(null);
                }}
              >
                <DialogTrigger render={<Button size="sm" onClick={() => setEditingResource(null)} />}>
                  <Plus className="mr-1 h-4 w-4" /> Upload resource
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleSaveResource}>
                    <DialogHeader>
                      <DialogTitle>{editingResource ? "Edit resource" : "Upload a resource"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="resource-title">Title</Label>
                        <Input id="resource-title" name="title" required defaultValue={editingResource?.title} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="resource-category">Category</Label>
                          <Select
                            name="category"
                            items={Object.fromEntries(RESOURCE_CATEGORIES.map((c) => [c, c.replace(/_/g, " ")]))}
                            defaultValue={editingResource?.category || "other"}
                          >
                            <SelectTrigger id="resource-category" className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {RESOURCE_CATEGORIES.map((c) => (
                                <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tags">Tags (comma separated)</Label>
                          <Input id="tags" name="tags" defaultValue={editingResource?.tags || ""} placeholder="crisis, unsc" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" rows={2} defaultValue={editingResource?.description || ""} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="resource-committeeId">Restrict to committee</Label>
                          <Select
                            name="committeeId" items={committeeItems}
                            defaultValue={editingResource?.committee_id ? String(editingResource.committee_id) : "none"}
                          >
                            <SelectTrigger id="resource-committeeId" className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Entire conference</SelectItem>
                              {committees.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="visibility">Visibility</Label>
                          <Select
                            name="visibility"
                            items={{ all: "All delegates", assigned: "Assigned only", organizers: "Organizers only" }}
                            defaultValue={editingResource?.visibility || "all"}
                          >
                            <SelectTrigger id="visibility" className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All delegates</SelectItem>
                              <SelectItem value="assigned">Assigned only</SelectItem>
                              <SelectItem value="organizers">Organizers only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="resource-status">Status</Label>
                        <Select name="status" items={{ draft: "Draft", published: "Published" }} defaultValue={editingResource?.status || "draft"}>
                          <SelectTrigger id="resource-status" className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {!editingResource && (
                        <div className="space-y-2">
                          <Label htmlFor="file">File</Label>
                          <Input id="file" name="file" type="file" required />
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save resource"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : resources.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No resources yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>v.</TableHead>
                      <TableHead>Downloads</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resources.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.category.replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.tags || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">v{r.version}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.download_count}</TableCell>
                        <TableCell>
                          <Badge variant={r.status === "published" ? "default" : "outline"}>{r.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="xs" variant="ghost" onClick={() => handleDownloadResource(r)} disabled={!r.file_path}>
                              <Download className="mr-1 h-3.5 w-3.5" /> Download
                            </Button>
                            <Button size="xs" variant="ghost" onClick={() => openVersions(r)}>
                              <History className="mr-1 h-3.5 w-3.5" /> Versions
                            </Button>
                            <Button
                              size="xs" variant="ghost"
                              onClick={() => {
                                setEditingResource(r);
                                setResourceDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button size="xs" variant="ghost" onClick={() => handleDeleteResource(r)}>Delete</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Dialog open={Boolean(versionsResource)} onOpenChange={(open) => !open && setVersionsResource(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Versions — {versionsResource?.title}</DialogTitle>
                <DialogDescription>Upload a new version to replace the current file.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUploadVersion} className="flex items-end gap-2 py-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="versionFile">New file</Label>
                  <Input id="versionFile" name="file" type="file" required />
                </div>
                <Button type="submit" size="sm" disabled={submitting}>
                  <Upload className="mr-1 h-3.5 w-3.5" /> Upload
                </Button>
              </form>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                    <span>Version {v.version}</span>
                    <a href={resolveFileUrl(v.file_path)} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      <Download className="mr-1 inline h-3.5 w-3.5" /> Download
                    </a>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ---------------- FAQs ---------------- */}
        <TabsContent value="faqs" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Answer delegate questions and publish them for everyone to see.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : faqs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <HelpCircle className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No questions yet.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {faqs.map((f) => (
                    <div key={f.id} className="flex items-start justify-between gap-4 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={f.status === "pending" ? "destructive" : f.status === "published" ? "default" : "outline"}>
                            {f.status}
                          </Badge>
                          <Badge variant="outline">{f.category}</Badge>
                          {Boolean(f.is_pinned) && <Pin className="h-3.5 w-3.5 text-muted-foreground" />}
                        </div>
                        <p className="mt-1.5 font-medium">{f.question}</p>
                        {f.asked_by_name && <p className="text-xs text-muted-foreground">Asked by {f.asked_by_name}</p>}
                        {f.answer && <p className="mt-1 text-sm text-muted-foreground">{f.answer}</p>}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button size="xs" variant="ghost" onClick={() => setAnswerFaq(f)}>
                          {f.answer ? "Edit answer" : "Answer"}
                        </Button>
                        <Button size="xs" variant="ghost" onClick={() => handleTogglePin(f)}>
                          {f.is_pinned ? "Unpin" : "Pin"}
                        </Button>
                        <Button size="xs" variant="ghost" onClick={() => handleDeleteFaq(f)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={Boolean(answerFaq)} onOpenChange={(open) => !open && setAnswerFaq(null)}>
            <DialogContent>
              <form onSubmit={handleAnswerFaq}>
                <DialogHeader>
                  <DialogTitle>Answer question</DialogTitle>
                  <DialogDescription>{answerFaq?.question}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="answer">Answer</Label>
                    <Textarea id="answer" name="answer" rows={4} required defaultValue={answerFaq?.answer || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="faq-status">Visibility</Label>
                    <Select name="status" items={{ answered: "Answered (private)", published: "Published (public)" }} defaultValue="published">
                      <SelectTrigger id="faq-status" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="answered">Answered (private to this delegate)</SelectItem>
                        <SelectItem value="published">Published (visible to everyone)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save answer"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ---------------- Email Broadcasts ---------------- */}
        <TabsContent value="broadcasts" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Email Broadcasts</CardTitle>
                <CardDescription>
                  Mass emails to delegates. Sends are logged server-side until real SMTP credentials are configured.
                </CardDescription>
              </div>
              <Dialog open={broadcastDialogOpen} onOpenChange={setBroadcastDialogOpen}>
                <DialogTrigger render={<Button size="sm" />}>
                  <Plus className="mr-1 h-4 w-4" /> New broadcast
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateBroadcast}>
                    <DialogHeader>
                      <DialogTitle>New email broadcast</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="broadcast-subject">Subject</Label>
                        <Input id="broadcast-subject" name="subject" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="broadcast-body">Body (HTML)</Label>
                        <Textarea id="broadcast-body" name="body" rows={5} required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="broadcast-audience">Audience</Label>
                          <Select name="audience" items={Object.fromEntries(BROADCAST_AUDIENCES.map((a) => [a, a]))} defaultValue="approved">
                            <SelectTrigger id="broadcast-audience" className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {BROADCAST_AUDIENCES.map((a) => (
                                <SelectItem key={a} value={a}>{a}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="broadcast-committeeId">Committee (if audience = committee)</Label>
                          <Select name="committeeId" items={Object.fromEntries(committees.map((c) => [String(c.id), c.name]))}>
                            <SelectTrigger id="broadcast-committeeId" className="w-full"><SelectValue placeholder="Select committee" /></SelectTrigger>
                            <SelectContent>
                              {committees.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create as draft"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : broadcasts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <Mail className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No broadcasts yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Delivered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {broadcasts.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.subject}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{b.audience}</TableCell>
                        <TableCell>
                          <Badge variant={b.status === "sent" ? "default" : "outline"}>{b.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {b.sent_count}/{b.recipient_count}{b.failed_count > 0 ? ` (${b.failed_count} failed)` : ""}
                        </TableCell>
                        <TableCell className="text-right">
                          {b.status !== "sent" && (
                            <Button size="xs" variant="ghost" onClick={() => handleSendBroadcast(b)}>
                              <Send className="mr-1 h-3.5 w-3.5" /> Send
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Email templates</CardTitle>
                <CardDescription>Reusable across every conference in your organization.</CardDescription>
              </div>
              <Dialog
                open={templateDialogOpen}
                onOpenChange={(open) => {
                  setTemplateDialogOpen(open);
                  if (!open) setEditingTemplate(null);
                }}
              >
                <DialogTrigger render={<Button size="sm" variant="outline" onClick={() => setEditingTemplate(null)} />}>
                  <Plus className="mr-1 h-4 w-4" /> New template
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleSaveTemplate}>
                    <DialogHeader>
                      <DialogTitle>{editingTemplate ? "Edit template" : "New email template"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="template-name">Name</Label>
                        <Input id="template-name" name="name" required defaultValue={editingTemplate?.name} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="template-subject">Subject</Label>
                        <Input id="template-subject" name="subject" required defaultValue={editingTemplate?.subject} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="template-body">Body (HTML)</Label>
                        <Textarea id="template-body" name="body" rows={5} required defaultValue={editingTemplate?.body} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save template"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No templates yet.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {templates.map((t) => (
                    <Card key={t.id}>
                      <CardContent className="space-y-1 p-4">
                        <p className="font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.subject}</p>
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="xs" variant="ghost"
                            onClick={() => {
                              setEditingTemplate(t);
                              setTemplateDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => handleDeleteTemplate(t)}>Delete</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
