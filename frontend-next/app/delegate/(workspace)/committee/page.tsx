"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, FileText, Flag, Gavel, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiRequestError } from "@/lib/api";
import type { Agenda, Committee, CommitteeRosterEntry, DelegateProfile, Portfolio } from "@/lib/types";

export default function DelegateCommitteePage() {
  const [profile, setProfile] = useState<DelegateProfile | null>(null);
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [roster, setRoster] = useState<CommitteeRosterEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const profileRes = await api.get<{ success: true } & DelegateProfile>("/delegates/me");
        setProfile(profileRes);

        const committeeId = profileRes.assignment.committeeId;
        if (committeeId) {
          const [committeeRes, agendaRes, portfoliosRes, rosterRes] = await Promise.all([
            api.get<{ success: true; committee: Committee }>(`/committees/${committeeId}`),
            api.get<{ success: true; agendas: Agenda[] }>(`/committees/${committeeId}/agenda`),
            api.get<{ success: true; portfolios: Portfolio[] }>(`/committees/${committeeId}/portfolios`),
            api.get<{ success: true; roster: CommitteeRosterEntry[] }>("/delegates/me/committee-roster"),
          ]);
          setCommittee(committeeRes.committee);
          setAgendas(agendaRes.agendas);
          setPortfolio(portfoliosRes.portfolios.find((p) => p.id === profileRes.assignment.portfolioId) ?? null);
          setRoster(rosterRes.roster);
        }
      } catch (err) {
        const message = err instanceof ApiRequestError ? err.message : "Failed to load your committee";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!profile?.assignment.published || !committee) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <Gavel className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No committee assigned yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Once the organizing team assigns and publishes your committee and portfolio, they'll appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{committee.name}</h1>
              <Badge variant={committee.type === "crisis" ? "destructive" : "secondary"}>{committee.type}</Badge>
            </div>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <Flag className="h-3.5 w-3.5" /> Representing <span className="font-medium text-foreground">{portfolio?.name ?? profile.assignment.portfolio}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            Chair: {committee.chair || "TBA"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" /> Agenda
          </CardTitle>
          <CardDescription>Topics under discussion in this committee.</CardDescription>
        </CardHeader>
        <CardContent>
          {agendas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No agenda items published yet.</p>
          ) : (
            <div className="space-y-4">
              {agendas.map((agenda, i) => (
                <div key={agenda.id}>
                  {i > 0 && <Separator className="mb-4" />}
                  <p className="font-medium">{agenda.title}</p>
                  {agenda.description && <p className="mt-1 text-sm text-muted-foreground">{agenda.description}</p>}
                  {agenda.background_notes && (
                    <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{agenda.background_notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Flag className="h-4 w-4" /> Committee roster
          </CardTitle>
          <CardDescription>
            Every country/seat in {committee.name}, who's representing it, and whether they've checked in today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {roster.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Roster not available yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country / Seat</TableHead>
                  <TableHead>Delegate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Present today</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.map((entry) => (
                  <TableRow key={entry.portfolio_id}>
                    <TableCell className="font-medium">{entry.portfolio_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{entry.delegate_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={entry.assigned ? "default" : "outline"}>
                        {entry.assigned ? "Assigned" : "Unassigned"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.present_today ? (
                        <span className="flex items-center gap-1 text-sm text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Present
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
