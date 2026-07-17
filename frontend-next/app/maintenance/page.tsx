import { Wrench } from "lucide-react";
import { LogoBadge } from "@/components/logo";

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-brand-navy/5 to-background px-6 text-center">
      <LogoBadge size={72} />
      <div className="flex items-center gap-2 text-brand-gold">
        <Wrench className="h-5 w-5" />
        <p className="text-sm font-semibold uppercase tracking-wider">Maintenance</p>
      </div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
        MUN Buddy is temporarily down for maintenance
      </h1>
      <p className="max-w-md text-muted-foreground">
        We&rsquo;ll be back shortly. Please check back in a few minutes.
      </p>
    </div>
  );
}
