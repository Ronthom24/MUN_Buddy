"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PublicNav() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            MB
          </div>
          <span className="font-semibold">MUN Buddy</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <Link href="/organizations" className="hover:text-foreground">Organizations</Link>
          <Link href="/discover" className="hover:text-foreground">Conferences</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link href="/login" />} nativeButton={false}>
            Organizer sign in
          </Button>
          <Button size="sm" render={<Link href="/register" />} nativeButton={false}>
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} MUN Buddy. Model United Nations conference management.</p>
          <div className="flex gap-4">
            <Link href="/organizations" className="hover:text-foreground">Organizations</Link>
            <Link href="/discover" className="hover:text-foreground">Conferences</Link>
            <Link href="/login" className="hover:text-foreground">Organizer login</Link>
            <Link href="/delegate/login" className="hover:text-foreground">Delegate login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
