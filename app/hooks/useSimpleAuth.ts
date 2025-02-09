"use client";
import { useState, useEffect, useCallback } from "react";

interface AuthData {
  token: string;
  expiry: number;
}

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

/**
 * Validates if the stored auth data has not expired.
 */
function isAuthDataValid(data: AuthData): boolean {
  return Date.now() < data.expiry;
}

export function useSimpleAuth() {
  const [authData, setAuthData] = useState<AuthData | null>(() => {
    const stored = getStoredAuthData();
    if (stored && isAuthDataValid(stored)) {
      return stored;
    }
    // Remove stale/expired data from storage.
    setStoredAuthData(null);
    return null;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (authData && !isAuthDataValid(authData)) {
        setAuthData(null);
        setStoredAuthData(null);
      }
    }, 60 * 1000); // check every minute

    return () => clearInterval(interval);
  }, [authData]);

  const bufferToHex = (buffer: ArrayBuffer): string => {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  /**
   * Logs in a user by generating a token from username and password.
   */
  const login = useCallback(async (username: string, password: string) => {
    const data = new TextEncoder().encode(`${username}:${password}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const token = bufferToHex(hashBuffer);
    const expiry = Date.now() + EXPIRY_DURATION;
    const newAuthData: AuthData = { token, expiry };

    setStoredAuthData(newAuthData);
    setAuthData(newAuthData);
  }, []);

  /**
   * Logs out the current user by clearing authentication data.
   */
  const logout = useCallback(() => {
    setAuthData(null);
    setStoredAuthData(null);
  }, []);

  const isAuthenticated = Boolean(authData && isAuthDataValid(authData));
  const currentUser = authData?.token || null;

  return { isAuthenticated, currentUser, login, logout };
}
