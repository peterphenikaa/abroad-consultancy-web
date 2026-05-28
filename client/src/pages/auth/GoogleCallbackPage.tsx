import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeAccessToken } from "@/utils/jwt";

export function GoogleCallbackPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const hash = window.location.hash;
    const hashContent = hash.substring(1);
    const params = new URLSearchParams(hashContent);
    const token = normalizeAccessToken(params.get("access_token"));

    if (token) {
      loginWithToken(token).then(() => {
        navigate("/dashboard", { replace: true });
      });
    } else {
      console.log("[GoogleCallback] No token, redirecting to /login");
      navigate("/login", { replace: true });
    }
  }, [navigate, loginWithToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-accent-amber border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
