import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function OAuthSuccess() {
  const navigate = useNavigate();
  const { applyAuthUpdate } = useAuth();

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const userB64 = params.get("user");
      let user = null;
      if (userB64) {
        try {
          const json = atob(userB64.replaceAll("-", "+").replaceAll("_", "/"));
          user = JSON.parse(json);
        } catch {}
      }
      if (token && user) {
        applyAuthUpdate(token, user);
        navigate("/", { replace: true });
      } else if (token) {
        applyAuthUpdate(token, null);
        navigate("/", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    } catch {
      navigate("/login", { replace: true });
    }
  }, [applyAuthUpdate, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="nb-card p-6 text-center">
        <p>Signing you in with GitHub…</p>
      </div>
    </div>
  );
}

export default OAuthSuccess;
