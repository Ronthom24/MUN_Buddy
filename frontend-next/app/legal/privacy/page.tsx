import { PublicNav, PublicFooter } from "@/components/public-nav";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">Legal</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 17 July 2026</p>

        <div className="prose prose-sm mt-8 max-w-none space-y-6 text-foreground/80">
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground">1. Information we collect</h2>
            <p className="mt-2">
              MUN Buddy collects account information (name, email, organization details) and conference-related
              data (registrations, assignments, payments, attendance, and results) that organizers and delegates
              submit while using the platform.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground">2. How we use information</h2>
            <p className="mt-2">
              Data is used to operate conference workflows — registration, committee assignment, payment
              verification, attendance tracking, and certificate issuance — and to communicate with you about
              conferences you organize or attend.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground">3. Data sharing</h2>
            <p className="mt-2">
              Organization data is isolated per tenant. We do not sell personal data. Conference organizers can
              see data submitted for their own conferences only.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground">4. Your rights</h2>
            <p className="mt-2">
              You may request access to, correction of, or deletion of your personal data by contacting us at{" "}
              <a href="mailto:hello@munbuddy.app" className="text-primary hover:underline">hello@munbuddy.app</a>.
            </p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
