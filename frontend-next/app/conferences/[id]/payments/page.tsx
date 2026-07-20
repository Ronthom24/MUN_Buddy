"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  BadgeIndianRupee,
  CheckCircle2,
  Clock,
  Plus,
  Receipt,
  RotateCcw,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, ApiRequestError } from "@/lib/api";
import type {
  Delegate,
  Discount,
  FeeCategory,
  Payment,
  PaymentAnalytics,
  PaymentConfig,
  PaymentDashboard,
  PaymentMethod,
  Refund,
} from "@/lib/types";

const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

const DISCOUNT_TYPE_OPTIONS = [
  { value: "early_bird", label: "Early bird discount" },
  { value: "institution_discount", label: "Institution discount" },
  { value: "organizer_waiver", label: "Organizer waiver" },
  { value: "scholarship", label: "Scholarship" },
  { value: "promotional_code", label: "Promotional code" },
  { value: "other", label: "Other" },
];

const STATUS_VARIANT: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  submitted: "secondary",
  under_verification: "outline",
  verified: "default",
  failed: "destructive",
  refunded: "outline",
  cancelled: "destructive",
};

function money(amount: number | string, currency: string) {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function PaymentsPage() {
  const params = useParams<{ id: string }>();
  const conferenceId = params.id;

  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [dashboard, setDashboard] = useState<PaymentDashboard | null>(null);
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [loading, setLoading] = useState(true);

  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [verifyNotesTarget, setVerifyNotesTarget] = useState<{ payment: Payment; status: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currency = config?.currency || "INR";

  // Select.Root needs an `items` value->label map, or its closed trigger displays the raw
  // value instead of the item's rendered label (Base UI resolves the label from `items`,
  // not from the mounted-then-unmounted SelectItem children).
  const delegateSelectItems = useMemo(
    () => Object.fromEntries(delegates.map((d) => [String(d.id), `${d.full_name} (${d.email})`])),
    [delegates]
  );
  const methodSelectItems = useMemo(() => Object.fromEntries(METHOD_OPTIONS.map((m) => [m.value, m.label])), []);
  const feeCategorySelectItems = useMemo(
    () => Object.fromEntries((config?.feeCategories || []).map((fc) => [String(fc.id), `${fc.name} (${money(fc.amount, fc.currency)})`])),
    [config]
  );
  const discountTypeSelectItems = useMemo(
    () => Object.fromEntries(DISCOUNT_TYPE_OPTIONS.map((t) => [t.value, t.label])),
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, dashboardRes, analyticsRes, paymentsRes, refundsRes, discountsRes, delegatesRes] = await Promise.all([
        api.get<{ success: true; config: PaymentConfig }>(`/conferences/${conferenceId}/payments/config`),
        api.get<{ success: true; dashboard: PaymentDashboard }>(`/conferences/${conferenceId}/payments/dashboard`),
        api.get<{ success: true; analytics: PaymentAnalytics }>(`/conferences/${conferenceId}/payments/analytics`),
        api.get<{ success: true; payments: Payment[] }>(`/conferences/${conferenceId}/payments`),
        api.get<{ success: true; refunds: Refund[] }>(`/conferences/${conferenceId}/refunds`),
        api.get<{ success: true; discounts: Discount[] }>(`/conferences/${conferenceId}/discounts`),
        api.get<{ success: true; delegates: Delegate[] }>(`/conferences/${conferenceId}/delegates`),
      ]);
      setConfig(configRes.config);
      setDashboard(dashboardRes.dashboard);
      setAnalytics(analyticsRes.analytics);
      setPayments(paymentsRes.payments);
      setRefunds(refundsRes.refunds);
      setDiscounts(discountsRes.discounts);
      setDelegates(delegatesRes.delegates);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Failed to load payments data";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    load();
  }, [load]);

  const chartData = useMemo(
    () => (dashboard?.dailyRevenue || []).map((row) => ({ day: row.day.slice(0, 10), total: row.total })),
    [dashboard]
  );

  async function togglePaymentRequired(checked: boolean) {
    try {
      const res = await api.put<{ success: true; config: PaymentConfig }>(`/conferences/${conferenceId}/payments/config`, {
        paymentRequired: checked,
      });
      setConfig(res.config);
      toast.success(checked ? "Payment is now required for this conference" : "Payment requirement disabled");
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not update payment settings";
      toast.error(message);
    }
  }

  async function handleCreateFeeCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await api.post(`/conferences/${conferenceId}/fee-categories`, {
        name: form.get("name"),
        amount: Number(form.get("amount")),
        description: form.get("description") || undefined,
        isRequired: form.get("isRequired") === "on",
      });
      toast.success("Fee category added");
      setFeeDialogOpen(false);
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not add fee category";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function archiveFeeCategory(feeCategory: FeeCategory) {
    try {
      await api.delete(`/conferences/${conferenceId}/fee-categories/${feeCategory.id}`);
      toast.success(`${feeCategory.name} archived`);
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not archive fee category";
      toast.error(message);
    }
  }

  async function handleRecordPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const delegateId = form.get("delegateId");
    if (!delegateId) {
      toast.error("Select a delegate");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/conferences/${conferenceId}/delegates/${delegateId}/payments`, {
        amount: Number(form.get("amount")),
        method: form.get("method"),
        transactionReference: form.get("transactionReference") || undefined,
        feeCategoryId: form.get("feeCategoryId") ? Number(form.get("feeCategoryId")) : undefined,
        paymentDate: form.get("paymentDate") || undefined,
        notes: form.get("notes") || undefined,
        status: form.get("markVerified") === "on" ? "verified" : "submitted",
      });
      toast.success("Payment recorded");
      setRecordDialogOpen(false);
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not record payment";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function setPaymentStatus(payment: Payment, status: string, notes?: string) {
    try {
      await api.patch(`/conferences/${conferenceId}/payments/${payment.id}/verify`, { status, notes });
      toast.success(`Payment marked ${status.replace("_", " ")}`);
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not update payment status";
      toast.error(message);
    }
  }

  async function handleRefund(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!refundTarget) return;
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await api.post(`/conferences/${conferenceId}/payments/${refundTarget.id}/refund`, {
        amount: Number(form.get("amount")),
        reason: form.get("reason"),
        notes: form.get("notes") || undefined,
        refundDate: form.get("refundDate") || undefined,
      });
      toast.success("Refund recorded");
      setRefundTarget(null);
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not record refund";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApplyDiscount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const delegateId = form.get("delegateId");
    if (!delegateId) {
      toast.error("Select a delegate");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/conferences/${conferenceId}/delegates/${delegateId}/discounts`, {
        type: form.get("type"),
        amount: Number(form.get("amount")),
        reason: form.get("reason"),
        feeCategoryId: form.get("feeCategoryId") ? Number(form.get("feeCategoryId")) : undefined,
      });
      toast.success("Discount applied");
      setDiscountDialogOpen(false);
      await load();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not apply discount";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Total revenue"
          value={dashboard ? money(dashboard.totalRevenue, currency) : undefined}
          loading={loading}
        />
        <StatCard
          icon={<BadgeIndianRupee className="h-4 w-4" />}
          label="Expected revenue"
          value={dashboard ? money(dashboard.expectedRevenue, currency) : undefined}
          loading={loading}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Pending verification"
          value={dashboard ? `${money(dashboard.pendingVerification, currency)} (${dashboard.pendingVerificationCount})` : undefined}
          loading={loading}
        />
        <StatCard
          icon={<RotateCcw className="h-4 w-4" />}
          label="Refunded"
          value={dashboard ? money(dashboard.refundedAmount, currency) : undefined}
          loading={loading}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="fees">Fee structure</TabsTrigger>
          <TabsTrigger value="refunds">Refunds &amp; discounts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue trend</CardTitle>
              <CardDescription>Verified payments by date.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-56 w-full" />
              ) : chartData.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No verified payments yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} width={40} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(value) => money(Number(value), currency)}
                    />
                    <Area type="monotone" dataKey="total" stroke="var(--chart-2)" fill="url(#revenueFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment method distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {!analytics || analytics.paymentMethodDistribution.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No verified payments yet.</p>
                ) : (
                  analytics.paymentMethodDistribution.map((row) => (
                    <Badge key={row.method} variant="outline">
                      {row.method.replace("_", " ")}: {money(row.total, currency)} ({row.count})
                    </Badge>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Collection rate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-semibold">
                  {analytics ? `${Math.round(analytics.collectionRate * 100)}%` : "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Success rate on verification: {dashboard ? `${Math.round(dashboard.paymentSuccessRate * 100)}%` : "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Outstanding balance: {analytics ? money(analytics.outstandingBalance, currency) : "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {!dashboard || dashboard.recentTransactions.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Delegate</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard.recentTransactions.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.delegate_name}</TableCell>
                        <TableCell>{money(payment.amount, payment.currency)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{payment.method.replace("_", " ")}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[payment.status]}>{payment.status.replace("_", " ")}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>Every payment recorded for this conference.</CardDescription>
              </div>
              <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
                <DialogTrigger render={<Button size="sm" />}>
                  <Plus className="mr-1 h-4 w-4" /> Record payment
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <form onSubmit={handleRecordPayment}>
                    <DialogHeader>
                      <DialogTitle>Record a payment</DialogTitle>
                      <DialogDescription>Log cash, bank transfer, UPI, or cheque payments collected offline.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="delegateId">Delegate</Label>
                        <Select name="delegateId" items={delegateSelectItems}>
                          <SelectTrigger id="delegateId" className="w-full">
                            <SelectValue placeholder="Select a delegate" />
                          </SelectTrigger>
                          <SelectContent>
                            {delegates.map((d) => (
                              <SelectItem key={d.id} value={String(d.id)}>
                                {d.full_name} ({d.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount</Label>
                          <Input id="amount" name="amount" type="number" min={0.01} step="0.01" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="method">Method</Label>
                          <Select name="method" items={methodSelectItems} defaultValue="cash">
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
                      {config && config.feeCategories.length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="feeCategoryId">Fee category</Label>
                          <Select name="feeCategoryId" items={feeCategorySelectItems}>
                            <SelectTrigger id="feeCategoryId" className="w-full">
                              <SelectValue placeholder="No specific category" />
                            </SelectTrigger>
                            <SelectContent>
                              {config.feeCategories.map((fc) => (
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
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" name="notes" rows={2} />
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="markVerified" defaultChecked className="h-4 w-4 rounded border-input" />
                        Mark as verified immediately (already collected and confirmed)
                      </label>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? "Recording..." : "Record payment"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2 py-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : payments.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Delegate</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="font-medium">{payment.delegate_name}</div>
                          <div className="text-xs text-muted-foreground">{payment.delegate_email}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{payment.fee_category_name || "—"}</TableCell>
                        <TableCell>{money(payment.amount, payment.currency)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{payment.method.replace("_", " ")}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{payment.transaction_reference || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[payment.status]}>{payment.status.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button size="xs" variant="ghost" />}>
                              Actions
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {["submitted", "under_verification"].includes(payment.status) && (
                                <>
                                  <DropdownMenuItem onClick={() => setPaymentStatus(payment, "under_verification")}>
                                    Mark under review
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setVerifyNotesTarget({ payment, status: "verified" })}>
                                    Verify
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setVerifyNotesTarget({ payment, status: "failed" })}
                                  >
                                    Mark failed
                                  </DropdownMenuItem>
                                </>
                              )}
                              {payment.status === "verified" && (
                                <DropdownMenuItem onClick={() => setRefundTarget(payment)}>Refund</DropdownMenuItem>
                              )}
                              {!["submitted", "under_verification", "verified"].includes(payment.status) && (
                                <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment configuration</CardTitle>
              <CardDescription>Turn on payment collection and set the conference currency.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Require payment for approval</p>
                <p className="text-xs text-muted-foreground">
                  When enabled, delegates cannot be approved until a payment is verified.
                </p>
              </div>
              <Switch checked={config?.paymentRequired ?? false} onCheckedChange={togglePaymentRequired} disabled={!config} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Fee structure</CardTitle>
                <CardDescription>Registration, accommodation, merchandise, or other fee line items.</CardDescription>
              </div>
              <Dialog open={feeDialogOpen} onOpenChange={setFeeDialogOpen}>
                <DialogTrigger render={<Button size="sm" />}>
                  <Plus className="mr-1 h-4 w-4" /> Add fee
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <form onSubmit={handleCreateFeeCategory}>
                    <DialogHeader>
                      <DialogTitle>Add a fee category</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" required placeholder="Registration fee" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount ({currency})</Label>
                        <Input id="amount" name="amount" type="number" min={0.01} step="0.01" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" rows={2} />
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="isRequired" defaultChecked className="h-4 w-4 rounded border-input" />
                        Required for every delegate
                      </label>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? "Adding..." : "Add fee"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : !config || config.feeCategories.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No fee categories yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {config.feeCategories.map((fc) => (
                      <TableRow key={fc.id}>
                        <TableCell>
                          <div className="font-medium">{fc.name}</div>
                          {fc.description && <div className="text-xs text-muted-foreground">{fc.description}</div>}
                        </TableCell>
                        <TableCell>{money(fc.amount, fc.currency)}</TableCell>
                        <TableCell>
                          <Badge variant={fc.is_required ? "default" : "outline"}>{fc.is_required ? "Required" : "Optional"}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="xs" variant="ghost" onClick={() => archiveFeeCategory(fc)}>
                            Archive
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Refunds</CardTitle>
              <CardDescription>Refunds never delete the original transaction record.</CardDescription>
            </CardHeader>
            <CardContent>
              {refunds.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No refunds recorded.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Delegate</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refunds.map((refund) => (
                      <TableRow key={refund.id}>
                        <TableCell className="font-medium">{refund.delegate_name}</TableCell>
                        <TableCell>{money(refund.amount, currency)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{refund.reason}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{refund.refund_date?.slice(0, 10)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Discounts &amp; waivers</CardTitle>
                <CardDescription>Early bird, scholarship, or organizer-granted fee reductions.</CardDescription>
              </div>
              <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
                <DialogTrigger render={<Button size="sm" variant="outline" />}>
                  <Plus className="mr-1 h-4 w-4" /> Apply discount
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <form onSubmit={handleApplyDiscount}>
                    <DialogHeader>
                      <DialogTitle>Apply a discount</DialogTitle>
                      <DialogDescription>Every adjustment is recorded with a reason.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="discDelegateId">Delegate</Label>
                        <Select name="delegateId" items={delegateSelectItems}>
                          <SelectTrigger id="discDelegateId" className="w-full">
                            <SelectValue placeholder="Select a delegate" />
                          </SelectTrigger>
                          <SelectContent>
                            {delegates.map((d) => (
                              <SelectItem key={d.id} value={String(d.id)}>
                                {d.full_name} ({d.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="type">Type</Label>
                          <Select name="type" items={discountTypeSelectItems} defaultValue="scholarship">
                            <SelectTrigger id="type" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DISCOUNT_TYPE_OPTIONS.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="discAmount">Amount off ({currency})</Label>
                          <Input id="discAmount" name="amount" type="number" min={0.01} step="0.01" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Textarea id="reason" name="reason" rows={2} required />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? "Applying..." : "Apply discount"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {discounts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No discounts applied.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Delegate</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discounts.map((discount) => (
                      <TableRow key={discount.id}>
                        <TableCell className="font-medium">{discount.delegate_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{discount.type.replace("_", " ")}</TableCell>
                        <TableCell>{money(discount.amount, currency)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{discount.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(verifyNotesTarget)} onOpenChange={(open) => !open && setVerifyNotesTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          {verifyNotesTarget && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                setPaymentStatus(verifyNotesTarget.payment, verifyNotesTarget.status, (form.get("notes") as string) || undefined);
                setVerifyNotesTarget(null);
              }}
            >
              <DialogHeader>
                <DialogTitle>{verifyNotesTarget.status === "verified" ? "Verify payment" : "Mark payment failed"}</DialogTitle>
                <DialogDescription>
                  {verifyNotesTarget.payment.delegate_name} — {money(verifyNotesTarget.payment.amount, verifyNotesTarget.payment.currency)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-4">
                <Label htmlFor="verifyNotes">Verification notes</Label>
                <Textarea id="verifyNotes" name="notes" rows={2} />
              </div>
              <DialogFooter>
                <Button type="submit" variant={verifyNotesTarget.status === "verified" ? "default" : "destructive"}>
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  {verifyNotesTarget.status === "verified" ? "Confirm verified" : "Confirm failed"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(refundTarget)} onOpenChange={(open) => !open && setRefundTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          {refundTarget && (
            <form onSubmit={handleRefund}>
              <DialogHeader>
                <DialogTitle>Record a refund</DialogTitle>
                <DialogDescription>
                  {refundTarget.delegate_name} — original payment {money(refundTarget.amount, refundTarget.currency)}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="refundAmount">Refund amount</Label>
                    <Input
                      id="refundAmount"
                      name="amount"
                      type="number"
                      min={0.01}
                      step="0.01"
                      max={Number(refundTarget.amount)}
                      defaultValue={refundTarget.amount}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="refundDate">Refund date</Label>
                    <Input id="refundDate" name="refundDate" type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Input id="reason" name="reason" required placeholder="Delegate withdrew" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refundNotes">Notes</Label>
                  <Textarea id="refundNotes" name="notes" rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting} variant="destructive">
                  <Receipt className="mr-1 h-4 w-4" />
                  {submitting ? "Recording..." : "Record refund"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | undefined;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="mt-1 h-7 w-20" /> : <p className="text-xl font-semibold">{value ?? "—"}</p>}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>
      </CardContent>
    </Card>
  );
}
