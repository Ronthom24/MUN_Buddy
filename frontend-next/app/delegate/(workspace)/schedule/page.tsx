"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiRequestError } from "@/lib/api";
import type { ScheduleDay } from "@/lib/types";

const TYPE_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  ceremony: "default",
  committee_session: "secondary",
  general_event: "secondary",
};

export default function DelegateSchedulePage() {
  const [days, setDays] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ success: true; days: ScheduleDay[] }>("/delegates/me/schedule")
      .then((res) => setDays(res.days))
      .catch((err) => toast.error(err instanceof ApiRequestError ? err.message : "Failed to load schedule"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Conference Schedule</h1>
        <p className="text-muted-foreground">Sessions, ceremonies, and events for your conference.</p>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : days.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <CalendarClock className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">The schedule hasn't been published yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <Card key={day.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {day.label || "Schedule"}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">{formatDate(day.day_date)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {day.events.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No events yet.</p>
                ) : (
                  <div className="space-y-3">
                    {day.events.map((event, i) => (
                      <div key={event.id}>
                        {i > 0 && <Separator className="mb-3" />}
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{event.title}</p>
                          <Badge variant={TYPE_VARIANT[event.type]}>{event.type.replace("_", " ")}</Badge>
                          {event.committee_name && <Badge variant="outline">{event.committee_name}</Badge>}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.start_time.slice(0, 5)}–{event.end_time.slice(0, 5)}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
