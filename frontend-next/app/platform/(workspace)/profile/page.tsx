"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlatformAdminAuth } from "@/lib/platform-auth-context";

export default function PlatformProfilePage() {
  const { admin } = usePlatformAdminAuth();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Your platform administrator account.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
          <CardDescription>Password changes and multi-admin management are planned for a future release.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{admin?.name}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{admin?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last login</span>
            <span className="font-medium">{admin?.lastLogin ? new Date(admin.lastLogin).toLocaleString() : "—"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
