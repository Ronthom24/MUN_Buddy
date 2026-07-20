"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Award as AwardIcon, CheckCircle2, Download, FileCheck2, Plus, ShieldCheck, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api, ApiRequestError } from "@/lib/api";
import { openBlob } from "@/lib/utils";
import type {
  AssignmentRow,
  Award,
  Certificate,
  CertificateStats,
  CertificateTemplate,
  CertificateType,
  Conference,
  Delegate,
} from "@/lib/types";

const AWARD_SUGGESTIONS = [
  "Best Delegate", "Outstanding Delegate", "Honourable Mention", "Special Mention", "Verbal Mention",
  "Best Position Paper", "Best Delegation", "Best First-Time Delegate", "Chair's Award",
];

const CERT_TYPE_OPTIONS: { value: CertificateType; label: string }[] = [
  { value: "participation", label: "Participation" },
  { value: "award", label: "Award" },
  { value: "workshop_participation", label: "Workshop participation" },
  { value: "custom", label: "Custom" },
];

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const conferenceId = params.id;

  const [conference, setConference] = useState<Conference | null>(null);
  const [awards, setAwards] = useState<Award[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [certStats, setCertStats] = useState<CertificateStats | null>(null);
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const [awardDialogOpen, setAwardDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [selectedDelegateIds, setSelectedDelegateIds] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Select.Root needs an `items` value->label map, or its closed trigger displays the raw
  // value instead of the item's rendered label (Base UI resolves the label from `items`,
  // not from the mounted-then-unmounted SelectItem children).
  const delegateSelectItems = useMemo(
    () => Object.fromEntries(delegates.map((d) => [String(d.id), `${d.full_name} (${d.email})`])),
    [delegates]
  );
  const templateSelectItems = useMemo(
    () => Object.fromEntries(templates.filter((t) => t.status === "active").map((t) => [String(t.id), t.name])),
    [templates]
  );
  const certTypeSelectItems = useMemo(
    () => Object.fromEntries(CERT_TYPE_OPTIONS.map((t) => [t.value, t.label])),
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [conferenceRes, awardsRes, templatesRes, certificatesRes, statsRes, delegatesRes, assignmentsRes] = await Promise.all([
        api.get<{ success: true; conference: Conference }>(`/conferences/${conferenceId}`),
        api.get<{ success: true; awards: Award[] }>(`/conferences/${conferenceId}/awards`),
        api.get<{ success: true; templates: CertificateTemplate[] }>(`/conferences/${conferenceId}/certificate-templates`),
        api.get<{ success: true; certificates: Certificate[] }>(`/conferences/${conferenceId}/certificates`),
        api.get<{ success: true; stats: CertificateStats }>(`/conferences/${conferenceId}/certificates/stats`),
        api.get<{ success: true; delegates: Delegate[] }>(`/conferences/${conferenceId}/delegates?status=approved`),
        api.get<{ success: true; assignments: AssignmentRow[] }>(`/conferences/${conferenceId}/assignments`),
      ]);
      setConference(conferenceRes.conference);
      setAwards(awardsRes.awards);
      setTemplates(templatesRes.templates);
      setCertificates(certificatesRes.certificates);
      setCertStats(statsRes.stats);
      setDelegates(delegatesRes.delegates);
      setAssignments(assignmentsRes.assignments);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load results data");
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePublish() {
    setPublishing(true);
    try {
      const res = await api.post<{ success: true; conference: Conference }>(`/conferences/${conferenceId}/results/publish`);
      setConference(res.conference);
      toast.success("Results published — delegates can now see them");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not publish results");
    } finally {
      setPublishing(false);
    }
  }

  async function handleCreateAward(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const delegateId = Number(form.get("delegateId"));
    const assignment = assignments.find((a) => a.delegate_id === delegateId);
    setSubmitting(true);
    try {
      await api.post(`/conferences/${conferenceId}/awards`, {
        delegateId,
        category: form.get("category"),
        citation: form.get("citation") || undefined,
        committeeId: assignment?.committee_id ?? undefined,
        portfolioId: assignment?.portfolio_id ?? undefined,
      });
      toast.success("Award recorded");
      setAwardDialogOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not record award");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveAward(award: Award) {
    try {
      await api.delete(`/conferences/${conferenceId}/awards/${award.id}`);
      toast.success("Award removed");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not remove award");
    }
  }

  async function handleSaveTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      certificateType: form.get("certificateType"),
      title: form.get("title"),
      bodyText: form.get("bodyText"),
      signatoryName: form.get("signatoryName") || undefined,
      signatoryTitle: form.get("signatoryTitle") || undefined,
      accentColor: form.get("accentColor") || undefined,
    };
    setSubmitting(true);
    try {
      if (editingTemplate) {
        await api.put(`/organizations/${conference!.organization_id}/certificate-templates/${editingTemplate.id}`, payload);
        toast.success("Template updated");
      } else {
        await api.post(`/organizations/${conference!.organization_id}/certificate-templates`, payload);
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

  async function handleArchiveTemplate(template: CertificateTemplate) {
    try {
      await api.delete(`/organizations/${conference!.organization_id}/certificate-templates/${template.id}`);
      toast.success(`${template.name} archived`);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not archive template");
    }
  }

  function toggleDelegateSelected(id: number) {
    setSelectedDelegateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleIssueCertificates(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedDelegateIds.size === 0) {
      toast.error("Select at least one delegate");
      return;
    }
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      const res = await api.post<{ success: true; issued: Certificate[]; failed: { delegateId: number; reason: string }[] }>(
        `/conferences/${conferenceId}/certificates/bulk`,
        {
          delegateIds: [...selectedDelegateIds],
          templateId: Number(form.get("templateId")),
          certificateType: form.get("certificateType") || undefined,
        }
      );
      if (res.issued.length > 0) toast.success(`${res.issued.length} certificate${res.issued.length > 1 ? "s" : ""} issued`);
      if (res.failed.length > 0) toast.warning(`${res.failed.length} could not be issued`);
      setIssueDialogOpen(false);
      setSelectedDelegateIds(new Set());
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not issue certificates");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleViewCertificate(certificate: Certificate) {
    const win = window.open("", "_blank", "noopener,noreferrer");
    try {
      const blob = await api.getBlob(`/certificates/${certificate.id}/pdf`);
      openBlob(blob, win);
    } catch (err) {
      win?.close();
      toast.error(err instanceof ApiRequestError ? err.message : "Could not open certificate");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="text-sm text-muted-foreground">Results visibility</p>
            <div className="mt-1">
              <Badge variant={conference?.results_published ? "default" : "outline"}>
                {conference?.results_published ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {conference?.results_published
                ? "Delegates can see the full results and their own awards."
                : "Results stay private to organizers until you publish them."}
            </p>
          </div>
          {!conference?.results_published && (
            <Button onClick={handlePublish} disabled={publishing || loading}>
              <CheckCircle2 className="mr-1 h-4 w-4" /> {publishing ? "Publishing..." : "Publish results"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="awards">
        <TabsList>
          <TabsTrigger value="awards">Awards</TabsTrigger>
          <TabsTrigger value="templates">Certificate templates</TabsTrigger>
          <TabsTrigger value="certificates">Issued certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="awards" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Awards</CardTitle>
                <CardDescription>Best Delegate, Outstanding Delegate, and other recognitions.</CardDescription>
              </div>
              <Dialog open={awardDialogOpen} onOpenChange={setAwardDialogOpen}>
                <DialogTrigger render={<Button size="sm" />}>
                  <Plus className="mr-1 h-4 w-4" /> Add award
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateAward}>
                    <DialogHeader>
                      <DialogTitle>Record an award</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="delegateId">Delegate</Label>
                        <Select name="delegateId" items={delegateSelectItems}>
                          <SelectTrigger id="delegateId" className="w-full">
                            <SelectValue placeholder="Select a delegate" />
                          </SelectTrigger>
                          <SelectContent>
                            {delegates.map((d) => (
                              <SelectItem key={d.id} value={String(d.id)}>
                                {d.full_name} ({d.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" name="category" required list="award-suggestions" placeholder="Best Delegate" />
                        <datalist id="award-suggestions">
                          {AWARD_SUGGESTIONS.map((s) => (
                            <option key={s} value={s} />
                          ))}
                        </datalist>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="citation">Citation (optional)</Label>
                        <Textarea id="citation" name="citation" rows={2} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? "Saving..." : "Record award"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : awards.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <Trophy className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No awards recorded yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Delegate</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Committee</TableHead>
                      <TableHead>Citation</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {awards.map((award) => (
                      <TableRow key={award.id}>
                        <TableCell className="font-medium">{award.delegate_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <AwardIcon className="mr-1 h-3 w-3" /> {award.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {award.committee_name || "—"}
                          {award.portfolio_name ? ` · ${award.portfolio_name}` : ""}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{award.citation || "—"}</TableCell>
                        <TableCell className="text-right">
                          {!conference?.results_published && (
                            <Button size="xs" variant="ghost" onClick={() => handleRemoveAward(award)}>
                              Remove
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
        </TabsContent>

        <TabsContent value="templates" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Certificate templates</CardTitle>
                <CardDescription>Reusable across every conference in your organization.</CardDescription>
              </div>
              <Dialog
                open={templateDialogOpen}
                onOpenChange={(open) => {
                  setTemplateDialogOpen(open);
                  if (!open) setEditingTemplate(null);
                }}
              >
                <DialogTrigger render={<Button size="sm" onClick={() => setEditingTemplate(null)} />}>
                  <Plus className="mr-1 h-4 w-4" /> New template
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleSaveTemplate}>
                    <DialogHeader>
                      <DialogTitle>{editingTemplate ? "Edit template" : "New certificate template"}</DialogTitle>
                      <DialogDescription>
                        Use {"{{delegateName}}"}, {"{{conferenceName}}"}, {"{{committee}}"}, {"{{portfolio}}"}, {"{{awardCategory}}"} in the body text.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Internal name</Label>
                          <Input id="name" name="name" required defaultValue={editingTemplate?.name} placeholder="Delegate Participation" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="template-certificateType">Type</Label>
                          <Select
                            name="certificateType" items={certTypeSelectItems}
                            defaultValue={editingTemplate?.certificate_type || "participation"}
                          >
                            <SelectTrigger id="template-certificateType" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CERT_TYPE_OPTIONS.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title">Certificate title</Label>
                        <Input
                          id="title" name="title" required defaultValue={editingTemplate?.title}
                          placeholder="Certificate of Participation"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bodyText">Body text</Label>
                        <Textarea
                          id="bodyText" name="bodyText" rows={3} required defaultValue={editingTemplate?.body_text}
                          placeholder="has actively participated in {{conferenceName}} as a delegate."
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="signatoryName">Signatory name</Label>
                          <Input id="signatoryName" name="signatoryName" defaultValue={editingTemplate?.signatory_name ?? ""} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signatoryTitle">Signatory title</Label>
                          <Input id="signatoryTitle" name="signatoryTitle" defaultValue={editingTemplate?.signatory_title ?? ""} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accentColor">Accent color</Label>
                          <Input
                            id="accentColor" name="accentColor" type="color" className="h-9 p-1"
                            defaultValue={editingTemplate?.accent_color || "#1f2937"}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? "Saving..." : "Save template"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : templates.filter((t) => t.status === "active").length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No templates yet. Create one to start issuing certificates.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {templates.filter((t) => t.status === "active").map((template) => (
                    <Card key={template.id}>
                      <CardContent className="space-y-2 p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{template.name}</p>
                            <p className="text-xs text-muted-foreground">{template.title}</p>
                          </div>
                          <Badge variant="outline">{template.certificate_type.replace("_", " ")}</Badge>
                        </div>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{template.body_text}</p>
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="xs" variant="ghost"
                            onClick={() => {
                              setEditingTemplate(template);
                              setTemplateDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => handleArchiveTemplate(template)}>
                            Archive
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={<FileCheck2 className="h-4 w-4" />} label="Certificates issued" value={certStats?.totalCertificates} loading={loading} />
            <StatCard icon={<Download className="h-4 w-4" />} label="Delegates who downloaded" value={certStats?.downloadedCount} loading={loading} />
            <StatCard icon={<Download className="h-4 w-4" />} label="Total downloads" value={certStats?.totalDownloads} loading={loading} />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Issued certificates</CardTitle>
                <CardDescription>Individually or in bulk, by template.</CardDescription>
              </div>
              <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
                <DialogTrigger render={<Button size="sm" disabled={templates.length === 0} />}>
                  <Plus className="mr-1 h-4 w-4" /> Issue certificates
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleIssueCertificates}>
                    <DialogHeader>
                      <DialogTitle>Issue certificates</DialogTitle>
                      <DialogDescription>Select delegates and a template. Certificates are generated instantly.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="templateId">Template</Label>
                          <Select name="templateId" items={templateSelectItems}>
                            <SelectTrigger id="templateId" className="w-full">
                              <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                            <SelectContent>
                              {templates.filter((t) => t.status === "active").map((t) => (
                                <SelectItem key={t.id} value={String(t.id)}>
                                  {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="issue-certificateType">Type override</Label>
                          <Select name="certificateType" items={certTypeSelectItems}>
                            <SelectTrigger id="issue-certificateType" className="w-full">
                              <SelectValue placeholder="Use template's type" />
                            </SelectTrigger>
                            <SelectContent>
                              {CERT_TYPE_OPTIONS.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Delegates ({selectedDelegateIds.size} selected)</Label>
                          <Button
                            type="button" size="xs" variant="ghost"
                            onClick={() => setSelectedDelegateIds(new Set(delegates.map((d) => d.id)))}
                          >
                            Select all approved
                          </Button>
                        </div>
                        <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
                          {delegates.map((d) => (
                            <label key={d.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted/60">
                              <Checkbox
                                checked={selectedDelegateIds.has(d.id)}
                                onCheckedChange={() => toggleDelegateSelected(d.id)}
                              />
                              {d.full_name}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? "Issuing..." : "Issue certificates"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : certificates.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No certificates issued yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Delegate</TableHead>
                      <TableHead>Certificate No.</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Downloads</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.map((certificate) => (
                      <TableRow key={certificate.id}>
                        <TableCell>
                          <div className="font-medium">{certificate.delegate_name}</div>
                          <div className="text-xs text-muted-foreground">{certificate.delegate_email}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{certificate.certificate_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{certificate.certificate_type.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{certificate.download_count}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="xs" variant="ghost" onClick={() => handleViewCertificate(certificate)}>
                              <Download className="mr-1 h-3.5 w-3.5" /> View PDF
                            </Button>
                            <Button
                              size="xs" variant="ghost" nativeButton={false}
                              render={<Link href={`/verify/${encodeURIComponent(certificate.certificate_number)}`} target="_blank" />}
                            >
                              <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Verify
                            </Button>
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
      </Tabs>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="mt-1 h-7 w-10" /> : <p className="text-2xl font-semibold">{value ?? 0}</p>}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>
      </CardContent>
    </Card>
  );
}
