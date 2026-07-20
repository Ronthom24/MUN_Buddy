import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublicNav, PublicFooter } from "@/components/public-nav";

export function GuideArticle({
  category,
  title,
  intro,
  children,
}: {
  category: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <Link
          href="/resources"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All resources
        </Link>
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">{category}</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-muted-foreground">{intro}</p>

        <div className="prose prose-sm mt-8 max-w-none space-y-6 text-foreground/80">{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}

export function GuideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}
