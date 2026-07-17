"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, CheckCircle2, LogOut, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { platformApi } from "@/lib/platform-api";
import type { PlatformUserSummary } from "@/lib/types";

const TYPE_ITEMS = { all: "All users", organizer: "Organizers", delegate: "Delegates" };

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<PlatformUserSummary[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (type !== "all") params.set("type", type);
    platformApi
      .get<{ success: true; users: PlatformUserSummary[] }>(`/platform/users?${params.toString()}`)
      .then((res) => setUsers(res.users))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [search, type]);

  async function suspend(u: PlatformUserSummary) {
    setBusyKey(`${u.user_type}-${u.id}-suspend`);
    try {
      await platformApi.patch(`/platform/users/${u.user_type}/${u.id}/suspend`, {});
      toast.success(`${u.full_name} suspended`);
      load();
    } catch {
      toast.error("Could not suspend user");
    } finally {
      setBusyKey(null);
    }
  }

  async function activate(u: PlatformUserSummary) {
    setBusyKey(`${u.user_type}-${u.id}-activate`);
    try {
      await platformApi.patch(`/platform/users/${u.user_type}/${u.id}/activate`, {});
      toast.success(`${u.full_name} reactivated`);
      load();
    } catch {
      toast.error("Could not activate user");
    } finally {
      setBusyKey(null);
    }
  }

  async function forceLogout(u: PlatformUserSummary) {
    setBusyKey(`${u.user_type}-${u.id}-logout`);
    try {
      await platformApi.post(`/platform/users/${u.user_type}/${u.id}/force-logout`, {});
      toast.success(`${u.full_name}'s sessions were revoked`);
    } catch {
      toast.error("Could not force logout");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground">Every organizer and delegate account across the platform.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select items={TYPE_ITEMS} value={type} onValueChange={(v) => setType(String(v))}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(TYPE_ITEMS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : users.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No users found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const key = `${u.user_type}-${u.id}`;
                  return (
                    <TableRow key={key}>
                      <TableCell>
                        <p className="font-medium">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">{u.user_type}</TableCell>
                      <TableCell>
                        <Badge variant={u.account_status === "active" ? "default" : "destructive"}>{u.account_status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" disabled={busyKey === `${key}-logout`} onClick={() => forceLogout(u)}>
                            <LogOut className="mr-1 h-3.5 w-3.5" /> Force logout
                          </Button>
                          {u.account_status === "active" ? (
                            <Button size="sm" variant="outline" disabled={busyKey === `${key}-suspend`} onClick={() => suspend(u)}>
                              <Ban className="mr-1 h-3.5 w-3.5" /> Suspend
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled={busyKey === `${key}-activate`} onClick={() => activate(u)}>
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Activate
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
