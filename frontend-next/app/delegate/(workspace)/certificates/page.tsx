"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Download, FileCheck2, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiRequestError } from "@/lib/api";
import { openBlob } from "@/lib/utils";
import type { Certificate } from "@/lib/types";

export default function DelegateCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    api
      .get<{ success: true; certificates: Certificate[] }>("/delegates/me/certificates")
      .then((res) => setCertificates(res.certificates))
      .catch((err) => toast.error(err instanceof ApiRequestError ? err.message : "Failed to load certificates"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDownload(certificate: Certificate) {
    setDownloadingId(certificate.id);
    const win = window.open("", "_blank", "noopener,noreferrer");
    try {
      const blob = await api.getBlob(`/certificates/${certificate.id}/pdf`);
      openBlob(blob, win);
    } catch (err) {
      win?.close();
      toast.error(err instanceof ApiRequestError ? err.message : "Could not open certificate");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Certificates</h1>
        <p className="text-muted-foreground">Download your official conference certificates.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <FileCheck2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No certificates have been issued to you yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {certificates.map((certificate) => (
            <Card key={certificate.id}>
              <CardContent className="flex items-center justify-between gap-3 p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{certificate.template_title || certificate.template_name}</p>
                    <Badge variant="outline">{certificate.certificate_type.replace("_", " ")}</Badge>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{certificate.certificate_number}</p>
                  <p className="text-xs text-muted-foreground">
                    Issued {new Date(certificate.issued_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Button size="sm" variant="outline" disabled={downloadingId === certificate.id} onClick={() => handleDownload(certificate)}>
                    <Download className="mr-1 h-3.5 w-3.5" /> {downloadingId === certificate.id ? "Opening..." : "View PDF"}
                  </Button>
                  <Link
                    href={`/verify/${encodeURIComponent(certificate.certificate_number)}`}
                    target="_blank"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    <ShieldCheck className="h-3 w-3" /> Verify
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
