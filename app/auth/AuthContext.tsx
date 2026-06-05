"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { User, Permission } from "@/types/User";
import { getMe } from "@/services/meService";

type CognitoIdToken = {
  sub: string;
  email?: string;
  name?: string;
  given_name?: string;
  exp?: number;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  loadMe: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    const idToken = localStorage.getItem("id_token");

    if (!idToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode<CognitoIdToken>(idToken);

      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("id_token");
        setUser(null);
        setLoading(false);
        return;
      }

      const me = await getMe();

      setUser({
        userId: me.userId || decoded.sub,
        email: me.email || decoded.email || "",
        name: me.nome || decoded.name || decoded.given_name || "",
        roles: me.roles || [],
        permissions: ((me.permissions || []) as string[]).map((p) => p.replace(/^"|"$/g, "")) as Permission[],
      });
    } catch (error) {
      console.error(error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  function logout() {
    localStorage.removeItem("id_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    setUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loadMe,
        logout,
        isAuthenticated: user !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}