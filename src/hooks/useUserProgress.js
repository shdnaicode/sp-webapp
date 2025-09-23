import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

export function useUserProgress() {
  const { user, token, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reload = async () => {
    if (!user?.email || !token) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    let aborted = false;
    try {
      const res = await apiFetch("/api/progress", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.status === 401) {
        logout();
        if (!aborted) setError(new Error("Session expired. Please log in again."));
        return;
      }
      if (!res.ok) throw new Error(json?.message || "Failed to load progress");
      if (!aborted) setData(json);
    } catch (err) {
      if (!aborted) setError(err);
    } finally {
      if (!aborted) setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, token]);

  return { data, loading, error, reload };
}
