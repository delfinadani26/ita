import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  academic_degree?: string;
  category: "docente" | "estudante" | "outro" | "preletor";
  affiliation: "urnm" | "externo";
  institution?: string;
  role: "participant" | "avaliador" | "admin";
  qr_code?: string;
  payment_status: "pending" | "approved" | "paid" | "exempt";
  payment_amount?: number;
  is_checked_in: boolean;
  created_at: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  academic_degree?: string;
  category: string;
  affiliation: string;
  institution?: string;
  role?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/auth/me", baseUrl);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await res.json();
    setUser(data);
  };

  const register = async (data: RegisterData) => {
    const res = await apiRequest("POST", "/api/auth/register", data);
    const u = await res.json();
    setUser(u);
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
    } catch {
    } finally {
      setUser(null);
    }
  };

  const value = useMemo(() => ({
    user, isLoading, login, register, logout, refreshUser
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
