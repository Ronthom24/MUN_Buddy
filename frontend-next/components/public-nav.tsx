"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LogoWordmark, LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Conferences" },
  { href: "/organizations", label: "Organizations" },
  { href: "/resources", label: "Resources" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export function PublicNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 h-20 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-6">
        <Link href="/" className="shrink-0">
          <LogoWordmark size={38} />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground lg:flex">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative py-1 transition-colors hover:text-foreground",
                  isActive && "text-foreground after:absolute after:-bottom-[27px] after:left-0 after:h-0.5 after:w-full after:bg-brand-gold"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/delegate/login" className="text-sm font-medium text-brand-gold-dark hover:underline">
            Delegate login
          </Link>
          <Button variant="ghost" size="sm" render={<Link href="/login" />} nativeButton={false}>
            Log in
          </Button>
          <Button size="sm" variant="accent" render={<Link href="/register" />} nativeButton={false}>
            Get Started
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Open menu" className="lg:hidden" />
            }
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-4/5 border-l border-border bg-background p-0 sm:max-w-xs">
            <SheetHeader className="border-b border-border/70 px-5 py-4">
              <SheetTitle>
                <LogoWordmark size={30} />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-3 py-4">
              {NAV_LINKS.map((link) => (
                <SheetClose
                  key={link.href}
                  render={<Link href={link.href} />}
                  nativeButton={false}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground",
                    (link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href)) &&
                      "bg-muted text-foreground"
                  )}
                >
                  {link.label}
                </SheetClose>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2 border-t border-border/70 px-5 py-4">
              <Button variant="outline" render={<Link href="/login" />} nativeButton={false}>
                Log in
              </Button>
              <Button variant="accent" render={<Link href="/register" />} nativeButton={false}>
                Get Started
              </Button>
              <Link
                href="/delegate/login"
                className="mt-1 text-center text-xs text-muted-foreground underline-offset-4 hover:text-brand-navy hover:underline"
              >
                Delegate sign in
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

const FOOTER_COLUMNS: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/about#contact", label: "Contact" },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/pricing", label: "Pricing" },
      { href: "/#features", label: "Features" },
      { href: "/resources", label: "Resources" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/terms", label: "Terms & Conditions" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/resources", label: "Help Center" },
      { href: "/resources#faq", label: "FAQ" },
    ],
  },
  {
    title: "Utilities",
    links: [
      { href: "/verify", label: "Certificate Verification" },
      { href: "/status", label: "Platform Status" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border/70 bg-brand-navy text-brand-gold-soft/80">
      <div className="mx-auto max-w-[1440px] px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_repeat(5,1fr)]">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <LogoMark size={32} />
              <span className="font-heading text-lg font-bold text-white">
                MUN <span className="text-brand-gold">Buddy</span>
              </span>
            </div>
            <p className="max-w-sm text-sm text-brand-gold-soft/70">
              The operating system for Model United Nations conferences — registration, committees,
              payments, certificates, and communication, all in one place.
            </p>
            <p className="flex items-center gap-1.5 pt-1 text-xs text-brand-gold-soft/60">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-gold" /> Trusted by MUN societies worldwide
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="space-y-2.5 text-sm">
              <p className="font-semibold text-white">{col.title}</p>
              {col.links.map((link) => (
                <Link key={link.href} href={link.href} className="block text-brand-gold-soft/70 transition-colors hover:text-brand-gold">
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-brand-gold-soft/50 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} MUN Buddy. Model United Nations conference management.</span>
          <span className="flex items-center gap-4">
            <Link href="/login" className="hover:text-brand-gold">Organizer login</Link>
            <Link href="/delegate/login" className="hover:text-brand-gold">Delegate login</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
