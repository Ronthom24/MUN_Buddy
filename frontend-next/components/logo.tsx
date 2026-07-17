import Image from "next/image";

/**
 * The real MUN Buddy crest (cropped/cutout from the source artwork into
 * public/logo-badge.png — transparent outside the ring so it drops cleanly
 * onto navy, ivory, or any other surface). One asset, used at every size;
 * the fine arc text and wreath detail are decorative at small sizes, same
 * as any circular seal/crest logo.
 */
export function LogoBadge({ size = 120, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo-badge.png"
      alt="MUN Buddy"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}

/** Alias kept for call sites that just want the compact navbar-sized mark. */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return <LogoBadge size={size} className={className} />;
}

/** Mark + wordmark lockup for horizontal nav bars. */
export function LogoWordmark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className || ""}`}>
      <LogoMark size={size} />
      <span className="font-heading text-lg font-bold leading-none tracking-tight text-foreground">
        MUN <span className="text-brand-gold">Buddy</span>
      </span>
    </span>
  );
}
