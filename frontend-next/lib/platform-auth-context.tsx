"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { platformApi, clearPlatformToken, getPlatformToken, setPlatformToken } from "./platform-api";
import type { PlatformAdmin } from "./types";

interface PlatformAdminAuthState {
  admin: PlatformAdmin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const PlatformAdminAuthContext = createContext<PlatformAdminAuthState | undefined>(undefined);

interface PlatformLoginResponse {
  success: true;
  token: string;
  admin: PlatformAdmin;
}

const PLATFORM_ADMIN_KEY = "mb_platform_admin";

export function PlatformAdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getPlatformToken();
    const stored = window.localStorage.getItem(PLATFORM_ADMIN_KEY);
    if (token && stored) {
      try {
        setAdmin(JSON.parse(stored));
      } catch {
        clearPlatformToken();
      }
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const result = await platformApi.post<PlatformLoginResponse>("/platform/auth/login", { email, password });
    setPlatformToken(result.token);
    window.localStorage.setItem(PLATFORM_ADMIN_KEY, JSON.stringify(result.admin));
    setAdmin(result.admin);
    router.push("/platform/dashboard");
  }

  function logout() {
    clearPlatformToken();
    window.localStorage.removeItem(PLATFORM_ADMIN_KEY);
    setAdmin(null);
    router.push("/platform/login");
  }

  return (
    <PlatformAdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </PlatformAdminAuthContext.Provider>
  );
}

export function usePlatformAdminAuth() {
  const ctx = useContext(PlatformAdminAuthContext);
  if (!ctx) throw new Error("usePlatformAdminAuth must be used within a PlatformAdminAuthProvider");
  return ctx;
}
