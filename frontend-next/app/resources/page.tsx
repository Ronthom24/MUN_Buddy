"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen, FileText, Gavel, Newspaper, Scale, Search, Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PublicNav, PublicFooter } from "@/components/public-nav";

const RESOURCES = [
  {
    icon: BookOpen,
    category: "Delegates",
    title: "Delegate Handbook",
    text: "Everything a first-time delegate needs — from registration to walking into committee prepared.",
  },
  {
    icon: Users,
    category: "Organizers",
    title: "Organizer Guide",
    text: "How to structure your organization, launch a conference, and run registration end to end.",
  },
  {
    icon: Gavel,
    category: "Chairs",
    title: "Chair Guide",
    text: "Running sessions, moderating debate, and using the schedule and attendance tools as a chair.",
  },
  {
    icon: Scale,
    category: "Reference",
    title: "Rules of Procedure",
    text: "A plain-language walkthrough of standard parliamentary procedure used across MUN committees.",
  },
  {
    icon: FileText,
    category: "Delegates",
    title: "Position Paper Guide",
    text: "Structure, research, and formatting guidance for writing a strong position paper.",
  },
  {
    icon: Newspaper,
    category: "Reading",
    title: "Blog Articles",
    text: "Notes on running better conferences, delegate prep, and what's new on the platform.",
  },
];

const FAQS = [
  { q: "Do I need an account to browse conferences?", a: "No — the conference and organization directories are open to everyone. You only need an account to register as a delegate or organize a conference." },
  { q: "Is MUN Buddy free to use?", a: "Yes, the Starter plan is free for a single organization running one conference at a time. See the Pricing page for details on larger plans." },
  { q: "How do I verify a certificate?", a: "Use the Certificate Verification tool in the footer, or go to /verify and enter the certificate number." },
];

export default function ResourcesPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return RESOURCES;
    return RESOURCES.filter((r) => r.title.toLowerCase().includes(q) || r.text.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <section className="border-b border-border/70 bg-muted/30">
        <div className="mx-auto max-w-[1440px] px-6 py-14 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">Resources</p>
          <h1 className="mx-auto mt-1 max-w-2xl font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Learning resources for delegates, chairs, and organizers
          </h1>
          <div className="relative mx-auto mt-6 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search resources..." className="bg-background pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-14">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No resources match "{search}".</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <Card key={r.title} className="h-full transition-shadow hover:shadow-md">
                <CardContent className="space-y-3 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-navy text-brand-gold">
                      <r.icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline">{r.category}</Badge>
                  </div>
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-sm text-muted-foreground">{r.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div id="faq" className="mx-auto mt-20 max-w-3xl scroll-mt-24">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">FAQ</p>
            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Common questions</h2>
          </div>
          <Card>
            <CardContent className="divide-y p-0">
              {FAQS.map((f) => (
                <div key={f.q} className="p-6">
                  <p className="font-medium">{f.q}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.a}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Have a conference-specific question? Check the FAQs on that conference's{" "}
            <Link href="/discover" className="text-primary hover:underline">page</Link>.
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
