import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const from = searchParams.get("from") || "/payment";

  const [email, setEmail] = useState(() => searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data.message ||
          (typeof data.error === "string" ? data.error : null) ||
          "Sign in failed";
        throw new Error(msg);
      }
      const token = data.access_token;
      if (token) {
        localStorage.setItem("access_token", token);
      }
      const safeFrom =
        from.startsWith("/") && !from.startsWith("//") && !from.includes(":") ? from : "/payment";
      navigate(safeFrom, { replace: true });
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-[var(--background)] to-[var(--secondary)]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-lg)]"
      >
        <h1 className="text-2xl font-[var(--font-serif)] text-[var(--primary)] mb-1">Sign in</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          Sign in to choose a plan and pay with VNPay. You will return to billing after a successful login.
        </p>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">{error}</div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--foreground)] mb-1.5 block">Email</label>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--foreground)] mb-1.5 block">Password</label>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted-foreground)] space-x-2">
          <span>
            No account?{" "}
            <Link
              to={`/register?from=${encodeURIComponent(from.startsWith("/") && !from.startsWith("//") ? from : "/payment")}`}
              className="text-[var(--accent-amber)] hover:underline"
            >
              Sign up
            </Link>
          </span>
          <span className="text-[var(--border)]">·</span>
          <Link to="/payment" className="text-[var(--accent-amber)] hover:underline">
            Back to billing
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
