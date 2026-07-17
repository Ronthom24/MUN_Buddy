"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoBadge } from "@/components/logo";
import { useDelegateAuth } from "@/lib/delegate-auth-context";
import { api, ApiRequestError } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

const UNVERIFIED_MESSAGE = "Please verify your email before logging in. Check your inbox for the verification link.";

export default function DelegateLoginPage() {
  const { login } = useDelegateAuth();
  const [submitting, setSubmitting] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setUnverifiedEmail(null);
    try {
      await login(values.email, values.password);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Something went wrong";
      if (message === UNVERIFIED_MESSAGE) setUnverifiedEmail(values.email);
      toast.error("Login failed", { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  async function resendVerification() {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      await api.post("/auth/email/resend", { email: unverifiedEmail, accountType: "delegate" });
      toast.success("Verification email sent", { description: "Check your inbox." });
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-gradient-to-b from-brand-navy/5 to-background px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-2 block w-fit transition-opacity hover:opacity-80">
            <LogoBadge size={72} />
          </Link>
          <CardTitle className="text-2xl font-semibold">Delegate sign in</CardTitle>
          <CardDescription>Access your committee, portfolio, and conference resources.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-primary underline-offset-4 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            {unverifiedEmail && (
              <div className="rounded-md border border-warning/40 bg-warning/5 p-3 text-sm">
                <p className="text-foreground/80">Your email isn&apos;t verified yet.</p>
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={resending}
                  className="mt-1 font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend verification email"}
                </button>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New delegate?{" "}
            <Link href="/delegate/register" className="font-medium text-primary underline-offset-4 hover:underline">
              Register for a conference
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Organizing a conference?{" "}
            <Link href="/login" className="underline-offset-4 hover:underline">
              Organizer sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
