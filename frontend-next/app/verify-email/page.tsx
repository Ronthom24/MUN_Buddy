"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoBadge } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiRequestError } from "@/lib/api";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailFallback() {
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
          <Skeleton className="mx-auto h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const type = params.get("type") === "delegate" ? "delegate" : "organizer";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing a token.");
      return;
    }
    api
      .post<{ success: true; message: string }>("/auth/email/verify", { token })
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiRequestError ? err.message : "Something went wrong");
      });
  }, [token]);

  const loginHref = type === "delegate" ? "/delegate/login" : "/login";

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
          {status === "loading" && <Skeleton className="mx-auto h-24 w-full" />}
          {status === "success" && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
              <CardDescription>{message}</CardDescription>
              <Button className="w-full" render={<Link href={loginHref} />} nativeButton={false}>
                Go to sign in
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="mx-auto h-10 w-10 text-destructive" />
              <CardDescription>{message}</CardDescription>
              <Button variant="outline" className="w-full" render={<Link href={loginHref} />} nativeButton={false}>
                Back to sign in
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
