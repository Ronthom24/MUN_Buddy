"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Bell, CalendarDays, Gavel, Megaphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api, ApiRequestError } from "@/lib/api";
import type { Announcement, DelegateProfile } from "@/lib/types";

const STATUS_COPY: Record<string, { label: string; description: string; variant: "secondary" | "default" | "destructive" | "outline" }> = {
  pending: { label: "Pending Review", description: "Your application is being reviewed by the organizing team.", variant: "secondary" },
  approved: { label: "Approved", description: "You're in! Your committee and portfolio will appear here once assigned.", variant: "default" },
  waitlisted: { label: "Waitlisted", description: "You're on the waitlist. You'll be notified if a seat opens up.", variant: "outline" },
  rejected: { label: "Not Approved", description: "Your application was not approved for this conference.", variant: "destructive" },
  withdrawn: { label: "Withdrawn", description: "This application has been withdrawn.", variant: "outline" },
};

export default function DelegateDashboardPage() {
  const [profile, setProfile] = useState<DelegateProfile | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, announcementsRes] = await Promise.all([
          api.get<{ success: true } & DelegateProfile>("/delegates/me"),
          api.get<{ success: true; announcements: Announcement[] }>("/delegates/me/announcements"),
        ]);
        setProfile(profileRes);
        setAnnouncements(announcementsRes.announcements.slice(0, 3));
      } catch (err) {
        const message = err instanceof ApiRequestError ? err.message : "Failed to load your dashboard";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !profile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const statusInfo = STATUS_COPY[profile.delegate.status] ?? STATUS_COPY.pending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {profile.delegate.fullName.split(" ")[0]}</h1>
        <p className="text-muted-foreground">{profile.conference?.name ?? "No active conference"}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="sm:col-span-2">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <p className="text-sm text-muted-foreground">Application status</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={statusInfo.variant} className="text-sm">
                  {statusInfo.label}
                </Badge>
              </div>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">{statusInfo.description}</p>
            </div>
            {profile.assignment.published && (
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-lg font-semibold">{profile.assignment.committee}</p>
                  <p className="text-xs text-muted-foreground">Committee</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{profile.assignment.portfolio}</p>
                  <p className="text-xs text-muted-foreground">Portfolio</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gavel className="h-4 w-4" /> Your Committee
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile.assignment.published ? (
              <div>
                <p className="font-medium">{profile.assignment.committee}</p>
                <p className="text-sm text-muted-foreground">as {profile.assignment.portfolio}</p>
                <Button render={<Link href="/delegate/committee" />} nativeButton={false} variant="link" className="mt-1 h-auto p-0">
                  View committee details →
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Not yet assigned. Check back once the organizing team completes assignments.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4" /> Conference Dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {profile.conference ? profile.conference.name : "Not assigned to a conference yet."}
            </p>
            <Button render={<Link href="/delegate/schedule" />} nativeButton={false} variant="link" className="mt-1 h-auto p-0">
              View schedule →
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4" /> Recent Announcements
            </CardTitle>
            <CardDescription>The latest updates from your organizing team.</CardDescription>
          </div>
          <Button render={<Link href="/delegate/announcements" />} nativeButton={false} size="sm" variant="outline">
            View all
          </Button>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Bell className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{a.title}</p>
                    {a.priority !== "normal" && (
                      <Badge variant={a.priority === "urgent" ? "destructive" : "outline"}>{a.priority}</Badge>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
