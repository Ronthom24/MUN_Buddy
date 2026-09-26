"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, Clock, MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { api, ApiRequestError } from "@/lib/api";
import type { ScheduleDay } from "@/lib/types";

const TYPE_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  ceremony: "default",
  committee_session: "secondary",
  general_event: "secondary",
};

export default function SchedulePage() {
  const params = useParams<{ id: string }>();
  const conferenceId = params.id;

  const [days, setDays] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [eventDialogDay, setEventDialogDay] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let res = await api.get<{ success: true; days: ScheduleDay[] }>(`/conferences/${conferenceId}/schedule`);
      // First time this conference's schedule is opened, there are no days
      // yet -- seed them from the conference's own start/end dates (set in
      // Settings) instead of making the organizer add each day by hand.
      // Safe to call every time the list comes back empty: it's a no-op
      // once days exist, and does nothing if start/end dates aren't set.
      if (res.days.length === 0) {
        try {
          res = await api.post<{ success: true; days: ScheduleDay[] }>(`/conferences/${conferenceId}/schedule/auto-generate`);
        } catch {
          // No start/end date yet, or some other reason it couldn't seed --
          // fall through to the normal empty state rather than blocking load.
        }
      }
      setDays(res.days);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Failed to load schedule";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddDay(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await api.post(`/conferences/${conferenceId}/schedule/days`, {
        dayDate: form.get("dayDate"),
        label: form.get("label") || undefined,
      });
      toast.success("Day added");
      setDayDialogOpen(false);
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not add day";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddEvent(event: React.FormEvent<HTMLFormElement>, dayId: number) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await api.post(`/conferences/${conferenceId}/schedule/days/${dayId}/events`, {
        title: form.get("title"),
        type: form.get("type") || "general_event",
        location: form.get("location") || undefined,
        startTime: form.get("startTime"),
        endTime: form.get("endTime"),
      });
      toast.success("Event added");
      setEventDialogDay(null);
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not add event";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveDay(dayId: number) {
    try {
      await api.delete(`/conferences/${conferenceId}/schedule/days/${dayId}`);
      toast.success("Day removed");
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not remove day";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Conference schedule</CardTitle>
            <CardDescription>Build the day-by-day agenda delegates will see.</CardDescription>
          </div>
          <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="mr-1 h-4 w-4" /> Add day
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddDay}>
                <DialogHeader>
                  <DialogTitle>Add a schedule day</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="dayDate">Date</Label>
                    <Input id="dayDate" name="dayDate" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="label">Label</Label>
                    <Input id="label" name="label" placeholder="Day 1" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Adding..." : "Add day"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : days.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <CalendarClock className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No schedule days yet. Add your first day above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <Card key={day.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">
                    {day.label || "Untitled day"}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">{formatDate(day.day_date)}</span>
                  </CardTitle>
                </div>
                <div className="flex gap-2">
                  <Dialog open={eventDialogDay === day.id} onOpenChange={(open) => setEventDialogDay(open ? day.id : null)}>
                    <DialogTrigger render={<Button size="xs" variant="outline" />}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Event
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={(e) => handleAddEvent(e, day.id)}>
                        <DialogHeader>
                          <DialogTitle>Add event</DialogTitle>
                          <DialogDescription>{day.label || formatDate(day.day_date)}</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" required placeholder="Committee Session I" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="startTime">Start time</Label>
                              <Input id="startTime" name="startTime" type="time" required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="endTime">End time</Label>
                              <Input id="endTime" name="endTime" type="time" required />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" name="location" placeholder="Room 101" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={submitting}>
                            {submitting ? "Adding..." : "Add event"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button size="xs" variant="ghost" onClick={() => handleRemoveDay(day.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {day.events.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No events yet.</p>
                ) : (
                  <div className="space-y-3">
                    {day.events.map((event, i) => (
                      <div key={event.id}>
                        {i > 0 && <Separator className="mb-3" />}
                        <div className="flex items-center justify-between">
                          <div>
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
