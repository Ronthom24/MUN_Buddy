"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { platformApi } from "@/lib/platform-api";
import type { PlatformOrganizationSummary } from "@/lib/types";

export default function PlatformOrganizationsPage() {
  const [organizations, setOrganizations] = useState<PlatformOrganizationSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      platformApi
        .get<{ success: true; organizations: PlatformOrganizationSummary[] }>(`/platform/organizations?search=${encodeURIComponent(search)}`)
        .then((res) => setOrganizations(res.organizations))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground">Every organization hosted on MUN Buddy.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search organizations..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : organizations.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No organizations found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Conferences</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Public</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link href={`/platform/organizations/${o.id}`} className="font-medium text-primary hover:underline">
                        {o.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{o.slug}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={o.status === "active" ? "default" : "destructive"}>{o.status}</Badge>
                    </TableCell>
                    <TableCell>{o.conference_count}</TableCell>
                    <TableCell>{o.member_count}</TableCell>
                    <TableCell>{o.is_publicly_listed ? "Yes" : "No"}</TableCell>
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
