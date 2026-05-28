import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, KeyRound, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP code.");
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmail({ email, otp });
      navigate("/login", {
        state: { message: "Email verified successfully! You can now log in." },
      });
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      const detail = err?.response?.data?.error?.detail;
      if (code === "INVALID_OTP") {
        setError("Invalid or expired OTP. Please request a new one.");
      } else {
        setError(detail || "Verification failed. Please try again.");
      }
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
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-(--font-serif) text-slate-900">
            Verify Your Email
          </h1>
          <p className="text-slate-500 text-sm">
            Enter the 6-digit code sent to your email address.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="email"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 pl-12 rounded-xl border-slate-200"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              OTP Code
            </label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                inputMode="numeric"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="h-12 pl-12 text-center text-2xl tracking-[0.5em] rounded-xl border-slate-200"
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
                Verifying...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Verify Email
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </Button>
        </form>

        <p className="text-center text-slate-500 text-sm">
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
