import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Chrome } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { motion } from "framer-motion";
import { Button, Checkbox, Input } from "@/components/ui";

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-(--font-sans)">
      {/* Left Section: Illustration & Value Prop */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0 opacity-60">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1649730241052-cfb221848098?auto=format&fit=crop&q=80&w=1080"
            alt="Students on campus"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/40 to-transparent z-10" />

        <div className="relative z-20 w-full h-full flex flex-col justify-end p-16 text-white space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-(--font-serif) leading-tight mb-4">
              Your Intelligent <br />
              <span className="text-accent-amber">Global Education</span>{" "}
              Co-Pilot
            </h1>
            <p className="text-lg text-slate-300 max-w-md">
              Join thousands of students achieving their dreams abroad with
              personalized AI guidance, expert counseling, and intelligent
              course management.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-8 pt-10">
            <div className="space-y-1">
              <div className="text-3xl font-bold text-accent-amber">50k+</div>
              <p className="text-sm text-slate-400 font-medium">
                Global Students
              </p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-accent-violet">98%</div>
              <p className="text-sm text-slate-400 font-medium">
                Visa Success Rate
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-20 bg-white lg:rounded-l-[40px] shadow-2xl z-30">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left space-y-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 justify-center lg:justify-start mb-6"
            >
              <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-accent-amber to-accent-violet flex items-center justify-center text-white shadow-lg">
                <span className="font-bold text-xl">N</span>
              </div>
              <span className="text-2xl font-bold tracking-tight">
                NexStudy AI
              </span>
            </motion.div>
            <h2 className="text-3xl font-(--font-serif) text-slate-900">
              Welcome Back
            </h2>
            <p className="text-slate-500">
              Sign in to continue your global journey
            </p>
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl border-slate-200 hover:bg-slate-50 transition-all font-medium flex items-center justify-center gap-3"
            >
              <Chrome className="w-5 h-5 text-red-500" />
              Continue with Google
            </Button>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <span className="relative px-4 bg-white text-xs uppercase tracking-widest text-slate-400 font-bold">
                Or with email
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="name@university.edu"
                    className="h-12 pl-12 rounded-xl border-slate-200 focus:border-accent-amber focus:ring-accent-amber/10 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    to="#"
                    className="text-sm font-semibold text-accent-violet hover:text-accent-violet-dark transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-12 pl-12 pr-12 rounded-xl border-slate-200 focus:border-accent-amber focus:ring-accent-amber/10 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                className="rounded-md border-slate-300 data-[state=checked]:bg-accent-amber data-[state=checked]:border-accent-amber"
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600"
              >
                Remember me for 30 days
              </label>
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full h-14 rounded-xl text-lg font-bold shadow-xl shadow-accent-amber/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Login to Portal
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>
          </form>

          <p className="text-center text-slate-500 font-medium">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-accent-violet font-bold hover:underline"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
