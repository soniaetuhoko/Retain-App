import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getMe, signIn as apiSignIn, signUp as apiSignUp, TOKEN_KEY } from "../api/client";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  signUp: (payload: { name: string; email: string; password: string }) => Promise<void>;
  signIn: (payload: { email: string; password: string }) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function saveSession(token: string, user: User, setToken: (value: string) => void, setUser: (value: User) => void) {
  localStorage.setItem(TOKEN_KEY, token);
  setToken(token);
  setUser(user);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      setLoading(false);
      return;
    }
    setToken(saved);
    getMe()
      .then((current) => setUser(current))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function signUp(payload: { name: string; email: string; password: string }) {
    const result = await apiSignUp(payload);
    saveSession(result.token, result.user, setToken, setUser);
  }

  async function signIn(payload: { email: string; password: string }) {
    const result = await apiSignIn(payload);
    saveSession(result.token, result.user, setToken, setUser);
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}