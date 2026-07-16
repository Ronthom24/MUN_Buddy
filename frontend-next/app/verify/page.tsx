"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex min-h-screen flex-1 items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
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
