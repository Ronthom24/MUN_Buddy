"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, clearToken, getToken, setToken } from "./api";
import type { Organizer, Organization, Conference } from "./types";

interface AuthState {
  organizer: Organizer | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: Record<string, unknown>) => Promise<{
    organization: Organization;
    conference: Conference;
    verificationRequired: boolean;
    message?: string;
    devVerifyLink?: string;
  }>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

interface LoginResponse {
  success: true;
  token: string;
  organizer: Organizer;
}

interface RegisterResponse {
  success: true;
  organizer: Organizer;
  organization: Organization;
  conference: Conference;
  // Present only when REQUIRE_EMAIL_VERIFICATION=false on the backend (see
  // authService.js) -- registration auto-logs in immediately, same as
  // before email verification existed.
  token?: string;
  // Present only when verification is required.
  message?: string;
  devVerifyLink?: string;
}

const ORGANIZER_KEY = "mb_organizer";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const stored = window.localStorage.getItem(ORGANIZER_KEY);
    if (token && stored) {
      try {
        setOrganizer(JSON.parse(stored));
      } catch {
        clearToken();
      }
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const result = await api.post<LoginResponse>("/auth/organizer/login", { email, password });
    // getToken() in lib/api.ts always prefers an admin-view token over the
    // normal one, with no expiry check on the client side -- without this,
    // a stale "view as organizer" session from platform admin (valid up to
    // 2 hours, id: null) silently hijacks every request this fresh login
    // makes, and /organizations/me etc. come back empty with no error.
    window.localStorage.removeItem("mb_admin_view_token");
    window.localStorage.removeItem("mb_admin_view");
    setToken(result.token);
    window.localStorage.setItem(ORGANIZER_KEY, JSON.stringify(result.organizer));
    setOrganizer(result.organizer);
    router.push("/dashboard");
  }

  async function register(payload: Record<string, unknown>) {
    const result = await api.post<RegisterResponse>("/auth/organizer/register", payload);

    if (result.token) {
      // Verification is temporarily disabled backend-side -- behaves like
      // pre-verification registration (immediate usable session).
      window.localStorage.removeItem("mb_admin_view_token");
      window.localStorage.removeItem("mb_admin_view");
      setToken(result.token);
      window.localStorage.setItem(ORGANIZER_KEY, JSON.stringify(result.organizer));
      setOrganizer(result.organizer);
      router.push("/dashboard");
      return { organization: result.organization, conference: result.conference, verificationRequired: false };
    }

    return {
      organization: result.organization,
      conference: result.conference,
      verificationRequired: true,
      message: result.message,
      devVerifyLink: result.devVerifyLink,
    };
  }

  function logout() {
    clearToken();
    window.localStorage.removeItem(ORGANIZER_KEY);
    setOrganizer(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ organizer, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
