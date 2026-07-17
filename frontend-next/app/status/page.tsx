"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PublicNav, PublicFooter } from "@/components/public-nav";

type Status = "checking" | "up" | "down";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
const HEALTH_URL = `${API_BASE_URL.replace(/\/api\/?$/, "")}/health`;

const SERVICES = [
  { name: "Public website", key: "web" as const },
  { name: "API & authentication", key: "api" as const },
];

export default function StatusPage() {
  const [apiStatus, setApiStatus] = useState<Status>("checking");

  useEffect(() => {
    fetch(HEALTH_URL)
      .then((res) => setApiStatus(res.ok ? "up" : "down"))
      .catch(() => setApiStatus("down"));
  }, []);

  const statusFor = (key: string): Status => (key === "web" ? "up" : apiStatus);
  const allUp = SERVICES.every((s) => statusFor(s.key) === "up");

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">Platform Status</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight">
            {apiStatus === "checking" ? "Checking systems…" : allUp ? "All systems operational" : "Some systems are degraded"}
          </h1>
        </div>

        <Card className="mt-10">
          <CardContent className="divide-y p-0">
            {SERVICES.map((s) => {
              const status = statusFor(s.key);
              return (
                <div key={s.key} className="flex items-center justify-between p-5">
                  <span className="font-medium">{s.name}</span>
                  {status === "checking" && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Checking
                    </span>
                  )}
                  {status === "up" && (
                    <span className="flex items-center gap-1.5 text-sm text-success">
                      <CheckCircle2 className="h-4 w-4" /> Operational
                    </span>
                  )}
                  {status === "down" && (
                    <span className="flex items-center gap-1.5 text-sm text-destructive">
                      <XCircle className="h-4 w-4" /> Unavailable
                    </span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          This page reflects a live check of the API health endpoint at load time.
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}
