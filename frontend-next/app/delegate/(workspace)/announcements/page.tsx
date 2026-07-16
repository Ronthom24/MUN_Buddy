"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiRequestError } from "@/lib/api";
import type { Announcement } from "@/lib/types";

export default function DelegateAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ success: true; announcements: Announcement[] }>("/delegates/me/announcements")
      .then((res) => {
        setAnnouncements(res.announcements);
        res.announcements
          .filter((a) => !a.is_read)
          .forEach((a) => api.post(`/announcements/${a.id}/read`).catch(() => {}));
      })
      .catch((err) => toast.error(err instanceof ApiRequestError ? err.message : "Failed to load announcements"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground">Official updates from your conference organizers.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-0 p-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="mb-4 h-16 w-full" />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Megaphone className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {announcements.map((a) => (
                <div key={a.id} className="p-5">
                  <div className="flex items-center gap-2">
                    {!a.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />}
                    <p className="font-medium">{a.title}</p>
                    {a.priority !== "normal" && (
                      <Badge variant={a.priority === "urgent" ? "destructive" : "outline"}>{a.priority}</Badge>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{a.content}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(a.publish_date || a.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
