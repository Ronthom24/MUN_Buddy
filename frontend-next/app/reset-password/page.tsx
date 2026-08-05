"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoBadge } from "@/components/logo";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const PASSWORD_RULE = /^(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/;

const schema = z
  .object({
    newPassword: z.string().regex(PASSWORD_RULE, "At least 6 characters, with a number and a special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [checkingLink, setCheckingLink] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    // Supabase's browser client parses the recovery tokens out of the URL
    // (appended by the emailed link) on init and exchanges them for a
    // session -- by the time PASSWORD_RECOVERY fires, or a session already
    // exists, the link is valid and updateUser() will work.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasRecoverySession(true);
        setCheckingLink(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasRecoverySession(true);
      setCheckingLink(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: values.newPassword });
      if (updateError) throw updateError;
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-gradient-to-b from-brand-navy/5 to-background px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-2 block w-fit transition-opacity hover:opacity-80">
            <LogoBadge size={72} />
          </Link>
          <CardTitle className="text-2xl font-semibold">Set a new password</CardTitle>
          {!done && <CardDescription>Choose a new password for your account.</CardDescription>}
        </CardHeader>
        <CardContent>
          {checkingLink ? (
            <p className="text-center text-sm text-muted-foreground">Checking your reset link...</p>
          ) : done ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
              <p className="text-sm text-muted-foreground">Your password has been reset.</p>
              <Button className="w-full" render={<Link href="/login" />} nativeButton={false}>
                Go to sign in
              </Button>
            </div>
          ) : !hasRecoverySession ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-destructive">
                This reset link is invalid or has expired. Request a new one to continue.
              </p>
              <Button className="w-full" render={<Link href="/forgot-password" />} nativeButton={false}>
                Request a new link
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input id="newPassword" type="password" {...register("newPassword")} />
                {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Resetting..." : "Reset password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
