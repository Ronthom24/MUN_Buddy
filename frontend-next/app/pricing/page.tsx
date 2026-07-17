import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav, PublicFooter } from "@/components/public-nav";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    tagline: "For a first conference, or a small society getting started.",
    features: [
      "1 organization",
      "1 active conference",
      "Up to 150 delegates",
      "Registration & assignment",
      "Committee & schedule center",
      "Certificate generation",
    ],
    limits: "Community support only",
    cta: "Create Organization",
    variant: "outline" as const,
    featured: false,
  },
  {
    name: "Institution",
    price: "Custom",
    period: "",
    tagline: "For societies and institutions running multiple conferences a year.",
    features: [
      "Unlimited organizations",
      "Unlimited conferences",
      "Unlimited delegates",
      "Payments & finance dashboard",
      "Communication center & broadcasts",
      "Analytics & audit trail",
      "Priority support",
    ],
    limits: "Everything in Starter, unlimited",
    cta: "Talk to us",
    variant: "accent" as const,
    featured: true,
  },
  {
    name: "Federation",
    price: "Custom",
    period: "",
    tagline: "For MUN federations and networks coordinating many organizations.",
    features: [
      "Everything in Institution",
      "Multi-organization oversight",
      "Dedicated onboarding",
      "Custom branding options",
      "SLA-backed support",
    ],
    limits: "Contact us for details",
    cta: "Contact sales",
    variant: "outline" as const,
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <section className="border-b border-border/70 bg-muted/30">
        <div className="mx-auto max-w-[1440px] px-6 py-14 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">Pricing</p>
          <h1 className="mx-auto mt-1 max-w-2xl font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Simple plans for conferences of every size
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Start free. Upgrade only when your organization is ready to run more.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.featured
                  ? "relative border-brand-gold shadow-lg ring-1 ring-brand-gold/30"
                  : "relative"
              }
            >
              {plan.featured && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-gold text-white">Most popular</Badge>
              )}
              <CardContent className="flex h-full flex-col gap-6 p-7">
                <div>
                  <p className="font-heading text-lg font-semibold">{plan.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                </div>
                <div>
                  <span className="font-heading text-4xl font-bold text-brand-navy">{plan.price}</span>
                  {plan.period && <span className="ml-1 text-sm text-muted-foreground">{plan.period}</span>}
                </div>
                <ul className="flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
                      <span className="text-foreground/80">{f}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">{plan.limits}</p>
                <Button
                  variant={plan.variant}
                  size="lg"
                  render={<Link href={plan.name === "Starter" ? "/register" : "/about#contact"} />}
                  nativeButton={false}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
