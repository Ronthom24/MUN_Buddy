"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Award as AwardIcon, Lock, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiRequestError } from "@/lib/api";
import type { DelegateResults } from "@/lib/types";

export default function DelegateResultsPage() {
  const [results, setResults] = useState<DelegateResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ success: true } & DelegateResults>("/delegates/me/results")
      .then(setResults)
      .catch((err) => toast.error(err instanceof ApiRequestError ? err.message : "Failed to load results"))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !results) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Results</h1>
        <p className="text-muted-foreground">Awards and official conference results.</p>
      </div>

      {!results.resultsPublished ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Results have not been published yet</p>
            <p className="text-sm text-muted-foreground">Check back once your organizers publish the conference results.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-4 w-4" /> Your awards
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.ownAwards.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">No awards recorded for you this conference.</p>
              ) : (
                <div className="space-y-3">
                  {results.ownAwards.map((award) => (
                    <div key={award.id} className="rounded-lg border p-4">
                      <Badge>
                        <AwardIcon className="mr-1 h-3 w-3" /> {award.category}
                      </Badge>
                      {award.citation && <p className="mt-2 text-sm text-muted-foreground">{award.citation}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Full conference results</CardTitle>
              <CardDescription>All published awards across every committee.</CardDescription>
            </CardHeader>
            <CardContent>
              {results.allAwards.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">No awards were recorded for this conference.</p>
              ) : (
                <div className="space-y-2">
                  {results.allAwards.map((award) => (
                    <div key={award.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span className="font-medium">{award.delegate_name}</span>
                      <span className="text-muted-foreground">
                        {award.category}
                        {award.committee_name ? ` · ${award.committee_name}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
