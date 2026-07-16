"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, QrCode, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiRequestError } from "@/lib/api";
import type { CheckinToken, DelegateProfile } from "@/lib/types";

export default function DelegateProfilePage() {
  const [profile, setProfile] = useState<DelegateProfile | null>(null);
  const [checkinToken, setCheckinToken] = useState<CheckinToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    api
      .get<{ success: true } & DelegateProfile>("/delegates/me")
      .then(setProfile)
      .catch((err) => toast.error(err instanceof ApiRequestError ? err.message : "Failed to load profile"))
      .finally(() => setLoading(false));

    api
      .get<{ success: true } & CheckinToken>("/delegates/me/checkin-token")
      .then(setCheckinToken)
      .catch(() => {});
  }, []);

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSavingProfile(true);
    try {
      await api.put("/delegates/me", {
        phone: form.get("phone") || undefined,
        school: form.get("school") || undefined,
        grade: form.get("grade") || undefined,
      });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = form.get("newPassword");
    const confirmPassword = form.get("confirmPassword");
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      await api.post("/delegates/me/change-password", {
        currentPassword: form.get("currentPassword"),
        newPassword,
      });
      toast.success("Password updated");
      event.currentTarget.reset();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not update password");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading || !profile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account information.</p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
            {profile.delegate.fullName
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <p className="font-semibold">{profile.delegate.fullName}</p>
            <p className="text-sm text-muted-foreground">{profile.delegate.email}</p>
          </div>
          <Badge className="ml-auto" variant="outline">
            {profile.delegate.status}
          </Badge>
        </CardContent>
      </Card>

      {checkinToken && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode className="h-4 w-4" /> My check-in code
            </CardTitle>
            <CardDescription>Show this at the door to be checked in to sessions.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- a generated data: URL, not an optimizable remote asset */}
            <img src={checkinToken.qrDataUrl} alt="Check-in QR code" className="h-40 w-40 rounded-lg border" />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">No scanner handy? Give the organizer this code:</p>
              <code className="rounded bg-muted px-2 py-1 text-xs">{checkinToken.token}</code>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" /> Personal information
          </CardTitle>
          <CardDescription>These details may be shared with your conference organizers.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Contact number</Label>
                <Input id="phone" name="phone" type="tel" placeholder="+1 555 000 0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school">Institution</Label>
                <Input id="school" name="school" defaultValue={profile.delegate.school ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade / Year</Label>
                <Input id="grade" name="grade" defaultValue={profile.delegate.grade ?? ""} />
              </div>
            </div>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" /> Password
          </CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input id="currentPassword" name="currentPassword" type="password" required />
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input id="newPassword" name="newPassword" type="password" required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} />
              </div>
            </div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? "Updating..." : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
