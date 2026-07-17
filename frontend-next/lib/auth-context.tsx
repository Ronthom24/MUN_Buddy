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
    message: string;
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
  message: string;
  organizer: Organizer;
  organization: Organization;
  conference: Conference;
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
    setToken(result.token);
    window.localStorage.setItem(ORGANIZER_KEY, JSON.stringify(result.organizer));
    setOrganizer(result.organizer);
    router.push("/dashboard");
  }

  async function register(payload: Record<string, unknown>) {
    // Deliberately no auto-login here: the account must be email-verified
    // (see /verify-email) before the returned session is usable.
    const result = await api.post<RegisterResponse>("/auth/organizer/register", payload);
    return {
      organization: result.organization,
      conference: result.conference,
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
