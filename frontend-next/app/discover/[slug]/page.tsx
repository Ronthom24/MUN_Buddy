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
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : conference ? (
          <>
            <div className="mb-8">
              <Link href={`/organizations/${conference.organization_slug}`} className="text-sm text-primary hover:underline">
                {conference.organization_name}
              </Link>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {conference.name} {conference.acronym && <span className="text-muted-foreground">({conference.acronym})</span>}
                </h1>
                <Button
                  size="lg"
                  disabled={conference.registration_status !== "open"}
                  render={<Link href="/delegate/register" />}
                  nativeButton={false}
                >
                  {CTA_LABEL[conference.registration_status]}
                </Button>
              </div>
              {conference.description && <p className="mt-3 text-muted-foreground">{conference.description}</p>}
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="h-4 w-4" />
                  {new Date(conference.start_date).toLocaleDateString()} – {new Date(conference.end_date).toLocaleDateString()}
                </span>
                {conference.location && (
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {conference.location}</span>
                )}
              </div>
              {conference.registration_deadline && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Registration deadline: {new Date(conference.registration_deadline).toLocaleDateString()}
                </p>
              )}
            </div>

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
          </>
        ) : null}
      </main>
      <PublicFooter />
    </div>
  );
}
