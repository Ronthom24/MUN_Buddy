"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { CalendarClock, Download, HelpCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicNav, PublicFooter } from "@/components/public-nav";
import { api, ApiRequestError } from "@/lib/api";
import type { Committee, Faq, PublicConference, Resource } from "@/lib/types";

const CTA_LABEL: Record<string, string> = {
  open: "Register Now",
  closed: "Registration Closed",
  invite_only: "Invite Only",
};

export default function ConferenceLandingPage() {
  const params = useParams<{ slug: string }>();
  const [conference, setConference] = useState<PublicConference | null>(null);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    api
      .get<{ success: true; conference: PublicConference; committees: Committee[]; resources: Resource[]; faqs: Faq[] }>(
        `/public/conferences/${params.slug}`
      )
      .then((res) => {
        setConference(res.conference);
        setCommittees(res.committees);
        setResources(res.resources);
        setFaqs(res.faqs);
      })
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 404) setMissing(true);
      })
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (missing) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      {loading ? (
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
          <Skeleton className="h-64 w-full" />
        </main>
      ) : conference ? (
        <>
          <section className="relative overflow-hidden bg-brand-navy text-white">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.08]"
              style={{ backgroundImage: "radial-gradient(circle at 85% 0%, white 0, transparent 45%)" }}
            />
            <div className="relative mx-auto max-w-4xl px-6 py-14">
              <Link href={`/organizations/${conference.organization_slug}`} className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm text-brand-gold-soft hover:bg-white/15">
                {conference.organization_name}
              </Link>
              <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                  {conference.name} {conference.acronym && <span className="text-white/60">({conference.acronym})</span>}
                </h1>
                <Button
                  size="lg"
                  variant="accent"
                  disabled={conference.registration_status !== "open"}
                  render={<Link href="/delegate/register" />}
                  nativeButton={false}
                >
                  {CTA_LABEL[conference.registration_status]}
                </Button>
              </div>
              {conference.description && <p className="mt-3 max-w-2xl text-white/70">{conference.description}</p>}
              <div className="mt-5 flex flex-wrap gap-4 text-sm text-white/70">
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="h-4 w-4 text-brand-gold" />
                  {new Date(conference.start_date).toLocaleDateString()} – {new Date(conference.end_date).toLocaleDateString()}
                </span>
                {conference.location && (
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand-gold" /> {conference.location}</span>
                )}
              </div>
              {conference.registration_deadline && (
                <p className="mt-2 text-xs text-white/50">
                  Registration deadline: {new Date(conference.registration_deadline).toLocaleDateString()}
                </p>
              )}
            </div>
          </section>

          <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
            <Card className="mb-8">
              <CardHeader><CardTitle>Committees ({committees.length})</CardTitle></CardHeader>
              <CardContent>
                {committees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Committees will be announced soon.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {committees.map((c) => (
                      <div key={c.id} className="rounded-md border p-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{c.name}</p>
                          <Badge variant="outline">{c.type}</Badge>
                        </div>
                        {c.chair && <p className="mt-1 text-xs text-muted-foreground">Chaired by {c.chair}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {resources.length > 0 && (
              <Card className="mb-8">
                <CardHeader><CardTitle>Public resources</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {resources.map((r) => (
                    <a
                      key={r.id}
                      href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/resources/${r.id}/download`}
                      className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted/60"
                    >
                      <span>{r.title}</span>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle>Frequently asked questions</CardTitle></CardHeader>
              <CardContent>
                {faqs.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <HelpCircle className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No published FAQs yet.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {faqs.map((f) => (
                      <div key={f.id} className="py-3">
                        <p className="font-medium">{f.question}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{f.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </>
      ) : null}
      <PublicFooter />
    </div>
  );
}
