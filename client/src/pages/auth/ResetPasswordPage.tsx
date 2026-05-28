import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useAuth();
  const token = location.state?.token as string | undefined;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      navigate("/forgot-password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ token, newPassword });
      navigate("/login", {
        state: {
          message:
            "Password reset successfully! Please log in with your new password.",
        },
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.detail || "Failed to reset password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-xl bg-linear-to-tr from-accent-amber to-accent-violet flex items-center justify-center text-white shadow-lg mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-(--font-serif) text-slate-900">
            Reset Password
          </h1>
          <p className="text-slate-500 text-sm">
            Choose a new password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-12 pl-12 pr-12 rounded-xl border-slate-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 pl-12 rounded-xl border-slate-200"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="gradient"
            className="w-full h-14 rounded-xl text-lg font-bold shadow-xl shadow-accent-amber/20"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Resetting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Reset Password
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </Button>
        </form>

        <p className="text-center text-slate-500 text-sm flex items-center justify-center gap-1">
          <ArrowLeft className="w-3 h-3" />
          Back to{" "}
          <Link
            to="/login"
            className="text-accent-violet font-bold hover:underline"
          >
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
