"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, clearToken, getToken, setToken } from "./api";
import type { DelegateSelf } from "./types";

interface DelegateAuthState {
  delegate: DelegateSelf | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: Record<string, unknown>) => Promise<void>;
  logout: () => void;
}

const DelegateAuthContext = createContext<DelegateAuthState | undefined>(undefined);

interface DelegateAuthResponse {
  success: true;
  token: string;
  delegate: { id: number; fullName: string; email: string; status: string };
}

const DELEGATE_KEY = "mb_delegate";

export function DelegateAuthProvider({ children }: { children: ReactNode }) {
  const [delegate, setDelegate] = useState<DelegateSelf | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const stored = window.localStorage.getItem(DELEGATE_KEY);
    if (token && stored) {
      try {
        setDelegate(JSON.parse(stored));
      } catch {
        clearToken();
      }
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const result = await api.post<DelegateAuthResponse>("/auth/delegate/login", { email, password });
    setToken(result.token);
    const self: DelegateSelf = { ...result.delegate, status: result.delegate.status as DelegateSelf["status"] };
    window.localStorage.setItem(DELEGATE_KEY, JSON.stringify(self));
    setDelegate(self);
    router.push("/delegate");
  }

  async function register(payload: Record<string, unknown>) {
    const result = await api.post<DelegateAuthResponse>("/auth/delegate/register", payload);
    setToken(result.token);
    const self: DelegateSelf = { ...result.delegate, status: result.delegate.status as DelegateSelf["status"] };
    window.localStorage.setItem(DELEGATE_KEY, JSON.stringify(self));
    setDelegate(self);
    router.push("/delegate");
  }

  function logout() {
    clearToken();
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
