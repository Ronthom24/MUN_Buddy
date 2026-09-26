"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Clock, ClipboardCheck, TriangleAlert, Users, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiRequestError } from "@/lib/api";
import type { Committee, Delegate, DelegateStatus, Portfolio, RegistrationAnalytics } from "@/lib/types";

const STATUS_OPTIONS: { value: DelegateStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

const STATUS_VARIANT: Record<DelegateStatus, "secondary" | "default" | "outline" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  waitlisted: "outline",
  rejected: "destructive",
  withdrawn: "outline",
};

export default function RegistrationsPage() {
  const params = useParams<{ id: string }>();
  const conferenceId = params.id;

  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [analytics, setAnalytics] = useState<RegistrationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const [committees, setCommittees] = useState<Committee[]>([]);
  const [portfoliosByCommittee, setPortfoliosByCommittee] = useState<Record<number, Portfolio[]>>({});
  const [assignTarget, setAssignTarget] = useState<Delegate | null>(null);
  const [assignCommitteeId, setAssignCommitteeId] = useState<number | undefined>();
  const [assignPortfolioId, setAssignPortfolioId] = useState<number | undefined>();
  const [publishNow, setPublishNow] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (statusFilter !== "all") query.set("status", statusFilter);
      if (search) query.set("search", search);

      const [delegatesRes, analyticsRes, committeesRes] = await Promise.all([
        api.get<{ success: true; delegates: Delegate[] }>(`/conferences/${conferenceId}/delegates?${query}`),
        api.get<{ success: true; analytics: RegistrationAnalytics }>(`/conferences/${conferenceId}/registrations/analytics`),
        api.get<{ success: true; committees: Committee[] }>(`/conferences/${conferenceId}/committees`),
      ]);
      setDelegates(delegatesRes.delegates);
      setAnalytics(analyticsRes.analytics);
      setSelected(new Set());
      setCommittees(committeesRes.committees);

      const portfolioLists = await Promise.all(
        committeesRes.committees.map((c) =>
          api.get<{ success: true; portfolios: Portfolio[] }>(`/committees/${c.id}/portfolios`).then((r) => [c.id, r.portfolios] as const)
        )
      );
      setPortfoliosByCommittee(Object.fromEntries(portfolioLists));
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Failed to load registrations";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [conferenceId, statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  function openAssignDialog(delegate: Delegate) {
    setAssignTarget(delegate);
    setAssignCommitteeId(delegate.preferred_committee_id ?? undefined);
    setAssignPortfolioId(delegate.preferred_portfolio_id ?? undefined);
    setPublishNow(true);
  }

  async function confirmAssignment() {
    if (!assignTarget || !assignCommitteeId) {
      toast.error("Select a committee first");
      return;
    }
    setConfirming(true);
    try {
      await api.put(`/conferences/${conferenceId}/assignments/${assignTarget.id}`, {
        committeeId: assignCommitteeId,
        portfolioId: assignPortfolioId,
        publish: publishNow,
      });
      toast.success(
        publishNow
          ? `${assignTarget.full_name}'s committee/portfolio is confirmed and now visible to them`
          : `${assignTarget.full_name} assigned (not yet published)`
      );
      setAssignTarget(null);
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not confirm assignment";
      toast.error(message);
    } finally {
      setConfirming(false);
    }
  }

  function toggleSelected(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === delegates.length ? new Set() : new Set(delegates.map((d) => d.id))));
  }

  async function applyStatus(status: DelegateStatus, ids: number[]) {
    if (ids.length === 0) return;
    setBulkSubmitting(true);
    try {
      const res = await api.patch<{ success: true; delegates: Delegate[]; skippedForPayment?: number[] }>(
        `/conferences/${conferenceId}/delegates/bulk-status`,
        { delegateIds: ids, status }
      );
      const skipped = res.skippedForPayment?.length ?? 0;
      const updated = ids.length - skipped;
      if (updated > 0) toast.success(`${updated} delegate${updated > 1 ? "s" : ""} marked ${status}`);
      if (skipped > 0) {
        toast.warning(`${skipped} delegate${skipped > 1 ? "s" : ""} not approved — payment not yet verified`);
      }
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not update status";
      toast.error(message);
    } finally {
      setBulkSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users className="h-4 w-4" />} label="Total applications" value={analytics?.totalApplications} loading={loading} />
        <StatCard icon={<Clock className="h-4 w-4" />} label="Pending" value={analytics?.byStatus.pending} loading={loading} />
        <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Approved" value={analytics?.byStatus.approved} loading={loading} />
        <StatCard icon={<XCircle className="h-4 w-4" />} label="Rejected" value={analytics?.byStatus.rejected} loading={loading} />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0">
          <div>
            <CardTitle>Registrations</CardTitle>
            <CardDescription>Review, approve, waitlist, or reject delegate applications.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search name, email, school..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-52"
            />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "all")}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {selected.size > 0 && (
            <div className="mb-4 flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <span className="font-medium">{selected.size} selected</span>
              <div className="ml-auto flex gap-2">
                <Button size="sm" disabled={bulkSubmitting} onClick={() => applyStatus("approved", [...selected])}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" disabled={bulkSubmitting} onClick={() => applyStatus("waitlisted", [...selected])}>
                  Waitlist
                </Button>
                <Button size="sm" variant="destructive" disabled={bulkSubmitting} onClick={() => applyStatus("rejected", [...selected])}>
                  Reject
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-2 py-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : delegates.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No registrations match these filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selected.size === delegates.length && delegates.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Delegate</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {delegates.map((delegate) => (
                  <TableRow key={delegate.id}>
                    <TableCell>
                      <Checkbox checked={selected.has(delegate.id)} onCheckedChange={() => toggleSelected(delegate.id)} />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {delegate.full_name}
                        {delegate.possibleDuplicate && (
                          <span title="Possible duplicate registration (matching email, phone, or name)">
                            <TriangleAlert className="ml-1.5 inline h-3.5 w-3.5 text-amber-500" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{delegate.email}</div>
                      {delegate.preferred_committee_name && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Prefers: {delegate.preferred_committee_name}
                          {delegate.preferred_portfolio_name ? ` (${delegate.preferred_portfolio_name})` : ""}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{delegate.school || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{delegate.mun_experience}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[delegate.status]}>{delegate.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {delegate.status !== "approved" && (
                          <Button size="xs" variant="ghost" onClick={() => applyStatus("approved", [delegate.id])}>
                            Approve
                          </Button>
                        )}
                        {delegate.status !== "waitlisted" && (
                          <Button size="xs" variant="ghost" onClick={() => applyStatus("waitlisted", [delegate.id])}>
                            Waitlist
                          </Button>
                        )}
                        {delegate.status !== "rejected" && (
                          <Button size="xs" variant="ghost" onClick={() => applyStatus("rejected", [delegate.id])}>
                            Reject
                          </Button>
                        )}
                        {delegate.status === "approved" && (
                          <Button size="xs" variant="outline" onClick={() => openAssignDialog(delegate)}>
                            <ClipboardCheck className="mr-1 h-3.5 w-3.5" /> Confirm committee
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {analytics && analytics.institutionDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Institution distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {analytics.institutionDistribution.map((row) => (
              <Badge key={row.school} variant="outline">
                {row.school}: {row.count}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={assignTarget !== null} onOpenChange={(open) => !open && setAssignTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm committee &amp; portfolio</DialogTitle>
          </DialogHeader>
          {assignTarget && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {assignTarget.full_name}
                {assignTarget.preferred_committee_name && (
                  <> — preferred {assignTarget.preferred_committee_name}
                    {assignTarget.preferred_portfolio_name ? ` (${assignTarget.preferred_portfolio_name})` : ""}
                  </>
                )}
              </p>
              <div className="space-y-2">
                <Label>Committee</Label>
                <Select
                  items={Object.fromEntries(committees.map((c) => [String(c.id), c.name]))}
                  value={assignCommitteeId ? String(assignCommitteeId) : ""}
                  onValueChange={(value) => {
                    setAssignCommitteeId(value ? Number(value) : undefined);
                    setAssignPortfolioId(undefined);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select committee" />
                  </SelectTrigger>
                  <SelectContent>
                    {committees.map((committee) => (
                      <SelectItem key={committee.id} value={String(committee.id)}>
                        {committee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Portfolio</Label>
                <Select
                  items={Object.fromEntries(
                    (assignCommitteeId ? portfoliosByCommittee[assignCommitteeId] || [] : []).map((p) => [
                      String(p.id),
                      p.name + (p.status === "assigned" && p.id !== assignPortfolioId ? " (taken)" : ""),
                    ])
                  )}
                  value={assignPortfolioId ? String(assignPortfolioId) : ""}
                  onValueChange={(value) => setAssignPortfolioId(value ? Number(value) : undefined)}
                  disabled={!assignCommitteeId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select portfolio (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {(assignCommitteeId ? portfoliosByCommittee[assignCommitteeId] || [] : []).map((portfolio) => (
                      <SelectItem key={portfolio.id} value={String(portfolio.id)}>
                        {portfolio.name}
                        {portfolio.status === "assigned" && portfolio.id !== assignPortfolioId ? " (taken)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={publishNow} onCheckedChange={(checked) => setPublishNow(checked === true)} />
                Show this to the delegate immediately
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTarget(null)}>
              Cancel
            </Button>
            <Button onClick={confirmAssignment} disabled={confirming || !assignCommitteeId}>
              {confirming ? "Confirming..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
