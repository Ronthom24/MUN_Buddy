"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoBadge } from "@/components/logo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiRequestError } from "@/lib/api";
import { useDelegateAuth } from "@/lib/delegate-auth-context";
import type { Committee, Portfolio } from "@/lib/types";

const PASSWORD_RULE = /^(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/;

interface OpenConference {
  id: number;
  name: string;
  acronym: string | null;
  start_date: string;
  end_date: string;
}

/** Up to 3 ranked committee choices; each optionally names a preferred
 * portfolio (country/position slot) WITHIN that committee -- portfolios
 * only exist scoped to one committee, so the portfolio choice for rank N
 * only makes sense once a committee is picked for rank N. */
const PREFERENCE_RANKS = [1, 2, 3] as const;
type PreferenceDraft = { committeeId?: number; portfolioId?: number };

const schema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email"),
    password: z.string().regex(PASSWORD_RULE, "At least 6 characters, with a number and a special character"),
    confirmPassword: z.string(),
    conferenceId: z.string().min(1, "Select a conference"),
    school: z.string().optional(),
    grade: z.string().optional(),
    munExperience: z.enum(["beginner", "1-3", "4-10", "10+"]),
    profileText: z.string().optional(),
    specialNotes: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function DelegateRegisterPage() {
  const { register: registerDelegate } = useDelegateAuth();
  const [submitting, setSubmitting] = useState(false);
  const [conferences, setConferences] = useState<OpenConference[]>([]);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [devVerifyLink, setDevVerifyLink] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { munExperience: "beginner" } });

  const conferenceId = watch("conferenceId");
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [portfoliosByCommittee, setPortfoliosByCommittee] = useState<Record<number, Portfolio[]>>({});
  const [preferences, setPreferences] = useState<PreferenceDraft[]>([{}, {}, {}]);

  useEffect(() => {
    api
      .get<{ success: true; conferences: OpenConference[] }>("/conferences/open")
      .then((res) => setConferences(res.conferences))
      .catch(() => toast.error("Could not load open conferences"));
  }, []);

  // Committees (and which portfolios exist within each) are entirely
  // conference-specific, so they can only be loaded once a conference is
  // picked -- these two endpoints don't require login, matching every other
  // read the pre-account registration flow needs.
  useEffect(() => {
    if (!conferenceId) {
      setCommittees([]);
      setPreferences([{}, {}, {}]);
      return;
    }
    api
      .get<{ success: true; committees: Committee[] }>(`/conferences/${conferenceId}/committees`)
      .then((res) => setCommittees(res.committees))
      .catch(() => toast.error("Could not load this conference's committees"));
    setPortfoliosByCommittee({});
    setPreferences([{}, {}, {}]);
  }, [conferenceId]);

  function setPreference(index: number, patch: PreferenceDraft) {
    setPreferences((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  async function loadPortfolios(committeeId: number) {
    if (portfoliosByCommittee[committeeId]) return;
    try {
      const res = await api.get<{ success: true; portfolios: Portfolio[] }>(`/committees/${committeeId}/portfolios`);
      setPortfoliosByCommittee((prev) => ({ ...prev, [committeeId]: res.portfolios }));
    } catch {
      toast.error("Could not load portfolios for that committee");
    }
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const committeePreferences = preferences
        .map((pref, i) => (pref.committeeId ? { rank: i + 1, committeeId: pref.committeeId, portfolioId: pref.portfolioId } : null))
        .filter((p): p is { rank: number; committeeId: number; portfolioId: number | undefined } => p !== null);

      const { verificationRequired, devVerifyLink: link } = await registerDelegate({
        ...values, conferenceId: Number(values.conferenceId), committeePreferences
      });
      if (verificationRequired) {
        setSubmittedEmail(values.email);
        setDevVerifyLink(link);
      }
      toast.success("Application submitted");
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Something went wrong";
      toast.error("Registration failed", { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedEmail) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-gradient-to-b from-brand-navy/5 to-background px-4 py-12">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-brand-navy text-brand-gold">
              <MailCheck className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-semibold">Check your email</CardTitle>
            <CardDescription>
              We sent a verification link to <span className="font-medium text-foreground">{submittedEmail}</span>.
              Verify your address to activate your account, then sign in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            {devVerifyLink && (
              <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                Dev mode (no SMTP configured yet):{" "}
                <Link href={devVerifyLink} className="text-primary underline-offset-4 hover:underline">
                  click here to verify
                </Link>
              </p>
            )}
            <Button className="w-full" render={<Link href="/delegate/login" />} nativeButton={false}>
              Go to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-gradient-to-b from-brand-navy/5 to-background px-4 py-12">
      <Card className="w-full max-w-xl shadow-lg">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-2 block w-fit transition-opacity hover:opacity-80">
            <LogoBadge size={72} />
          </Link>
          <CardTitle className="text-2xl font-semibold">Register as a delegate</CardTitle>
          <CardDescription>Apply to a conference and track your application from your workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="conferenceId">Conference</Label>
              <Controller
                name="conferenceId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={(value) => field.onChange(value ?? "")}>
                    <SelectTrigger id="conferenceId" className="w-full">
                      <SelectValue placeholder={conferences.length ? "Select a conference" : "No open conferences"} />
                    </SelectTrigger>
                    <SelectContent>
                      {conferences.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name} {c.acronym ? `(${c.acronym})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.conferenceId && <p className="text-sm text-destructive">{errors.conferenceId.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" {...register("fullName")} />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register("password")} />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="school">School / Institution</Label>
                <Input id="school" {...register("school")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade / Year</Label>
                <Input id="grade" placeholder="e.g. 11th grade, 2nd year" {...register("grade")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="munExperience">MUN experience</Label>
                <Controller
                  name="munExperience"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(value) => field.onChange(value ?? "beginner")}>
                      <SelectTrigger id="munExperience" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner (first conference)</SelectItem>
                        <SelectItem value="1-3">1–3 conferences</SelectItem>
                        <SelectItem value="4-10">4–10 conferences</SelectItem>
                        <SelectItem value="10+">10+ conferences</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {conferenceId && (
              <div className="space-y-3 rounded-md border p-4">
                <div>
                  <p className="text-sm font-medium">Committee &amp; portfolio preferences (optional)</p>
                  <p className="text-xs text-muted-foreground">
                    Rank up to 3 committees. Pick a portfolio too if you already know which country/role you want in
                    that committee — the organizer will use this as a starting point when assigning you.
                  </p>
                </div>
                {PREFERENCE_RANKS.map((rank) => {
                  const index = rank - 1;
                  const draft = preferences[index] ?? {};
                  const portfolioOptions = draft.committeeId ? portfoliosByCommittee[draft.committeeId] || [] : [];
                  return (
                    <div key={rank} className="grid gap-2 sm:grid-cols-[auto_1fr_1fr] sm:items-center">
                      <span className="text-sm text-muted-foreground">Choice {rank}</span>
                      <Select
                        items={Object.fromEntries(committees.map((c) => [String(c.id), c.name]))}
                        value={draft.committeeId ? String(draft.committeeId) : ""}
                        onValueChange={(value) => {
                          const committeeId = value ? Number(value) : undefined;
                          setPreference(index, { committeeId, portfolioId: undefined });
                          if (committeeId) loadPortfolios(committeeId);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select committee" />
                        </SelectTrigger>
                        <SelectContent>
                          {committees.map((committee) => (
                            <SelectItem key={committee.id} value={String(committee.id)}>
                              {committee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        items={Object.fromEntries(portfolioOptions.map((p) => [String(p.id), p.name]))}
                        value={draft.portfolioId ? String(draft.portfolioId) : ""}
                        onValueChange={(value) => setPreference(index, { portfolioId: value ? Number(value) : undefined })}
                        disabled={!draft.committeeId}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Portfolio (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {portfolioOptions.map((portfolio) => (
                            <SelectItem key={portfolio.id} value={String(portfolio.id)}>
                              {portfolio.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="profileText">Why do you want to participate? (optional)</Label>
              <Textarea id="profileText" rows={3} {...register("profileText")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialNotes">Special requirements or notes for organizers (optional)</Label>
              <Textarea
                id="specialNotes"
                rows={2}
                placeholder="Dietary restrictions, accessibility needs, etc."
                {...register("specialNotes")}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit application"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link href="/delegate/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
