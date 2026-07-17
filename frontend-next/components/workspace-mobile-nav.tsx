"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";

export interface WorkspaceNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface WorkspaceMobileNavProps {
  subtitle: string;
  items: WorkspaceNavItem[];
  pathname: string | null;
  isActive?: (item: WorkspaceNavItem, pathname: string | null) => boolean;
  footer?: React.ReactNode;
}

export function WorkspaceMobileNav({ subtitle, items, pathname, isActive, footer }: WorkspaceMobileNavProps) {
  const [open, setOpen] = useState(false);

  function active(item: WorkspaceNavItem) {
    if (isActive) return isActive(item, pathname);
    return item.exact ? pathname === item.href : pathname?.startsWith(item.href);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" className="md:hidden" />}>
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-4/5 flex-col border-r border-sidebar-border bg-sidebar p-0 text-sidebar-foreground sm:max-w-xs"
      >
        <SheetHeader className="flex-row items-center gap-2.5 border-b border-sidebar-border px-5 py-4">
          <LogoMark size={32} />
          <div>
            <SheetTitle className="text-sm font-semibold leading-none text-sidebar-foreground">MUN Buddy</SheetTitle>
            <p className="text-xs text-sidebar-foreground/60">{subtitle}</p>
          </div>
        </SheetHeader>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {items.map((item) => (
            <SheetClose
              key={item.href}
              render={<Link href={item.href} />}
              nativeButton={false}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active(item)
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </SheetClose>
          ))}
        </nav>

        {footer && <div className="border-t border-sidebar-border p-3">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
