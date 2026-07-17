"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { platformApi } from "@/lib/platform-api";
import type { PlatformSettings } from "@/lib/types";

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    platformApi
      .get<{ success: true; settings: PlatformSettings }>("/platform/settings")
      .then((res) => setSettings(res.settings))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save(patch: Partial<PlatformSettings>) {
    setSaving(true);
    try {
      const res = await platformApi.put<{ success: true; settings: PlatformSettings }>("/platform/settings", patch);
      setSettings(res.settings);
      toast.success("Settings updated");
    } catch {
      toast.error("Could not update settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">Global configuration affecting the entire platform.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance mode</CardTitle>
          <CardDescription>
            When enabled, the public site, organizer, and delegate workspaces show a maintenance message. Platform administration stays reachable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-md border p-4">
            <div>
              <p className="text-sm font-medium">{settings.maintenance_mode === "true" ? "Currently ON — site is down" : "Currently OFF — site is live"}</p>
            </div>
            <Switch
              checked={settings.maintenance_mode === "true"}
              disabled={saving}
              onCheckedChange={(checked) => save({ maintenance_mode: checked ? "true" : "false" })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              save({
                platform_name: String(form.get("platform_name") || ""),
                default_timezone: String(form.get("default_timezone") || ""),
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="platform_name">Platform name</Label>
              <Input id="platform_name" name="platform_name" defaultValue={settings.platform_name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_timezone">Default timezone</Label>
              <Input id="default_timezone" name="default_timezone" defaultValue={settings.default_timezone} />
            </div>
            <Button type="submit" disabled={saving}>Save</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
