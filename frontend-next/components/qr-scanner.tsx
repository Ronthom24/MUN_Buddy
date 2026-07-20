"use client";

import { useEffect, useRef, useState } from "react";
import { CameraOff } from "lucide-react";

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  active: boolean;
}

/**
 * Live camera QR scanner using html5-qrcode. Works on both laptop webcams
 * and mobile cameras -- prefers the back camera on mobile via facingMode,
 * which has no effect (and no error) on a laptop's single front camera.
 */
export function QrScanner({ onScan, active }: QrScannerProps) {
  const containerId = useRef(`qr-scanner-${Math.random().toString(36).slice(2)}`).current;
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;

      const scanner = new Html5Qrcode(containerId, { verbose: false });
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => onScan(decodedText),
          undefined
        );
      } catch {
        // No back camera (common on laptops) -- fall back to whatever camera is available.
        try {
          await scanner.start(
            { facingMode: "user" },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (decodedText) => onScan(decodedText),
            undefined
          );
        } catch {
          setError("Could not access a camera. Check your browser's camera permission for this site.");
        }
      }
    })();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner.stop().then(() => scanner.clear()).catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [active, containerId, onScan]);

  if (!active) return null;

  return (
    <div className="overflow-hidden rounded-lg border">
      {error ? (
        <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
          <CameraOff className="h-6 w-6" />
          {error}
        </div>
      ) : (
        <div id={containerId} className="w-full [&_video]:w-full" />
      )}
    </div>
  );
}
