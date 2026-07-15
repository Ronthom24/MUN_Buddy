"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Send, UserX, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { api, ApiRequestError } from "@/lib/api";
import type { AssignmentAnalytics, AssignmentRow, Committee, Portfolio } from "@/lib/types";

export default function AssignmentsPage() {
  const params = useParams<{ id: string }>();
  const conferenceId = params.id;

  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [portfoliosByCommittee, setPortfoliosByCommittee] = useState<Record<number, Portfolio[]>>({});
  const [analytics, setAnalytics] = useState<AssignmentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [draftSelection, setDraftSelection] = useState<Record<number, { committeeId?: number; portfolioId?: number }>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [assignmentsRes, committeesRes, analyticsRes] = await Promise.all([
        api.get<{ success: true; assignments: AssignmentRow[] }>(`/conferences/${conferenceId}/assignments`),
        api.get<{ success: true; committees: Committee[] }>(`/conferences/${conferenceId}/committees`),
        api.get<{ success: true; analytics: AssignmentAnalytics }>(`/conferences/${conferenceId}/assignments/analytics`),
      ]);
      setAssignments(assignmentsRes.assignments);
      setCommittees(committeesRes.committees);
      setAnalytics(analyticsRes.analytics);

      const portfolioLists = await Promise.all(
        committeesRes.committees.map((c) =>
          api.get<{ success: true; portfolios: Portfolio[] }>(`/committees/${c.id}/portfolios`).then((r) => [c.id, r.portfolios] as const)
        )
      );
      setPortfoliosByCommittee(Object.fromEntries(portfolioLists));
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Failed to load assignments";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    load();
  }, [load]);

  function setDraft(delegateId: number, patch: { committeeId?: number; portfolioId?: number }) {
    setDraftSelection((prev) => ({ ...prev, [delegateId]: { ...prev[delegateId], ...patch } }));
  }

  async function saveAssignment(row: AssignmentRow) {
    const draft = draftSelection[row.delegate_id] || {};
    const committeeId = draft.committeeId ?? row.committee_id ?? undefined;
    const portfolioId = draft.portfolioId ?? row.portfolio_id ?? undefined;

    if (!committeeId) {
      toast.error("Select a committee first");
      return;
    }

    setSavingId(row.delegate_id);
    try {
      await api.put(`/conferences/${conferenceId}/assignments/${row.delegate_id}`, { committeeId, portfolioId });
      toast.success(`${row.delegate_name} assigned`);
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not assign delegate";
      toast.error(message);
    } finally {
      setSavingId(null);
    }
  }

  async function unassign(row: AssignmentRow) {
    setSavingId(row.delegate_id);
    try {
      await api.delete(`/conferences/${conferenceId}/assignments/${row.delegate_id}`);
      toast.success(`${row.delegate_name} unassigned`);
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not unassign delegate";
      toast.error(message);
    } finally {
      setSavingId(null);
    }
  }

  async function publishAll() {
    setPublishing(true);
    try {
      await api.post(`/conferences/${conferenceId}/assignments/publish`);
      toast.success("Assignments published to delegates");
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not publish assignments";
      toast.error(message);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Approved delegates</p>
            {loading ? <Skeleton className="mt-1 h-7 w-10" /> : <p className="text-2xl font-semibold">{analytics?.totalApproved ?? 0}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Assigned</p>
            {loading ? <Skeleton className="mt-1 h-7 w-10" /> : <p className="text-2xl font-semibold">{analytics?.assignedCount ?? 0}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Unassigned</p>
            {loading ? <Skeleton className="mt-1 h-7 w-10" /> : <p className="text-2xl font-semibold">{analytics?.unassignedCount ?? 0}</p>}
          </CardContent>
        </Card>
      </div>

      {analytics && analytics.committeeFillRate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="h-4 w-4" /> Committee occupancy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.committeeFillRate.map((row) => (
              <div key={row.committeeId} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{row.committeeName}</span>
                  <span className="text-muted-foreground">
                    {row.assigned}
                    {row.capacity ? ` / ${row.capacity}` : ""}
                  </span>
                </div>
                <Progress value={row.fillRate ? row.fillRate * 100 : 0} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Assignments</CardTitle>
            <CardDescription>Assign approved delegates to a committee and portfolio.</CardDescription>
          </div>
          <Button onClick={publishAll} disabled={publishing || loading}>
            <Send className="mr-1 h-4 w-4" /> {publishing ? "Publishing..." : "Publish assignments"}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2 py-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No approved delegates yet. Approve applications on the Registrations tab first.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delegate</TableHead>
                  <TableHead>Committee</TableHead>
                  <TableHead>Portfolio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((row) => {
                  const draft = draftSelection[row.delegate_id] || {};
                  const selectedCommitteeId = draft.committeeId ?? row.committee_id ?? undefined;
                  const portfolioOptions = selectedCommitteeId ? portfoliosByCommittee[selectedCommitteeId] || [] : [];

                  return (
                    <TableRow key={row.delegate_id}>
                      <TableCell>
                        <div className="font-medium">{row.delegate_name}</div>
                        <div className="text-xs text-muted-foreground">{row.delegate_school || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={selectedCommitteeId ? String(selectedCommitteeId) : ""}
                          onValueChange={(value) => setDraft(row.delegate_id, { committeeId: value ? Number(value) : undefined, portfolioId: undefined })}
                        >
                          <SelectTrigger className="w-40">
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
                      </TableCell>
                      <TableCell>
                        <Select
                          value={draft.portfolioId ? String(draft.portfolioId) : row.portfolio_id ? String(row.portfolio_id) : ""}
                          onValueChange={(value) => setDraft(row.delegate_id, { portfolioId: value ? Number(value) : undefined })}
                          disabled={!selectedCommitteeId}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select portfolio" />
                          </SelectTrigger>
                          <SelectContent>
                            {portfolioOptions.map((portfolio) => (
                              <SelectItem key={portfolio.id} value={String(portfolio.id)}>
                                {portfolio.name}
                                {portfolio.status === "assigned" && portfolio.id !== row.portfolio_id ? " (taken)" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.status === "assigned" ? "default" : "secondary"}>
                          {row.status === "assigned" ? (row.published ? "published" : "assigned") : "unassigned"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="xs" disabled={savingId === row.delegate_id} onClick={() => saveAssignment(row)}>
                            Save
                          </Button>
                          {row.status === "assigned" && (
                            <Button size="xs" variant="ghost" disabled={savingId === row.delegate_id} onClick={() => unassign(row)}>
                              <UserX className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
