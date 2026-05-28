import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
  Chrome,
} from "lucide-react";
import { Button, Checkbox, ImageWithFallback, Input } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";

export function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await register({ fullName: name, email, password });
      navigate("/login", {
        state: {
          message:
            "Account created! Please check your email to verify your account.",
        },
      });
    } catch (err: any) {
      const detail = err?.response?.data?.error?.detail;
      setError(detail || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-(--font-sans)">
      {/* Left Section (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0 opacity-40">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1649730241052-cfb221848098?auto=format&fit=crop&q=80&w=1080"
            alt="Students collaborating"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-linear-to-br from-accent-violet/40 via-transparent to-accent-amber/40 mix-blend-overlay z-10" />

        <div className="relative z-20 w-full h-full flex flex-col justify-center p-16 text-white">
          <div className="space-y-8 max-w-lg">
            <h1 className="text-5xl font-(--font-serif) leading-tight">
              Start Your <br />
              <span className="text-accent-amber italic">
                Global Education
              </span>{" "}
              <br />
              Chapter Today.
            </h1>

            <ul className="space-y-6">
              {[
                "Personalized University Recommendations",
                "AI-Powered Application Review",
                "Dedicated International Support",
                "Visa Interview Simulation",
              ].map((item, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="flex items-center gap-4 text-lg font-medium text-slate-200"
                >
                  <div className="w-6 h-6 rounded-full bg-accent-amber/20 flex items-center justify-center text-accent-amber">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  {item}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right Section: Sign Up Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-20 bg-white lg:rounded-l-[40px] shadow-2xl z-30 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 my-auto">
          <div className="text-center lg:text-left space-y-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 justify-center lg:justify-start mb-6"
            >
              <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-accent-amber to-accent-violet flex items-center justify-center text-white shadow-lg">
                <span className="font-bold text-xl">N</span>
              </div>
              <span className="text-2xl font-bold tracking-tight">
                NexStudy AI
              </span>
            </motion.div>
            <h2 className="text-3xl font-var(--font-serif) text-slate-900">
              Create Account
            </h2>
            <p className="text-slate-500 font-medium">
              Empower your dreams with intelligent counseling
            </p>
          </div>

          {location.state?.message && (
            <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
              {location.state.message}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Alex Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 pl-12 rounded-xl border-slate-200 focus:border-accent-amber transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-12 rounded-xl border-slate-200 focus:border-accent-amber transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pl-12 rounded-xl border-slate-200 focus:border-accent-amber transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                    Confirm
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 pl-12 rounded-xl border-slate-200 focus:border-accent-amber transition-all"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-bold text-accent-violet hover:underline flex items-center gap-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-3 h-3" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                  {showPassword ? "Hide Passwords" : "Show Passwords"}
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-2 bg-slate-50 p-4 rounded-xl">
              <Checkbox
                id="terms"
                className="mt-0.5 rounded-md border-slate-300"
                required
              />
              <label
                htmlFor="terms"
                className="text-xs font-medium text-slate-600 leading-normal"
              >
                I agree to the{" "}
                <Link to="#" className="text-accent-violet font-bold">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="#" className="text-accent-violet font-bold">
                  Privacy Policy
                </Link>
                . I understand NexStudy AI will handle my data securely.
              </label>
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
                  Building Profile...
                </div>
              ) : (
                "Create Account"
              )}
            </Button>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <span className="relative px-4 bg-white text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                Or register with
              </span>
            </div>

            <Button
              variant="outline"
              className="w-full h-12 rounded-xl border-slate-200 hover:bg-slate-50 transition-all font-medium flex items-center justify-center gap-3"
              onClick={() => (window.location.href = "/api/auth/google")}
            >
              <Chrome className="w-5 h-5 text-red-500" />
              Sign up with Google
            </Button>
          </form>

          <p className="text-center text-slate-500 font-medium pb-4">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-accent-violet font-bold hover:underline"
            >
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
