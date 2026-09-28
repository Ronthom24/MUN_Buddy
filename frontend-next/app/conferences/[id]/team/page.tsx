"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Building2, Mail, Plus, UserCog, Users } from "lucide-react";
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
import type { Committee, Department, OrganizerAccessRow, TeamDashboard } from "@/lib/types";

// Real-MUN-terminology grouping of organizer_access.role for the Admin/EB/OC
// tabs -- distinct from the app's older per-role labels above (which called
// conference_manager "Executive Board"): in practice EB means the chairs/
// co-chairs/vice-chairs running each committee (committee_director), not
// conference-level leadership. Admin covers the conference-level leadership
// (owner + conference_manager) instead.
const ADMIN_ROLES = ["owner", "conference_manager"];
const EB_ROLES = ["committee_director"];
const OC_ROLES = ["organizer", "admin"];

const ROLES = [
  { value: "admin", label: "Staff Admin" },
  { value: "conference_manager", label: "Conference Manager" },
  { value: "organizer", label: "Organizing Committee" },
  { value: "committee_director", label: "Committee Director (EB)" },
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState("organizer");
  const [viewingMember, setViewingMember] = useState<OrganizerAccessRow | null>(null);

  const departmentItems = useMemo(
    () => ({ none: "No department", ...Object.fromEntries(departments.map((d) => [String(d.id), d.name])) }),
    [departments]
  );
  const committeeItems = useMemo(() => Object.fromEntries(committees.map((c) => [String(c.id), c.name])), [committees]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardRes, departmentsRes, membersRes, committeesRes] = await Promise.all([
        api.get<{ success: true; dashboard: TeamDashboard }>(`/conferences/${conferenceId}/team/dashboard`),
        api.get<{ success: true; departments: Department[] }>(`/conferences/${conferenceId}/departments`),
        api.get<{ success: true; organizerAccess: OrganizerAccessRow[] }>(`/conferences/${conferenceId}/organizer-access`),
        api.get<{ success: true; committees: Committee[] }>(`/conferences/${conferenceId}/committees`),
      ]);
      let departments = departmentsRes.departments;
      let dashboard = dashboardRes.dashboard;
      // First time the Departments tab is opened, there are none yet --
      // seed a standard starting set (Logistics, Finance, ...) instead of
      // leaving organizers to type each one from scratch. No-op once any
      // department exists (renamed, deleted, or otherwise).
      if (departments.length === 0) {
        try {
          const seeded = await api.post<{ success: true; departments: Department[] }>(
            `/conferences/${conferenceId}/departments/auto-generate`
          );
          departments = seeded.departments;
          dashboard = { ...dashboard, departmentCount: departments.length };
        } catch {
          // Not critical -- organizer can still add departments manually.
        }
      }
      setDashboard(dashboard);
      setDepartments(departments);
      setMembers(membersRes.organizerAccess);
      setCommittees(committeesRes.committees);
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
        <p className="text-muted-foreground">Admin, Executive Board, Organizing Committee, and departments.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={<Users className="h-4 w-4" />} label="Total members" value={dashboard?.totalMembers} loading={loading} />
        <StatCard icon={<Mail className="h-4 w-4" />} label="Pending invitations" value={dashboard?.pendingInvitations} loading={loading} />
        <StatCard icon={<Building2 className="h-4 w-4" />} label="Departments" value={dashboard?.departmentCount} loading={loading} />
        <StatCard icon={<UserCog className="h-4 w-4" />} label="Executive Board" value={dashboard?.byRole?.committee_director || 0} loading={loading} />
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="eb">EB</TabsTrigger>
          <TabsTrigger value="oc">OC</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Team members</CardTitle>
                <CardDescription>Everyone with organizer access to this conference, across every role.</CardDescription>
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
                <MembersTable
                  list={members}
                  departments={departments}
                  onView={setViewingMember}
                  onRemove={handleRemoveMember}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin</CardTitle>
              <CardDescription>Conference-level leadership — the main organizer and conference managers.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <MembersTable
                  list={members.filter((m) => ADMIN_ROLES.includes(m.role))}
                  departments={departments}
                  onView={setViewingMember}
                  onRemove={handleRemoveMember}
                  emptyLabel="No admin-level members yet."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eb" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Executive Board</CardTitle>
              <CardDescription>Committee directors — chairs, co-chairs, and vice-chairs running each committee.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <MembersTable
                  list={members.filter((m) => EB_ROLES.includes(m.role))}
                  departments={departments}
                  onView={setViewingMember}
                  onRemove={handleRemoveMember}
                  emptyLabel="No Executive Board members yet."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oc" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Organizing Committee</CardTitle>
              <CardDescription>General organizing staff and admins outside the Executive Board.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <MembersTable
                  list={members.filter((m) => OC_ROLES.includes(m.role))}
                  departments={departments}
                  onView={setViewingMember}
                  onRemove={handleRemoveMember}
                  emptyLabel="No Organizing Committee members yet."
                />
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

      </Tabs>

      <Dialog open={Boolean(viewingMember)} onOpenChange={(open) => !open && setViewingMember(null)}>
        <DialogContent>
          {viewingMember && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingMember.fullName || viewingMember.email}</DialogTitle>
                <DialogDescription>{viewingMember.email}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <Badge variant="outline">{ROLE_ITEMS[viewingMember.role] || viewingMember.role}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={viewingMember.role === "owner" || viewingMember.claimed ? "default" : "outline"}>
                    {viewingMember.role === "owner" || viewingMember.claimed ? "Active" : "Invited"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span>{departments.find((d) => d.id === viewingMember.departmentId)?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Position</span>
                  <span>{viewingMember.positionTitle || "—"}</span>
                </div>
                {viewingMember.role === "committee_director" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Committee</span>
                    <span>{committees.find((c) => c.id === viewingMember.committeeId)?.name || "—"}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Added</span>
                  <span>{new Date(viewingMember.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              {viewingMember.role !== "owner" && (
                <DialogFooter>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleRemoveMember(viewingMember);
                      setViewingMember(null);
                    }}
                  >
                    Revoke access
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MembersTable({
  list, departments, onView, onRemove, emptyLabel,
}: {
  list: OrganizerAccessRow[];
  departments: Department[];
  onView: (member: OrganizerAccessRow) => void;
  onRemove: (member: OrganizerAccessRow) => void;
  emptyLabel?: string;
}) {
  if (list.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel || "No members yet."}</p>;
  }

  return (
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
        {list.map((m) => (
          <TableRow key={m.id} className="cursor-pointer" onClick={() => onView(m)}>
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
                <Button
                  size="xs" variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(m);
                  }}
                >
                  Revoke
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
