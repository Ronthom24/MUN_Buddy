"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { platformApi } from "@/lib/platform-api";
import type { LoginHistoryEntry } from "@/lib/types";

interface SuspiciousEmail {
  email: string;
  failed_attempts: number;
  last_attempt_at: string;
}

export default function PlatformSecurityPage() {
  const [failures, setFailures] = useState<LoginHistoryEntry[]>([]);
  const [suspicious, setSuspicious] = useState<SuspiciousEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      platformApi.get<{ success: true; history: LoginHistoryEntry[] }>("/platform/login-history?success=false&limit=50"),
      platformApi.get<{ success: true; emails: SuspiciousEmail[] }>("/platform/security/suspicious-activity"),
    ])
      .then(([historyRes, suspiciousRes]) => {
        setFailures(historyRes.history);
        setSuspicious(suspiciousRes.emails);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Security Center</h1>
        <p className="text-muted-foreground">Failed login attempts and suspicious activity across the platform.</p>
      </div>

      {suspicious.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-4 w-4" /> Suspicious activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suspicious.map((s) => (
              <div key={s.email} className="flex items-center justify-between rounded-md border border-destructive/20 bg-background p-3 text-sm">
                <span className="font-medium">{s.email}</span>
                <Badge variant="destructive">{s.failed_attempts} failed attempts</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" /> Recent failed login attempts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : failures.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No failed login attempts recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Account type</TableHead>
                  <TableHead>IP address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failures.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(f.created_at).toLocaleString()}</TableCell>
                    <TableCell className="flex items-center gap-1.5 font-medium">
                      <XCircle className="h-3.5 w-3.5 text-destructive" /> {f.email}
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">{f.user_type.replace("_", " ")}</TableCell>
                    <TableCell className="text-muted-foreground">{f.ip_address || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Active session listing and automatic account lockout are not yet implemented — see docs/Architecture.md.
      </p>
    </div>
  );
}
