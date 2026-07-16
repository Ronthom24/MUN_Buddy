"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

const TYPE_DOT: Record<string, string> = {
  info: "bg-blue-500",
  reminder: "bg-amber-500",
  warning: "bg-orange-500",
  success: "bg-emerald-500",
  critical: "bg-red-500",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        api.get<{ success: true; notifications: AppNotification[] }>("/notifications/me"),
        api.get<{ success: true; count: number }>("/notifications/me/unread-count"),
      ]);
      setNotifications(listRes.notifications);
      setUnreadCount(countRes.count);
    } catch {
      // Silent: the bell is a convenience surface, not critical-path UI.
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleMarkRead(id: number) {
    await api.patch(`/notifications/${id}/read`);
    await load();
  }

  async function handleMarkAllRead() {
    await api.post("/notifications/me/read-all");
    await load();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-medium">Notifications</p>
          {unreadCount > 0 && (
            <Button variant="ghost" size="xs" onClick={handleMarkAllRead}>
              <Check className="mr-1 h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                href={n.link || "#"}
                onClick={() => {
                  if (!n.read_at) handleMarkRead(n.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex gap-2 border-b px-3 py-2.5 text-sm last:border-b-0 hover:bg-muted/60",
                  !n.read_at && "bg-muted/40"
                )}
              >
                <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", TYPE_DOT[n.type] || "bg-muted-foreground")} />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{n.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{n.message}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </span>
              </Link>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
