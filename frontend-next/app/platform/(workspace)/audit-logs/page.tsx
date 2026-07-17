"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { platformApi } from "@/lib/platform-api";
import type { PlatformAuditLogEntry } from "@/lib/types";

const ACTOR_ITEMS = { all: "All actors", organizer: "Organizer", delegate: "Delegate", platform_admin: "Platform admin", system: "System" };

export default function PlatformAuditLogsPage() {
  const [logs, setLogs] = useState<PlatformAuditLogEntry[]>([]);
  const [actorType, setActorType] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (actorType !== "all") params.set("actorType", actorType);
    platformApi
      .get<{ success: true; logs: PlatformAuditLogEntry[] }>(`/platform/audit-logs?${params.toString()}`)
      .then((res) => setLogs(res.logs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [actorType]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">An immutable record of every audit-worthy action across the platform.</p>
      </div>

      <Select items={ACTOR_ITEMS} value={actorType} onValueChange={(v) => setActorType(String(v))}>
        <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.entries(ACTOR_ITEMS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
        </SelectContent>
      </Select>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : logs.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No audit log entries yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="mr-1.5 capitalize">{log.actor_type.replace("_", " ")}</Badge>
                      <span className="text-xs text-muted-foreground">{log.actor_email || "—"}</span>
                    </TableCell>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.resource_type}
                      {log.resource_id ? ` #${log.resource_id}` : ""}
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
