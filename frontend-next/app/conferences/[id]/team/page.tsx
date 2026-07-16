"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Activity, Building2, Mail, Plus, UserCog, Users } from "lucide-react";
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
import { api, ApiRequestError } from "@/lib/api";
import type { Committee, Department, OrganizerAccessRow, TeamActivityEntry, TeamDashboard } from "@/lib/types";

const ROLES = [
  { value: "conference_manager", label: "Executive Board" },
  { value: "organizer", label: "Organizing Committee" },
  { value: "committee_director", label: "Committee Director" },
];
const ROLE_ITEMS: Record<string, string> = {
  owner: "Main Organizer",
  ...Object.fromEntries(ROLES.map((r) => [r.value, r.label])),
};

export default function TeamPage() {
  const params = useParams<{ id: string }>();
  const conferenceId = params.id;

  const [dashboard, setDashboard] = useState<TeamDashboard | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<OrganizerAccessRow[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [activity, setActivity] = useState<TeamActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState("organizer");

  const departmentItems = useMemo(
    () => ({ none: "No department", ...Object.fromEntries(departments.map((d) => [String(d.id), d.name])) }),
    [departments]
  );
  const committeeItems = useMemo(() => Object.fromEntries(committees.map((c) => [String(c.id), c.name])), [committees]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardRes, departmentsRes, membersRes, committeesRes, activityRes] = await Promise.all([
        api.get<{ success: true; dashboard: TeamDashboard }>(`/conferences/${conferenceId}/team/dashboard`),
        api.get<{ success: true; departments: Department[] }>(`/conferences/${conferenceId}/departments`),
        api.get<{ success: true; organizerAccess: OrganizerAccessRow[] }>(`/conferences/${conferenceId}/organizer-access`),
        api.get<{ success: true; committees: Committee[] }>(`/conferences/${conferenceId}/committees`),
        api.get<{ success: true; activity: TeamActivityEntry[] }>(`/conferences/${conferenceId}/team/activity`),
      ]);
      setDashboard(dashboardRes.dashboard);
      setDepartments(departmentsRes.departments);
      setMembers(membersRes.organizerAccess);
      setCommittees(committeesRes.committees);
      setActivity(activityRes.activity);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load team data");
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveDepartment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = { name: form.get("name"), description: form.get("description") || undefined };
    setSubmitting(true);
    try {
      if (editingDepartment) {
        await api.put(`/conferences/${conferenceId}/departments/${editingDepartment.id}`, payload);
        toast.success("Department updated");
      } else {
        await api.post(`/conferences/${conferenceId}/departments`, payload);
        toast.success("Department created");
      }
      setDepartmentDialogOpen(false);
      setEditingDepartment(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not save department");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteDepartment(department: Department) {
    try {
      await api.delete(`/conferences/${conferenceId}/departments/${department.id}`);
      toast.success("Department removed");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not remove department");
    }
  }

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const departmentId = form.get("departmentId");
    const committeeId = form.get("committeeId");
    setSubmitting(true);
    try {
      await api.post(`/conferences/${conferenceId}/organizer-access`, {
        email: form.get("email"),
        role: form.get("role"),
        positionTitle: form.get("positionTitle") || undefined,
        departmentId: departmentId && departmentId !== "none" ? Number(departmentId) : undefined,
        committeeId: form.get("role") === "committee_director" && committeeId ? Number(committeeId) : undefined,
      });
      toast.success("Invitation sent");
      setInviteDialogOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not invite member");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveMember(member: OrganizerAccessRow) {
    try {
      await api.delete(`/conferences/${conferenceId}/organizer-access/${member.id}`);
      toast.success("Access revoked");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not revoke access");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team Center</h1>
        <p className="text-muted-foreground">Departments, organizing team members, and activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={<Users className="h-4 w-4" />} label="Total members" value={dashboard?.totalMembers} loading={loading} />
        <StatCard icon={<Mail className="h-4 w-4" />} label="Pending invitations" value={dashboard?.pendingInvitations} loading={loading} />
        <StatCard icon={<Building2 className="h-4 w-4" />} label="Departments" value={dashboard?.departmentCount} loading={loading} />
        <StatCard icon={<UserCog className="h-4 w-4" />} label="Executive Board" value={dashboard?.byRole?.conference_manager || 0} loading={loading} />
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Team members</CardTitle>
                <CardDescription>Executive Board, Organizing Committee, and Committee Directors.</CardDescription>
              </div>
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger render={<Button size="sm" />}>
                  <Plus className="mr-1 h-4 w-4" /> Invite member
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleInvite}>
                    <DialogHeader>
                      <DialogTitle>Invite a team member</DialogTitle>
                      <DialogDescription>They'll appear as a pending invitation until they claim access.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Select name="role" items={ROLE_ITEMS} defaultValue="organizer" onValueChange={(v) => setInviteRole(String(v))}>
                            <SelectTrigger id="role" className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ROLES.map((r) => (
                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="positionTitle">Position title</Label>
                          <Input id="positionTitle" name="positionTitle" placeholder="USG Logistics" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="departmentId">Department</Label>
                          <Select name="departmentId" items={departmentItems} defaultValue="none">
                            <SelectTrigger id="departmentId" className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No department</SelectItem>
                              {departments.map((d) => (
                                <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {inviteRole === "committee_director" && (
                          <div className="space-y-2">
                            <Label htmlFor="committeeId">Committee</Label>
                            <Select name="committeeId" items={committeeItems}>
                              <SelectTrigger id="committeeId" className="w-full"><SelectValue placeholder="Select committee" /></SelectTrigger>
                              <SelectContent>
                                {committees.map((c) => (
                                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={submitting}>{submitting ? "Inviting..." : "Send invitation"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{ROLE_ITEMS[m.role] || m.role}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {departments.find((d) => d.id === m.departmentId)?.name || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.positionTitle || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={m.role === "owner" || m.claimed ? "default" : "outline"}>
                            {m.role === "owner" || m.claimed ? "Active" : "Invited"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {m.role !== "owner" && (
                            <Button size="xs" variant="ghost" onClick={() => handleRemoveMember(m)}>Revoke</Button>
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

        <TabsContent value="departments" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Departments</CardTitle>
                <CardDescription>Group team members by function — Logistics, Finance, Media, and so on.</CardDescription>
              </div>
              <Dialog
                open={departmentDialogOpen}
                onOpenChange={(open) => {
                  setDepartmentDialogOpen(open);
                  if (!open) setEditingDepartment(null);
                }}
              >
                <DialogTrigger render={<Button size="sm" onClick={() => setEditingDepartment(null)} />}>
                  <Plus className="mr-1 h-4 w-4" /> New department
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleSaveDepartment}>
                    <DialogHeader>
                      <DialogTitle>{editingDepartment ? "Edit department" : "New department"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" required defaultValue={editingDepartment?.name} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" rows={2} defaultValue={editingDepartment?.description || ""} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save department"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {departments.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No departments yet.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  {departments.map((d) => (
                    <Card key={d.id}>
                      <CardContent className="space-y-1 p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{d.name}</p>
                          <Badge variant="outline">{d.member_count} member{d.member_count === 1 ? "" : "s"}</Badge>
                        </div>
                        {d.description && <p className="text-xs text-muted-foreground">{d.description}</p>}
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="xs" variant="ghost"
                            onClick={() => {
                              setEditingDepartment(d);
                              setDepartmentDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => handleDeleteDepartment(d)}>Delete</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Team activity</CardTitle>
              <CardDescription>Recent actions taken by your organizing team.</CardDescription>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <Activity className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activity.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 text-sm">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <div>
                        <p>
                          <span className="font-medium">{a.actor_name || a.actor_email}</span> {a.action}
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                      </div>
                    </div>
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

function StatCard({
  icon, label, value, loading,
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
