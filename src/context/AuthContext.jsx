import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { apiFetch } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const rawUser = localStorage.getItem("auth:user");
        const rawToken = localStorage.getItem("auth:token");
        if (rawUser) setUser(JSON.parse(rawUser));
        if (rawToken) setToken(rawToken);
        if (rawToken && !rawUser) {
          const res = await apiFetch("/api/me", { headers: { Authorization: `Bearer ${rawToken}` } });
          if (res.ok) {
            const data = await res.json();
            if (data?.user) setUser(data.user);
          } else {
            localStorage.removeItem("auth:token");
          }
        }
      } catch {}
      setInitializing(false);
    })();
  }, []);

  const saveUser = useCallback((u) => {
    setUser(u);
    try {
      localStorage.setItem("auth:user", JSON.stringify(u));
    } catch {}
  }, []);

  const saveToken = useCallback((t) => {
    setToken(t);
    try {
      localStorage.setItem("auth:token", t);
    } catch {}
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem("auth:user");
      localStorage.removeItem("auth:token");
    } catch {}
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await apiFetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(email).trim().toLowerCase(), password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data?.message || "Login failed";
      throw new Error(msg);
    }
    if (data?.token) saveToken(data.token);
    if (data?.user) saveUser(data.user);
    return data.user;
  }, [saveToken, saveUser]);

  const register = useCallback(async (username, email, password) => {
    const res = await apiFetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: String(username).trim(), email: String(email).trim().toLowerCase(), password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data?.message || "Registration failed";
      throw new Error(msg);
    }
    await login(email, password);
    return { message: data.message };
  }, [login]);

  const logout = useCallback(() => { clearUser(); }, [clearUser]);

  const applyAuthUpdate = useCallback((newToken, newUser) => {
    if (newToken) {
      setToken(newToken);
      try { localStorage.setItem("auth:token", newToken); } catch {}
    }
    if (newUser) {
      setUser(newUser);
      try { localStorage.setItem("auth:user", JSON.stringify(newUser)); } catch {}
    }
  }, []);

  const value = useMemo(
    () => ({ user, token, initializing, login, register, logout, applyAuthUpdate }),
    [user, token, initializing, login, register, logout, applyAuthUpdate]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
