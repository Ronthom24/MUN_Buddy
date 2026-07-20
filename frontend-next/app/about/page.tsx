import Link from "next/link";
import { ArrowRight, Compass, Flag, Mail, MapPin, Rocket, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicNav, PublicFooter } from "@/components/public-nav";

const ROADMAP = [
  { label: "Now", title: "Version 1 — Core Platform", text: "Registration, committees, payments, results, certificates, communication, and analytics for every conference." },
  { label: "Next", title: "Version 2 — Intelligence Layer", text: "AI-assisted position paper feedback, smart scheduling, and predictive registration insights." },
  { label: "Later", title: "Version 3 — Ecosystem", text: "Federation-wide analytics, alumni networks, and deeper integrations with institutions." },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      <section className="relative overflow-hidden bg-brand-navy text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: "radial-gradient(circle at 85% 0%, white 0, transparent 45%)" }}
        />
        <div className="relative mx-auto max-w-[1440px] px-6 py-16 text-center sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">About MUN Buddy</p>
          <h1 className="mx-auto mt-2 max-w-2xl font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Built for the people who make Model UN happen
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            MUN Buddy exists so organizers spend their time on debate and diplomacy — not on spreadsheets.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-16">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="space-y-3 p-7">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-navy text-brand-gold">
                <Target className="h-5 w-5" />
              </div>
              <p className="font-heading text-lg font-semibold">Our Mission</p>
              <p className="text-sm text-muted-foreground">
                To give every Model UN organization — from a first-time school club to a national federation — the
                same operating infrastructure that professional conferences run on, without the overhead of
                stitching together five separate tools.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 p-7">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-navy text-brand-gold">
                <Compass className="h-5 w-5" />
              </div>
              <p className="font-heading text-lg font-semibold">Our Vision</p>
              <p className="text-sm text-muted-foreground">
                A world where any student, anywhere, can discover a conference, register, and walk away with a
                verifiable record of their diplomacy — and any organizer can launch one without technical friction.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">Product Story</p>
            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Why we built MUN Buddy</h2>
          </div>
          <div className="mx-auto mt-8 max-w-3xl space-y-4 text-muted-foreground">
            <p>
              Every MUN conference runs the same core operations — registration, committee assignment, payments,
              scheduling, and certificates — yet most organizers rebuild it from scratch every year with Google
              Forms, spreadsheets, and group chats. MUN Buddy started as a way to remove that repeated cost:
              one platform, purpose-built for the full conference lifecycle, from the first delegate application
              to the final certificate download.
            </p>
            <p>
              What began as a registration tool for a single conference grew into a multi-tenant platform for
              organizations running many conferences, with dedicated workspaces for organizers, delegates, and
              — soon — platform administrators.
            </p>
          </div>
        </div>

        <div className="mt-16">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">Roadmap</p>
            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Where we're headed</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {ROADMAP.map((r) => (
              <Card key={r.title} className="h-full border-border/70">
                <CardContent className="space-y-2 p-6">
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-gold-soft px-2.5 py-1 text-xs font-semibold text-brand-navy">
                    <Rocket className="h-3 w-3" /> {r.label}
                  </span>
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-sm text-muted-foreground">{r.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div id="contact" className="mt-20 scroll-mt-24 rounded-2xl bg-muted/40 p-8 sm:p-12">
          <div className="grid gap-8 sm:grid-cols-[1.2fr_1fr] sm:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">Get in touch</p>
              <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                Questions about running your conference on MUN Buddy?
              </h2>
              <p className="mt-3 max-w-lg text-muted-foreground">
                Reach out and our team will help you plan your first conference or migrate an existing one.
              </p>
              <div className="mt-6 flex flex-col gap-2 text-sm">
                <a href="mailto:admin.munbuddy@gmail.com" className="flex items-center gap-2 text-foreground hover:text-brand-navy">
                  <Mail className="h-4 w-4 text-brand-gold" /> admin.munbuddy@gmail.com
                </a>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-brand-gold" /> Remote-first team
                </span>
              </div>
            </div>
            <Card className="border-brand-gold/30">
              <CardContent className="space-y-4 p-7 text-center">
                <Flag className="mx-auto h-8 w-8 text-brand-gold" />
                <p className="font-semibold">Ready to launch your conference?</p>
                <Button size="lg" variant="accent" className="w-full" render={<Link href="/register" />} nativeButton={false}>
                  Create Your Organization <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
