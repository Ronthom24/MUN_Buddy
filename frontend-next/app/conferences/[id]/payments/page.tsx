"use client";

import { Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Payments is disabled for now (frontend-only) -- the full implementation is
// still in git history and reachable again by reverting this file.
export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">Fee structures, transactions, refunds, and discounts.</p>
      </div>

      <Card>
        <CardHeader className="items-center text-center">
          <Wallet className="mb-2 h-8 w-8 text-muted-foreground" />
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            Payments is under development and temporarily disabled for this conference.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
