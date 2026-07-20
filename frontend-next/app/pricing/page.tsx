import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PublicNav, PublicFooter } from "@/components/public-nav";

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">Pricing</p>
          <h1 className="mx-auto mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Pricing is set per conference
          </h1>
          <p className="mx-auto mt-4 text-muted-foreground">
            We work with each organizing committee directly on setup, since every conference's size and needs are
            different. Get in touch and we'll walk you through it.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="accent" render={<Link href="/about#contact" />} nativeButton={false}>
              Talk to us
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/register" />} nativeButton={false}>
              Create an organization
            </Button>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
