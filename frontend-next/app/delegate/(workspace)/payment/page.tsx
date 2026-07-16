"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, Plus, ShieldCheck, Wallet, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api, ApiRequestError } from "@/lib/api";
import type { DelegatePaymentSummary, DerivedPaymentStatus, PaymentMethod } from "@/lib/types";

const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

const STATUS_COPY: Record<DerivedPaymentStatus, { label: string; description: string; variant: "secondary" | "default" | "outline" | "destructive" }> = {
  not_required: { label: "Not required", description: "This conference does not require payment.", variant: "outline" },
  pending: { label: "Pending", description: "Submit your payment details below.", variant: "secondary" },
  submitted: { label: "Submitted", description: "Your payment is awaiting organizer review.", variant: "secondary" },
  under_verification: { label: "Under verification", description: "The organizing team is verifying your payment.", variant: "outline" },
  verified: { label: "Verified", description: "Your payment has been confirmed. Thank you!", variant: "default" },
  failed: { label: "Failed", description: "Your last payment could not be verified. Please resubmit.", variant: "destructive" },
  refunded: { label: "Refunded", description: "This payment was refunded by the organizing team.", variant: "outline" },
  cancelled: { label: "Cancelled", description: "This payment was cancelled.", variant: "outline" },
};

function money(amount: number | string, currency: string) {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function DelegatePaymentPage() {
  const [summary, setSummary] = useState<DelegatePaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: true } & DelegatePaymentSummary>("/delegates/me/payment");
      setSummary(res);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load payment status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await api.post("/delegates/me/payment", {
        amount: Number(form.get("amount")),
        method: form.get("method"),
        transactionReference: form.get("transactionReference") || undefined,
        feeCategoryId: form.get("feeCategoryId") ? Number(form.get("feeCategoryId")) : undefined,
        paymentDate: form.get("paymentDate") || undefined,
      });
      toast.success("Payment submitted for verification");
      setDialogOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not submit payment");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !summary) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const statusInfo = STATUS_COPY[summary.status];
  const currency = summary.currency;
  const requiredTotal = summary.feeCategories.filter((fc) => fc.is_required).reduce((sum, fc) => sum + Number(fc.amount), 0);
  const discountTotal = summary.discounts.reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payment</h1>
        <p className="text-muted-foreground">Track your conference fees and submit proof of payment.</p>
      </div>

      {!summary.paymentRequired ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <ShieldCheck className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No payment required</p>
            <p className="text-sm text-muted-foreground">This conference does not charge a registration fee.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <p className="text-sm text-muted-foreground">Payment status</p>
                <div className="mt-1">
                  <Badge variant={statusInfo.variant} className="text-sm">
                    {statusInfo.label}
                  </Badge>
                </div>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">{statusInfo.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold">{money(Math.max(requiredTotal - discountTotal, 0), currency)}</p>
                <p className="text-xs text-muted-foreground">Amount due</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Fees</CardTitle>
                <CardDescription>What this conference charges.</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger render={<Button size="sm" />}>
                  <Plus className="mr-1 h-4 w-4" /> Submit payment
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>Submit a payment</DialogTitle>
                      <DialogDescription>
                        Paid via UPI, bank transfer, cash, or cheque? Let the organizers know so they can verify it.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount ({currency})</Label>
                          <Input
                            id="amount"
                            name="amount"
                            type="number"
                            min={0.01}
                            step="0.01"
                            defaultValue={Math.max(requiredTotal - discountTotal, 0) || undefined}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="method">Method</Label>
                          <Select name="method" defaultValue="upi">
                            <SelectTrigger id="method" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {METHOD_OPTIONS.map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                  {m.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {summary.feeCategories.length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="feeCategoryId">Fee category</Label>
                          <Select name="feeCategoryId">
                            <SelectTrigger id="feeCategoryId" className="w-full">
                              <SelectValue placeholder="No specific category" />
                            </SelectTrigger>
                            <SelectContent>
                              {summary.feeCategories.map((fc) => (
                                <SelectItem key={fc.id} value={String(fc.id)}>
                                  {fc.name} ({money(fc.amount, fc.currency)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="transactionReference">Transaction reference</Label>
                          <Input id="transactionReference" name="transactionReference" placeholder="UTR / cheque no." />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentDate">Payment date</Label>
                          <Input id="paymentDate" name="paymentDate" type="date" />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit payment"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {summary.feeCategories.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No fee categories configured.</p>
              ) : (
                <div className="space-y-2">
                  {summary.feeCategories.map((fc) => (
                    <div key={fc.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{fc.name}</p>
                        {fc.description && <p className="text-xs text-muted-foreground">{fc.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={fc.is_required ? "default" : "outline"}>{fc.is_required ? "Required" : "Optional"}</Badge>
                        <span className="text-sm font-medium">{money(fc.amount, fc.currency)}</span>
                      </div>
                    </div>
                  ))}
                  {summary.discounts.map((d) => (
                    <div key={d.id} className="flex items-center justify-between rounded-lg border border-dashed p-3 text-sm">
                      <span className="text-muted-foreground">{d.type.replace("_", " ")} — {d.reason}</span>
                      <span className="font-medium text-emerald-600">-{money(d.amount, currency)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment history</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.payments.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Wallet className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">You haven&apos;t submitted a payment yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{money(payment.amount, payment.currency)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{payment.method.replace("_", " ")}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{payment.transaction_reference || "—"}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <StatusIcon status={payment.status} />
                            {payment.status.replace("_", " ")}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "verified") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
  if (status === "failed" || status === "cancelled") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
  return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
}
