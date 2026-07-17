"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoBadge } from "@/components/logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VerifyLookupPage() {
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const certificateNumber = String(form.get("certificateNumber") || "").trim();
    if (certificateNumber) router.push(`/verify/${encodeURIComponent(certificateNumber)}`);
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-gradient-to-b from-brand-navy/5 to-background px-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Link href="/" className="mb-2 block w-fit transition-opacity hover:opacity-80">
            <LogoBadge size={72} />
          </Link>
          <CardTitle>Certificate Verification</CardTitle>
          <CardDescription>Enter a MUN Buddy certificate number to confirm it&apos;s genuine.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certificateNumber">Certificate number</Label>
              <Input id="certificateNumber" name="certificateNumber" required placeholder="MB-CONF-XXXXXX" className="font-mono" />
            </div>
            <Button type="submit" className="w-full">
              Verify
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
