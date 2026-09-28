"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Activity, ArrowUpFromLine, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiRequestError } from "@/lib/api";
import type { AuditLogEntry, TeamActivityEntry, TrashBin } from "@/lib/types";

const TRASH_ITEM_LABEL: Record<keyof TrashBin, string> = {
  committees: "Committee", portfolios: "Portfolio", resources: "Resource", announcements: "Announcement",
};

export default function HistoryPage() {
  const params = useParams<{ id: string }>();
  const conferenceId = params.id;

  const [activity, setActivity] = useState<TeamActivityEntry[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [trash, setTrash] = useState<TrashBin | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [activityRes, auditRes, trashRes] = await Promise.all([
        api.get<{ success: true; activity: TeamActivityEntry[] }>(`/conferences/${conferenceId}/team/activity`),
        api.get<{ success: true; logs: AuditLogEntry[] }>(`/conferences/${conferenceId}/audit-log`),
        api.get<{ success: true; trash: TrashBin }>(`/conferences/${conferenceId}/trash`),
      ]);
      setActivity(activityRes.activity);
      setAuditLog(auditRes.logs);
      setTrash(trashRes.trash);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRestore(type: keyof TrashBin, itemId: number) {
    const singular = type.slice(0, -1);
    try {
      await api.post(`/conferences/${conferenceId}/trash/${singular}/${itemId}/restore`);
      toast.success(`${TRASH_ITEM_LABEL[type]} restored`);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not restore item");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="text-muted-foreground">Team activity, the compliance audit log, and deleted items.</p>
      </div>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="trash">Trash</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Team activity</CardTitle>
              <CardDescription>Recent actions taken by your organizing team.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : activity.length === 0 ? (
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

        <TabsContent value="audit" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit log</CardTitle>
              <CardDescription>
                Full compliance record of sensitive actions — who did what, and the values before and after. Immutable.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : auditLog.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <ShieldCheck className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No audited actions yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLog.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">{log.actor_name || log.actor_email || "System"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.resource_type}{log.resource_id ? ` #${log.resource_id}` : ""}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trash" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" /> Trash
              </CardTitle>
              <CardDescription>Deleted committees, portfolios, resources, and announcements can be restored here.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : trash && Object.values(trash).every((list) => list.length === 0) ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Nothing in the trash.</p>
              ) : (
                <div className="space-y-4">
                  {(Object.keys(TRASH_ITEM_LABEL) as (keyof TrashBin)[]).map((type) =>
                    trash && trash[type].length > 0 ? (
                      <div key={type} className="space-y-2">
                        <p className="text-xs font-medium uppercase text-muted-foreground">{TRASH_ITEM_LABEL[type]}s</p>
                        {trash[type].map((item) => (
                          <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                            <div>
                              <p className="font-medium">{"name" in item ? item.name : item.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Deleted {new Date(item.deleted_at).toLocaleString()}
                              </p>
                            </div>
                            <Button size="xs" variant="ghost" onClick={() => handleRestore(type, item.id)}>
                              <ArrowUpFromLine className="mr-1 h-3.5 w-3.5" /> Restore
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
