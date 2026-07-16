"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  BarChart3,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
  Gavel,
  MessageSquare,
  QrCode,
  Users2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiRequestError } from "@/lib/api";
import { downloadBlob } from "@/lib/utils";
import type { AnalyticsOverview, ExportFormat, ReportType } from "@/lib/types";

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: "registrations", label: "Registration Report" },
  { value: "committees", label: "Committee Report" },
  { value: "assignments", label: "Assignment Report" },
  { value: "financial", label: "Financial Report" },
  { value: "attendance", label: "Attendance Report" },
  { value: "certificates", label: "Certificate Report" },
];
const REPORT_ITEMS = Object.fromEntries(REPORT_TYPES.map((r) => [r.value, r.label]));

export default function AnalyticsPage() {
  const params = useParams<{ id: string }>();
  const conferenceId = params.id;

  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<ReportType>("registrations");
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: true; analytics: AnalyticsOverview }>(
        `/conferences/${conferenceId}/analytics/overview`
      );
      setAnalytics(res.analytics);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleExport(format: ExportFormat) {
    setExporting(format);
    try {
      const ext = format === "excel" ? "xlsx" : format;
      const blob = await api.getBlob(`/conferences/${conferenceId}/reports/${reportType}/export?format=${format}`);
      downloadBlob(blob, `${reportType}-report-${conferenceId}.${ext}`);
      toast.success(`${REPORT_ITEMS[reportType]} downloaded`);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not export report");
    } finally {
      setExporting(null);
    }
  }

  const committeeChartData = (analytics?.committees || []).map((c) => ({
    name: c.committeeName,
    Assigned: c.assignedCount,
    Remaining: c.remainingCapacity ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics &amp; Reports</h1>
          <p className="text-muted-foreground">Registration, committee, financial, and communication insights in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={reportType} items={REPORT_ITEMS} onValueChange={(v) => setReportType(v as ReportType)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" disabled={exporting !== null} onClick={() => handleExport("pdf")}>
            <FileText className="mr-1 h-4 w-4" /> {exporting === "pdf" ? "..." : "PDF"}
          </Button>
          <Button size="sm" variant="outline" disabled={exporting !== null} onClick={() => handleExport("excel")}>
            <FileSpreadsheet className="mr-1 h-4 w-4" /> {exporting === "excel" ? "..." : "Excel"}
          </Button>
          <Button size="sm" variant="outline" disabled={exporting !== null} onClick={() => handleExport("csv")}>
            <Download className="mr-1 h-4 w-4" /> {exporting === "csv" ? "..." : "CSV"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users2 className="h-4 w-4" />} label="Total applications"
          value={analytics?.registration.totalApplications} loading={loading}
        />
        <StatCard
          icon={<ClipboardList className="h-4 w-4" />} label="Approval rate"
          value={analytics ? `${Math.round(analytics.registration.approvalRate * 100)}%` : undefined} loading={loading}
        />
        <StatCard
          icon={<QrCode className="h-4 w-4" />} label="Attendance rate"
          value={analytics ? `${Math.round(analytics.attendance.overallAttendanceRate * 100)}%` : undefined} loading={loading}
        />
        <StatCard
          icon={<MessageSquare className="h-4 w-4" />} label="Announcement read rate"
          value={analytics ? `${Math.round(analytics.communication.announcementAvgReadRate * 100)}%` : undefined} loading={loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registrations over time</CardTitle>
            <CardDescription>Applications received per day.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : (analytics?.registration.registrationsByDay.length || 0) === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No registrations yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={analytics!.registration.registrationsByDay}>
                  <defs>
                    <linearGradient id="registrationsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="count" stroke="var(--chart-1)" fill="url(#registrationsFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Committee occupancy</CardTitle>
            <CardDescription>Assigned delegates vs. remaining capacity.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : committeeChartData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No committees yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={committeeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="Assigned" stackId="a" fill="var(--chart-2)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Remaining" stackId="a" fill="var(--muted)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Gavel className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Assignment progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {loading ? <Skeleton className="h-16 w-full" /> : (
              <>
                <p>Assigned: <span className="font-medium text-foreground">{analytics?.assignment.assignedCount ?? 0}</span></p>
                <p>Unassigned: <span className="font-medium text-foreground">{analytics?.assignment.unassignedCount ?? 0}</span></p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {loading ? <Skeleton className="h-16 w-full" /> : (
              <>
                <p>Total: <span className="font-medium text-foreground">{analytics?.resources.totalResources ?? 0}</span></p>
                <p>Downloads: <span className="font-medium text-foreground">{analytics?.resources.totalDownloads ?? 0}</span></p>
                <p>Never downloaded: <span className="font-medium text-foreground">{analytics?.resources.unusedCount ?? 0}</span></p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Communication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {loading ? <Skeleton className="h-16 w-full" /> : (
              <>
                <p>Announcements: <span className="font-medium text-foreground">{analytics?.communication.announcementsPublished ?? 0}</span></p>
                <p>
                  FAQs answered: <span className="font-medium text-foreground">
                    {(analytics?.communication.totalFaqs ?? 0) - (analytics?.communication.pendingFaqs ?? 0)}
                  </span>{" "}/{" "}{analytics?.communication.totalFaqs ?? 0}{" "}
                  {analytics?.communication.faqAvgResolutionHours != null && (
                    <Badge variant="outline" className="ml-2">{analytics.communication.faqAvgResolutionHours}h avg</Badge>
                  )}
                </p>
                <p>
                  Broadcasts sent: <span className="font-medium text-foreground">{analytics?.communication.broadcastsSent ?? 0}</span>
                  {" "}({Math.round((analytics?.communication.broadcastDeliveryRate ?? 0) * 100)}% delivered)
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {analytics?.financial && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financial snapshot</CardTitle>
            <CardDescription>Collection rate and outstanding balance.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <p>Collection rate: <span className="font-medium text-foreground">{Math.round(analytics.financial.collectionRate * 100)}%</span></p>
            <p>Outstanding balance: <span className="font-medium text-foreground">{analytics.financial.outstandingBalance}</span></p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string | undefined;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="mt-1 h-7 w-14" /> : <p className="text-2xl font-semibold">{value ?? 0}</p>}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>
      </CardContent>
    </Card>
  );
}
