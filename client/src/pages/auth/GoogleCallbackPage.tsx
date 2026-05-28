import { useEffect } from "react";
import { setLocalAccessToken } from "@/services/apiClient";
import { normalizeAccessToken } from "@/utils/jwt";

export function GoogleCallbackPage() {
  useEffect(() => {
    const hash = window.location.hash;

    const hashContent = hash.substring(1);

    const params = new URLSearchParams(hashContent);
    const token = normalizeAccessToken(params.get("access_token"));

    if (token) {
      setLocalAccessToken(token);
      window.location.href = "/dashboard";
    } else {
      console.log("[GoogleCallback] No token, redirecting to /login");
      window.location.href = "/login";
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-accent-amber border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
