import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { KeyRound, ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";

export function VerifyResetOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyResetOtp } = useAuth();
  const email = location.state?.email as string | undefined;
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      navigate("/forgot-password");
      return;
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyResetOtp({ email, otp });
      navigate("/forgot-password/reset", { state: { token: res } });
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.detail || "Invalid or expired code.",
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
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-(--font-serif) text-slate-900">
            Enter Reset Code
          </h1>
          <p className="text-slate-500 text-sm">
            Enter the 6-digit code sent to {email || "your email"}.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              6-Digit Code
            </label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="h-14 text-center text-2xl tracking-[0.5em] rounded-xl border-slate-200"
              required
            />
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
                Verifying...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Verify Code
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </Button>
        </form>

        <p className="text-center text-slate-500 text-sm flex items-center justify-center gap-1">
          <ArrowLeft className="w-3 h-3" />
          Back to{" "}
          <Link
            to="/forgot-password"
            className="text-accent-violet font-bold hover:underline"
          >
            Forgot Password
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
