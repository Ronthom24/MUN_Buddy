"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoBadge } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiRequestError } from "@/lib/api";
import type { CertificateVerification } from "@/lib/types";

export default function VerifyCertificatePage() {
  const params = useParams<{ certificateNumber: string }>();
  const certificateNumber = decodeURIComponent(params.certificateNumber);

  const [result, setResult] = useState<CertificateVerification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ success: true } & CertificateVerification>(`/certificates/verify/${encodeURIComponent(certificateNumber)}`)
      .then(setResult)
      .catch((err) => {
        if (err instanceof ApiRequestError) setResult({ valid: false });
      })
      .finally(() => setLoading(false));
  }, [certificateNumber]);

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-gradient-to-b from-brand-navy/5 to-background px-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <LogoBadge size={72} className="mb-2" />
          <CardTitle>Certificate Verification</CardTitle>
          <CardDescription className="font-mono">{certificateNumber}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : result?.valid ? (
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="font-medium text-emerald-700">This certificate is genuine</p>
              <div className="space-y-1 rounded-lg border p-4 text-left text-sm">
                <p>
                  <span className="text-muted-foreground">Issued to </span>
                  <span className="font-medium">{result.delegateName}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Conference </span>
                  <span className="font-medium">{result.conferenceName}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Type </span>
                  <span className="font-medium">{result.certificateType?.replace("_", " ")}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Issued </span>
                  <span className="font-medium">
                    {result.issuedAt &&
                      new Date(result.issuedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <XCircle className="h-6 w-6" />
              </div>
              <p className="font-medium text-destructive">No certificate found with this number</p>
              <p className="text-sm text-muted-foreground">Double-check the certificate number and try again.</p>
            </div>
          )}
          <Link href="/verify" className="mt-4 block text-center text-sm text-muted-foreground underline-offset-4 hover:underline">
            Check another certificate
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
