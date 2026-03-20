import React, { createContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { useAuth as useAuthHook } from "@/hooks/use-auth";

interface AuthContextType {
  isAuthenticated: boolean;
  user: { id: string | number; email: string | null; name: string | null } | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  syncData: () => Promise<void>;
  isSyncing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, logout: authLogout } = useAuthHook();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Verificar se o usuário está autenticado
    if (user) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [user]);

  const login = async () => {
    // A autenticação é gerenciada pelo hook useAuth
    // Aqui apenas marcamos como autenticado quando o usuário faz login
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await authLogout();
      await SecureStore.deleteItemAsync("auth_token");
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const syncData = async () => {
    if (!isAuthenticated) {
      console.warn("Usuário não autenticado. Sincronização não disponível.");
      return;
    }

    setIsSyncing(true);
    try {
      // Aqui você implementaria a sincronização com o servidor
      // Por enquanto, apenas simulamos um delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Dados sincronizados com sucesso!");
    } catch (error) {
      console.error("Erro ao sincronizar dados:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user: user || null,
        isLoading: authLoading,
        login,
        logout,
        syncData,
        isSyncing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext deve ser usado dentro de AuthProvider");
  }
  return context;
}
