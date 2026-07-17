"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoBadge } from "@/components/logo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, ApiRequestError } from "@/lib/api";
import { useDelegateAuth } from "@/lib/delegate-auth-context";

interface OpenConference {
  id: number;
  name: string;
  acronym: string | null;
  start_date: string;
  end_date: string;
}

const schema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "At least 6 characters"),
    confirmPassword: z.string(),
    conferenceId: z.string().min(1, "Select a conference"),
    school: z.string().optional(),
    grade: z.string().optional(),
    munExperience: z.enum(["beginner", "1-3", "4-10", "10+"]),
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

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { munExperience: "beginner" } });

  useEffect(() => {
    api
      .get<{ success: true; conferences: OpenConference[] }>("/conferences/open")
      .then((res) => setConferences(res.conferences))
      .catch(() => toast.error("Could not load open conferences"));
  }, []);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      await registerDelegate({ ...values, conferenceId: Number(values.conferenceId) });
      toast.success("Application submitted");
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Something went wrong";
      toast.error("Registration failed", { description: message });
    } finally {
      setSubmitting(false);
    }
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
