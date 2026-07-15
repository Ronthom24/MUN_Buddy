import { DelegateAuthProvider } from "@/lib/delegate-auth-context";

export default function DelegateRootLayout({ children }: { children: React.ReactNode }) {
  return <DelegateAuthProvider>{children}</DelegateAuthProvider>;
}
