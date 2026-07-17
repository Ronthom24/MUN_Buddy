"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Ban, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { platformApi, viewConferenceAsOrganizer } from "@/lib/platform-api";
import type { Organization } from "@/lib/types";

interface OrgDetailResponse {
  success: true;
  organization: Organization;
  stats: {
    totalConferences: number;
    publishedConferences: number;
    totalDelegates: number;
    totalMembers: number;
  };
  conferences: {
    id: number;
    name: string;
    status: string;
    registration_status: string;
    start_date: string;
    end_date: string;
    admin_disabled: 0 | 1;
  }[];
}

export default function PlatformOrganizationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<OrgDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    platformApi
      .get<OrgDetailResponse>(`/platform/organizations/${params.id}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, [params.id]);

  async function toggleStatus() {
    if (!data) return;
    const nextStatus = data.organization.status === "active" ? "suspended" : "active";
    setBusy(true);
    try {
      await platformApi.patch(`/platform/organizations/${params.id}/status`, { status: nextStatus });
      toast.success(nextStatus === "suspended" ? "Organization suspended" : "Organization reactivated");
      load();
    } catch {
      toast.error("Could not update organization status");
    } finally {
      setBusy(false);
    }
  }

  async function deleteOrganization() {
    if (!window.confirm("Delete this organization? This is an administrative action and cannot be easily undone.")) return;
    setBusy(true);
    try {
      await platformApi.delete(`/platform/organizations/${params.id}`);
      toast.success("Organization deleted");
      router.push("/platform/organizations");
    } catch {
      toast.error("Could not delete organization");
      setBusy(false);
    }
  }

  async function viewAsOrganizer(conferenceId: number) {
    try {
      await viewConferenceAsOrganizer(conferenceId);
    } catch {
      toast.error("Could not open the organizer workspace for this conference");
    }
  }

  if (loading || !data) {
    return <Skeleton className="h-64 w-full" />;
  }

  const { organization, stats, conferences } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{organization.name}</h1>
          <p className="text-muted-foreground">{organization.slug}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={busy} onClick={toggleStatus}>
            {organization.status === "active" ? (
              <><Ban className="mr-1 h-4 w-4" /> Suspend</>
            ) : (
              <><CheckCircle2 className="mr-1 h-4 w-4" /> Reactivate</>
            )}
          </Button>
          <Button variant="destructive" disabled={busy} onClick={deleteOrganization}>
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-2xl font-semibold">{stats.totalConferences}</p><p className="text-sm text-muted-foreground">Conferences</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-2xl font-semibold">{stats.publishedConferences}</p><p className="text-sm text-muted-foreground">Published</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-2xl font-semibold">{stats.totalDelegates}</p><p className="text-sm text-muted-foreground">Delegates</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-2xl font-semibold">{stats.totalMembers}</p><p className="text-sm text-muted-foreground">Members</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Conferences</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {conferences.length === 0 ? (
            <p className="text-sm text-muted-foreground">No conferences yet.</p>
          ) : (
            conferences.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <div className="mt-1 flex gap-2">
                    <Badge variant="outline">{c.status}</Badge>
                    <Badge variant="outline">{c.registration_status}</Badge>
                    {c.admin_disabled === 1 && <Badge variant="destructive">disabled</Badge>}
                  </div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => viewAsOrganizer(c.id)}>
                  View as Organizer <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
