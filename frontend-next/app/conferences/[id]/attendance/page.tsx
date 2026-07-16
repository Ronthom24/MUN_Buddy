"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, CheckCircle2, Circle, QrCode, ScanLine, UserCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, ApiRequestError } from "@/lib/api";
import type { AttendanceAnalytics, AttendanceRosterEntry, ScheduleDay, ScheduleEvent } from "@/lib/types";

export default function AttendancePage() {
  const params = useParams<{ id: string }>();
  const conferenceId = params.id;

  const [days, setDays] = useState<ScheduleDay[]>([]);
  const [analytics, setAnalytics] = useState<AttendanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState<ScheduleEvent | null>(null);
  const [roster, setRoster] = useState<AttendanceRosterEntry[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [tokenSubmitting, setTokenSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [scheduleRes, analyticsRes] = await Promise.all([
        api.get<{ success: true; days: ScheduleDay[] }>(`/conferences/${conferenceId}/schedule`),
        api.get<{ success: true; analytics: AttendanceAnalytics }>(`/conferences/${conferenceId}/attendance/analytics`),
      ]);
      setDays(scheduleRes.days);
      setAnalytics(analyticsRes.analytics);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    load();
  }, [load]);

  const rateFor = (eventId: number) => analytics?.events.find((e) => e.scheduleEventId === eventId);

  async function openRoster(event: ScheduleEvent) {
    setActiveEvent(event);
    setTokenInput("");
    setRosterLoading(true);
    try {
      const res = await api.get<{ success: true; roster: AttendanceRosterEntry[] }>(
        `/conferences/${conferenceId}/schedule/events/${event.id}/attendance`
      );
      setRoster(res.roster);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load roster");
    } finally {
      setRosterLoading(false);
    }
  }

  async function toggleCheckIn(delegateId: number, checkedIn: boolean) {
    if (!activeEvent) return;
    try {
      if (checkedIn) {
        await api.delete(`/conferences/${conferenceId}/schedule/events/${activeEvent.id}/attendance/${delegateId}`);
      } else {
        await api.post(`/conferences/${conferenceId}/schedule/events/${activeEvent.id}/attendance/check-in`, { delegateId });
      }
      setRoster((prev) =>
        prev.map((r) => (r.delegateId === delegateId ? { ...r, checkedIn: !checkedIn, checkedInAt: !checkedIn ? new Date().toISOString() : null } : r))
      );
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not update check-in");
    }
  }

  async function submitToken(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeEvent || !tokenInput.trim()) return;
    setTokenSubmitting(true);
    try {
      const res = await api.post<{ success: true; alreadyCheckedIn: boolean; delegateName: string }>(
        `/conferences/${conferenceId}/schedule/events/${activeEvent.id}/attendance/check-in`,
        { token: tokenInput.trim() }
      );
      toast.success(res.alreadyCheckedIn ? `${res.delegateName} was already checked in` : `${res.delegateName} checked in`);
      setTokenInput("");
      await openRoster(activeEvent);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Check-in code not recognized");
    } finally {
      setTokenSubmitting(false);
    }
  }

  const checkedInCount = roster.filter((r) => r.checkedIn).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<UserCheck className="h-4 w-4" />}
          label="Overall attendance rate"
          value={analytics ? `${Math.round(analytics.overallAttendanceRate * 100)}%` : undefined}
          loading={loading}
        />
        <StatCard
          icon={<CalendarClock className="h-4 w-4" />}
          label="Sessions tracked"
          value={analytics ? String(analytics.events.length) : undefined}
          loading={loading}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Total check-ins"
          value={analytics ? String(analytics.events.reduce((sum, e) => sum + e.checkedInCount, 0)) : undefined}
          loading={loading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session check-in</CardTitle>
          <CardDescription>Check delegates in manually, or scan/paste their QR check-in code.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : days.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No schedule sessions yet — add them under Schedule first.</p>
          ) : (
            <div className="space-y-5">
              {days.map((day) => (
                <div key={day.id}>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    {day.label || "Untitled day"} · {new Date(day.day_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                  <div className="space-y-2">
                    {day.events.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No sessions.</p>
                    ) : (
                      day.events.map((event) => {
                        const rate = rateFor(event.id);
                        return (
                          <div key={event.id} className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{event.title}</p>
                                {event.committee_name && <Badge variant="outline">{event.committee_name}</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {event.start_time.slice(0, 5)}–{event.end_time.slice(0, 5)}
                                {rate ? ` · ${rate.checkedInCount}/${rate.expectedCount} checked in` : ""}
                              </p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => openRoster(event)}>
                              <ScanLine className="mr-1 h-3.5 w-3.5" /> Check in
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(activeEvent)} onOpenChange={(open) => !open && setActiveEvent(null)}>
        <DialogContent className="sm:max-w-md">
          {activeEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{activeEvent.title}</DialogTitle>
                <DialogDescription>
                  {checkedInCount}/{roster.length} checked in
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={submitToken} className="flex gap-2">
                <Input
                  autoFocus
                  placeholder="Scan or paste check-in code"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                />
                <Button type="submit" size="sm" disabled={tokenSubmitting || !tokenInput.trim()}>
                  <QrCode className="h-4 w-4" />
                </Button>
              </form>

              <div className="max-h-72 space-y-1 overflow-y-auto">
                {rosterLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : roster.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No delegates expected for this session.</p>
                ) : (
                  roster.map((entry) => (
                    <button
                      key={entry.delegateId}
                      type="button"
                      onClick={() => toggleCheckIn(entry.delegateId, entry.checkedIn)}
                      className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-muted/60"
                    >
                      <span className="flex items-center gap-2">
                        {entry.checkedIn ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        {entry.delegateName}
                      </span>
                      {entry.checkedIn && entry.checkedInAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.checkedInAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | undefined;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="mt-1 h-7 w-16" /> : <p className="text-2xl font-semibold">{value ?? "—"}</p>}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>
      </CardContent>
    </Card>
  );
}
