"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  CalendarDays,
  LogOut,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { api, ApiRequestError } from "@/lib/api";
import type { Conference, Organization, OrganizationMember, OrganizationStats } from "@/lib/types";

const STATUS_VARIANT: Record<Conference["status"], "secondary" | "default" | "outline"> = {
  draft: "secondary",
  published: "default",
  archived: "outline",
};

export default function DashboardPage() {
  const { organizer, loading, logout } = useAuth();
  const router = useRouter();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<number | null>(null);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [conferenceDialogOpen, setConferenceDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !organizer) {
      router.replace("/login");
    }
  }, [loading, organizer, router]);

  const loadOrgData = useCallback(async (orgId: number) => {
    const [statsRes, conferencesRes, membersRes] = await Promise.all([
      api.get<{ success: true; stats: OrganizationStats }>(`/organizations/${orgId}/stats`),
      api.get<{ success: true; conferences: Conference[] }>(`/organizations/${orgId}/conferences`),
      api.get<{ success: true; members: OrganizationMember[] }>(`/organizations/${orgId}/members`),
    ]);
    setStats(statsRes.stats);
    setConferences(conferencesRes.conferences);
    setMembers(membersRes.members);
  }, []);

  useEffect(() => {
    if (!organizer) return;
    (async () => {
      setDataLoading(true);
      try {
        const res = await api.get<{ success: true; organizations: Organization[] }>("/organizations/me");
        setOrganizations(res.organizations);
        const firstOrgId = res.organizations[0]?.id ?? null;
        setActiveOrgId(firstOrgId);
        if (firstOrgId) await loadOrgData(firstOrgId);
      } catch (err) {
        const message = err instanceof ApiRequestError ? err.message : "Failed to load your organization";
        toast.error(message);
      } finally {
        setDataLoading(false);
      }
    })();
  }, [organizer, loadOrgData]);

  async function handleSwitchOrg(orgId: string | null) {
    if (!orgId) return;
    const id = Number(orgId);
    setActiveOrgId(id);
    setDataLoading(true);
    try {
      await loadOrgData(id);
    } finally {
      setDataLoading(false);
    }
  }

  async function handleCreateConference(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeOrgId) return;
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await api.post(`/organizations/${activeOrgId}/conferences`, {
        conferenceName: form.get("conferenceName"),
        conferenceAcronym: form.get("conferenceAcronym") || undefined,
        startDate: form.get("startDate"),
        endDate: form.get("endDate"),
        registrationDeadline: form.get("registrationDeadline"),
      });
      toast.success("Conference created");
      setConferenceDialogOpen(false);
      await loadOrgData(activeOrgId);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not create conference";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInviteMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeOrgId) return;
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await api.post(`/organizations/${activeOrgId}/members`, {
        email: form.get("email"),
        fullName: form.get("fullName") || undefined,
        orgRole: form.get("orgRole") || "member",
      });
      toast.success("Member invited");
      setMemberDialogOpen(false);
      await loadOrgData(activeOrgId);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not invite member";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !organizer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  const activeOrg = organizations.find((o) => o.id === activeOrgId);

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <LogoMark size={36} />
            <div>
              <p className="text-sm font-medium leading-none">MUN Buddy</p>
              <p className="text-xs text-muted-foreground">Organization Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {organizations.length > 1 && activeOrgId && (
              <Select value={String(activeOrgId)} onValueChange={handleSwitchOrg}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={String(org.id)}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <span className="text-sm text-muted-foreground hidden sm:inline">{organizer.email}</span>
            <Button variant="ghost" size="icon" onClick={logout} title="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-8 px-6 py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{activeOrg?.name ?? "Your Organization"}</h1>
          <p className="text-muted-foreground">Overview of your conferences, members, and activity.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<CalendarDays className="h-4 w-4" />} label="Conferences" value={stats?.totalConferences} loading={dataLoading} />
          <StatCard icon={<Building2 className="h-4 w-4" />} label="Published" value={stats?.publishedConferences} loading={dataLoading} />
          <StatCard icon={<Users className="h-4 w-4" />} label="Delegates" value={stats?.totalDelegates} loading={dataLoading} />
          <StatCard icon={<UserPlus className="h-4 w-4" />} label="Members" value={stats?.totalMembers} loading={dataLoading} />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Conferences</CardTitle>
              <CardDescription>Every conference hosted by this organization.</CardDescription>
            </div>
            <Dialog open={conferenceDialogOpen} onOpenChange={setConferenceDialogOpen}>
              <DialogTrigger render={<Button size="sm" />}>
                <Plus className="mr-1 h-4 w-4" /> New conference
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateConference}>
                  <DialogHeader>
                    <DialogTitle>Create a conference</DialogTitle>
                    <DialogDescription>
                      This conference will belong to {activeOrg?.name}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="conferenceName">Conference name</Label>
                      <Input id="conferenceName" name="conferenceName" required placeholder="Christ Winter MUN 2027" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conferenceAcronym">Acronym</Label>
                      <Input id="conferenceAcronym" name="conferenceAcronym" placeholder="CWMUN27" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start date</Label>
                        <Input id="startDate" name="startDate" type="date" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End date</Label>
                        <Input id="endDate" name="endDate" type="date" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registrationDeadline">Registration deadline</Label>
                      <Input id="registrationDeadline" name="registrationDeadline" type="date" required />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Creating..." : "Create conference"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {conferences.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No conferences yet. Create your first one above.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conferences.map((conference) => (
                    <TableRow key={conference.id}>
                      <TableCell className="font-medium">
                        <Link href={`/conferences/${conference.id}`} className="hover:underline">
                          {conference.name}
                        </Link>
                        {conference.acronym && (
                          <span className="ml-2 text-xs text-muted-foreground">{conference.acronym}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{conference.conference_code}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(conference.start_date)} – {formatDate(conference.end_date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[conference.status]}>{conference.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{conference.registration_status.replace("_", " ")}</Badge>
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
              <CardTitle>Members</CardTitle>
              <CardDescription>Everyone with access to this organization.</CardDescription>
            </div>
            <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
              <DialogTrigger render={<Button size="sm" variant="outline" />}>
                <UserPlus className="mr-1 h-4 w-4" /> Invite member
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleInviteMember}>
                  <DialogHeader>
                    <DialogTitle>Invite a member</DialogTitle>
                    <DialogDescription>
                      Grant someone owner or admin access across every conference in {activeOrg?.name}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full name</Label>
                      <Input id="fullName" name="fullName" placeholder="Carol EB" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" required placeholder="carol@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orgRole">Organization role</Label>
                      <Select name="orgRole" defaultValue="admin">
                        <SelectTrigger id="orgRole">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Inviting..." : "Send invite"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.full_name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{member.email}</TableCell>
                    <TableCell>
                      <Badge variant={member.org_role === "owner" ? "default" : "secondary"}>{member.org_role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
