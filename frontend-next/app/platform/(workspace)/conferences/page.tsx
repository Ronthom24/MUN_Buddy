"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Archive, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { platformApi, viewConferenceAsOrganizer } from "@/lib/platform-api";
import type { PlatformConferenceSummary } from "@/lib/types";

export default function PlatformConferencesPage() {
  const [conferences, setConferences] = useState<PlatformConferenceSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  function load() {
    setLoading(true);
    platformApi
      .get<{ success: true; conferences: PlatformConferenceSummary[] }>(`/platform/conferences?search=${encodeURIComponent(search)}`)
      .then((res) => setConferences(res.conferences))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  async function viewAsOrganizer(conferenceId: number) {
    try {
      await viewConferenceAsOrganizer(conferenceId);
    } catch {
      toast.error("Could not open the organizer workspace for this conference");
    }
  }

  async function toggleDisabled(conference: PlatformConferenceSummary) {
    setBusyId(conference.id);
    try {
      await platformApi.patch(`/platform/conferences/${conference.id}/disabled`, { disabled: conference.admin_disabled === 0 });
      toast.success(conference.admin_disabled === 0 ? "Conference disabled" : "Conference re-enabled");
      load();
    } catch {
      toast.error("Could not update conference");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Conferences</h1>
        <p className="text-muted-foreground">Every conference hosted across every organization.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search conferences..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : conferences.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No conferences found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delegates</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conferences.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.organization_name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Badge variant="outline">{c.status}</Badge>
                        {c.admin_disabled === 1 && <Badge variant="destructive">disabled</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{c.delegate_count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" disabled={busyId === c.id} onClick={() => toggleDisabled(c)}>
                          <Archive className="mr-1 h-3.5 w-3.5" /> {c.admin_disabled ? "Enable" : "Disable"}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => viewAsOrganizer(c.id)}>
                          View <ArrowRight className="ml-1 h-3.5 w-3.5" />
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
    </div>
  );
}
