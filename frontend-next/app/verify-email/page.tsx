"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoBadge } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseBrowserClient } from "@/lib/supabase";

/**
 * Supabase-direct, like reset-password -- our own backend never sends
 * confirmation emails (registration uses signUp() when
 * REQUIRE_EMAIL_VERIFICATION=true, see authService.js), so this page just
 * detects the session Supabase's client writes to the URL when the emailed
 * confirmation link lands here (PASSWORD_RECOVERY's sibling event for
 * signup confirmation is a plain SIGNED_IN), and immediately signs that
 * throwaway session back out -- our app's real auth is the backend-issued
 * Bearer token (see lib/api.ts), not a Supabase browser session, so there's
 * nothing productive to do with it besides confirm it happened.
 */
export default function VerifyEmailPage() {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    let settled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (settled) return;
      if (event === "SIGNED_IN" && session) {
        settled = true;
        setStatus("success");
        supabase.auth.signOut();
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (settled) return;
      if (data.session) {
        settled = true;
        setStatus("success");
        supabase.auth.signOut();
      } else {
        // Give onAuthStateChange a moment to fire for a link that's still
        // being processed before concluding it's actually invalid.
        setTimeout(() => {
          if (!settled) {
            settled = true;
            setStatus("error");
          }
        }, 2000);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-gradient-to-b from-brand-navy/5 to-background px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-2 block w-fit transition-opacity hover:opacity-80">
            <LogoBadge size={72} />
          </Link>
          <CardTitle className="text-2xl font-semibold">Email verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {status === "loading" && (
            <>
              <Skeleton className="mx-auto h-24 w-full" />
              <CardDescription>Confirming your email...</CardDescription>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
              <CardDescription>Your email is verified. You can now sign in.</CardDescription>
              <div className="space-y-2">
                <Button className="w-full" render={<Link href="/login" />} nativeButton={false}>
                  Sign in as organizer
                </Button>
                <Button variant="outline" className="w-full" render={<Link href="/delegate/login" />} nativeButton={false}>
                  Sign in as delegate
                </Button>
              </div>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="mx-auto h-10 w-10 text-destructive" />
              <CardDescription>
                This verification link is invalid or has expired. Try registering again, or contact support if you
                keep hitting this.
              </CardDescription>
              <Button variant="outline" className="w-full" render={<Link href="/login" />} nativeButton={false}>
                Back to sign in
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
