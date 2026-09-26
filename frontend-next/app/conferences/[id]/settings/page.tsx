"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiRequestError } from "@/lib/api";
import type { Conference } from "@/lib/types";

const STATUS_ITEMS = { draft: "Draft", published: "Published", archived: "Archived" };
const REGISTRATION_ITEMS = { open: "Open", closed: "Closed", invite_only: "Invite only" };

export default function ConferenceSettingsPage() {
  const params = useParams<{ id: string }>();
  const conferenceId = params.id;

  const [conference, setConference] = useState<Conference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Conference["status"]>("draft");
  const [registrationStatus, setRegistrationStatus] = useState<Conference["registration_status"]>("closed");
  const [isPubliclyListed, setIsPubliclyListed] = useState(true);
  const [allowReapplication, setAllowReapplication] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: true; conference: Conference }>(`/conferences/${conferenceId}`);
      setConference(res.conference);
      setStatus(res.conference.status);
      setRegistrationStatus(res.conference.registration_status);
      setIsPubliclyListed(!!res.conference.is_publicly_listed);
      setAllowReapplication(!!res.conference.allow_reapplication);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Failed to load conference";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await api.put(`/conferences/${conferenceId}`, {
        name: form.get("name"),
        acronym: form.get("acronym") || null,
        institution: form.get("institution") || null,
        location: form.get("location") || null,
        description: form.get("description") || null,
        startDate: form.get("startDate"),
        endDate: form.get("endDate"),
        registrationDeadline: form.get("registrationDeadline"),
        maxDelegates: form.get("maxDelegates") ? Number(form.get("maxDelegates")) : null,
        status,
        registrationStatus,
        isPubliclyListed,
        allowReapplication,
      });
      toast.success("Conference settings saved");
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not save settings";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !conference) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conference Settings</CardTitle>
          <CardDescription>
            Delegates can only register once Registration status is set to Open below — this is also what
            controls whether the conference shows up on the public Discover page and the delegate registration
            picker.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Conference name</Label>
              <Input id="name" name="name" defaultValue={conference.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acronym">Acronym</Label>
              <Input id="acronym" name="acronym" defaultValue={conference.acronym || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              <Input id="institution" name="institution" defaultValue={conference.institution || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" defaultValue={conference.location || ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={conference.description || ""} rows={3} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={conference.start_date?.slice(0, 10)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={conference.end_date?.slice(0, 10)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationDeadline">Registration deadline</Label>
              <Input
                id="registrationDeadline" name="registrationDeadline" type="date"
                defaultValue={conference.registration_deadline?.slice(0, 10)} required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="maxDelegates">Max delegates</Label>
              <Input id="maxDelegates" name="maxDelegates" type="number" min={1} defaultValue={conference.max_delegates ?? ""} />
            </div>
            <div className="space-y-2">
              <Label>Conference status</Label>
              <Select items={STATUS_ITEMS} value={status} onValueChange={(v) => setStatus(v as Conference["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_ITEMS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Registration status</Label>
              <Select
                items={REGISTRATION_ITEMS} value={registrationStatus}
                onValueChange={(v) => setRegistrationStatus(v as Conference["registration_status"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REGISTRATION_ITEMS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Publicly listed</p>
              <p className="text-xs text-muted-foreground">Show this conference on the public Discover page.</p>
            </div>
            <Switch checked={isPubliclyListed} onCheckedChange={setIsPubliclyListed} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Allow rejected delegates to reapply</p>
              <p className="text-xs text-muted-foreground">
                A rejected delegate can submit the registration form again with corrected details — their old
                application is replaced, not edited.
              </p>
            </div>
            <Switch checked={allowReapplication} onCheckedChange={setAllowReapplication} />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          <Save className="mr-1.5 h-4 w-4" /> {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
