import { PublicNav, PublicFooter } from "@/components/public-nav";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">Legal</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight">Terms & Conditions</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 17 July 2026</p>

        <div className="prose prose-sm mt-8 max-w-none space-y-6 text-foreground/80">
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground">1. Using the platform</h2>
            <p className="mt-2">
              By creating an organization, registering as a delegate, or otherwise using MUN Buddy, you agree to
              use the platform to organize or participate in legitimate Model United Nations activities.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground">2. Organizer responsibilities</h2>
            <p className="mt-2">
              Organizers are responsible for the accuracy of conference information they publish, for handling
              payments in accordance with applicable law, and for the conduct of their conference staff.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground">3. Certificates</h2>
            <p className="mt-2">
              Certificates issued through MUN Buddy are generated based on data entered by conference organizers.
              MUN Buddy is not responsible for the accuracy of results published by an organizer.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground">4. Changes to these terms</h2>
            <p className="mt-2">
              We may update these terms as the platform evolves. Continued use of MUN Buddy after changes take
              effect constitutes acceptance of the updated terms.
            </p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
