"use client";
import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import type { ReactNode } from "react";

interface AuthData {
  token: string;
  expiry: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  currentUser: null,
  login: async () => {},
  logout: () => {},
});

const STORAGE_KEY = "currentUser";
const EXPIRY_DURATION = 30 * 60 * 1000;

function getStoredAuthData(): AuthData | null {
  if (typeof window === "undefined" || !window.sessionStorage) return null;
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const data: AuthData = JSON.parse(stored);
      return data;
    } catch (error) {
      console.error("Failed to parse stored auth data:", error);
      return null;
    }
  }
  return null;
}

function setStoredAuthData(data: AuthData | null) {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  if (data) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

function isAuthDataValid(data: AuthData): boolean {
  return Date.now() < data.expiry;
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface AuthProviderProps {
  children: ReactNode;
}
export function AuthProvider({ children }: AuthProviderProps) {
  const [authData, setAuthData] = useState<AuthData | null>(() => {
    const stored = getStoredAuthData();
    if (stored && isAuthDataValid(stored)) {
      return stored;
    }
    setStoredAuthData(null);
    return null;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (authData && !isAuthDataValid(authData)) {
        setAuthData(null);
        setStoredAuthData(null);
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [authData]);

  const login = useCallback(async (username: string, password: string) => {
    const data = new TextEncoder().encode(`${username}:${password}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const token = bufferToHex(hashBuffer);
    const expiry = Date.now() + EXPIRY_DURATION;
    const newAuthData: AuthData = { token, expiry };

    setStoredAuthData(newAuthData);
    setAuthData(newAuthData);

    document.cookie = `currentUser=${token}; expires=${new Date(
      expiry
    ).toUTCString()}; path=/; Secure; SameSite=Strict`;
  }, []);

  const logout = useCallback(() => {
    setAuthData(null);
    setStoredAuthData(null);

    document.cookie =
      "currentUser=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; SameSite=Strict";
  }, []);

  const isAuthenticated = Boolean(authData && isAuthDataValid(authData));
  const currentUser = authData?.token || null;

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, currentUser, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useSimpleAuth() {
  return useContext(AuthContext);
}
