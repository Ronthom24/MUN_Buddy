"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, clearDelegateToken, getDelegateToken, setDelegateToken } from "./api";
import type { DelegateSelf } from "./types";

interface DelegateAuthState {
  delegate: DelegateSelf | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: Record<string, unknown>) => Promise<{
    verificationRequired: boolean;
    message?: string;
    devVerifyLink?: string;
  }>;
  logout: () => void;
}

const DelegateAuthContext = createContext<DelegateAuthState | undefined>(undefined);

interface DelegateAuthResponse {
  success: true;
  token: string;
  delegate: { id: number; fullName: string; email: string; status: string };
}

interface DelegateRegisterResponse {
  success: true;
  delegate: { id: number; fullName: string; email: string; status: string };
  // Present only when REQUIRE_EMAIL_VERIFICATION=false on the backend.
  token?: string;
  // Present only when verification is required.
  message?: string;
  devVerifyLink?: string;
}

const DELEGATE_KEY = "mb_delegate";

export function DelegateAuthProvider({ children }: { children: ReactNode }) {
  const [delegate, setDelegate] = useState<DelegateSelf | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getDelegateToken();
    const stored = window.localStorage.getItem(DELEGATE_KEY);
    if (token && stored) {
      try {
        setDelegate(JSON.parse(stored));
      } catch {
        clearDelegateToken();
      }
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const result = await api.post<DelegateAuthResponse>("/auth/delegate/login", { email, password });
    // getToken() in lib/api.ts always prefers a leftover admin-view token
    // over the normal one, on any route -- clear it so a fresh login here
    // always wins (see lib/auth-context.tsx's login() for the same fix).
    window.localStorage.removeItem("mb_admin_view_token");
    window.localStorage.removeItem("mb_admin_view");
    setDelegateToken(result.token);
    const self: DelegateSelf = { ...result.delegate, status: result.delegate.status as DelegateSelf["status"] };
    window.localStorage.setItem(DELEGATE_KEY, JSON.stringify(self));
    setDelegate(self);
    router.push("/delegate");
  }

  async function register(payload: Record<string, unknown>) {
    const result = await api.post<DelegateRegisterResponse>("/auth/delegate/register", payload);

    if (result.token) {
      // Verification is temporarily disabled backend-side -- behaves like
      // pre-verification registration (immediate usable session).
      window.localStorage.removeItem("mb_admin_view_token");
      window.localStorage.removeItem("mb_admin_view");
      setDelegateToken(result.token);
      const self: DelegateSelf = { ...result.delegate, status: result.delegate.status as DelegateSelf["status"] };
      window.localStorage.setItem(DELEGATE_KEY, JSON.stringify(self));
      setDelegate(self);
      router.push("/delegate");
      return { verificationRequired: false };
    }

    return { verificationRequired: true, message: result.message, devVerifyLink: result.devVerifyLink };
  }

  function logout() {
    clearDelegateToken();
    window.localStorage.removeItem(DELEGATE_KEY);
    setDelegate(null);
    router.push("/delegate/login");
  }

  return (
    <DelegateAuthContext.Provider value={{ delegate, loading, login, register, logout }}>
      {children}
    </DelegateAuthContext.Provider>
  );
}

export function useDelegateAuth() {
  const ctx = useContext(DelegateAuthContext);
  if (!ctx) throw new Error("useDelegateAuth must be used within a DelegateAuthProvider");
  return ctx;
}
