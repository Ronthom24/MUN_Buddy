import { PlatformAdminAuthProvider } from "@/lib/platform-auth-context";

export default function PlatformRootLayout({ children }: { children: React.ReactNode }) {
  return <PlatformAdminAuthProvider>{children}</PlatformAdminAuthProvider>;
}
