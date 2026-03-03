import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "@/lib/supabase-service";

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
  payment_status: "pending" | "approved" | "paid" | "exempt" | "rejected";
  payment_amount?: number;
  is_checked_in: boolean;
  created_at: string;
  approved_at?: string;
  rejection_reason?: string;
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
      // Buscar dados da sessão local (se existirem)
      const storedUser = await AsyncStorage.getItem("user_session");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error: any) {
      console.warn("Failed to refresh user:", error?.message);
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // ✅ Fazer login com RPC Supabase (sem usar Auth)
      const result = await authService.login(email, password);

      if (result?.error) {
        throw new Error(result.error);
      }

      // Armazenar sessão localmente
      await AsyncStorage.setItem("user_session", JSON.stringify(result));
      await AsyncStorage.setItem("current_user_id", result.id.toString());
      
      setUser(result);
    } catch (error: any) {
      throw new Error(error.message || "Erro ao fazer login");
    }
  };

  const register = async (data: RegisterData) => {
    try {
      // ✅ Registar novo participante
      const result = await authService.register({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        academic_degree: data.academic_degree,
        category: data.category,
        affiliation: data.affiliation,
        institution: data.institution,
        role: data.role || "participant",
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // NÃO fazer auto-login após registro
      // Usuário precisa esperar aprovação do admin
      setUser(null);
      await AsyncStorage.removeItem("user_session");
    } catch (error: any) {
      throw new Error(error.message || "Erro ao registar utilizador");
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem("user_session");
      await AsyncStorage.removeItem("current_user_id");
    } catch (error: any) {
      console.error("Logout error:", error);
    }
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
