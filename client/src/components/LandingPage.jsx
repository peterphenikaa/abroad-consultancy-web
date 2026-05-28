import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Globe2,
  BookOpen,
  Shield,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: Sparkles,
    title: "Intelligent Course Matching",
    description:
      "AI-powered recommendations based on your academic profile, interests, and career goals.",
  },
  {
    icon: Globe2,
    title: "Global University Database",
    description:
      "Access comprehensive information on 10,000+ universities across 50+ countries.",
  },
  {
    icon: BookOpen,
    title: "Exam Preparation Guidance",
    description:
      "Personalized study plans for IELTS, TOEFL, GRE, GMAT, and more.",
  },
  {
    icon: Shield,
    title: "Visa & Immigration Support",
    description:
      "Step-by-step guidance through visa applications and documentation requirements.",
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    university: "MIT, Computer Science",
    text: "Study Abroad AI helped me discover the perfect program. The personalized guidance was invaluable.",
    image:
      "https://images.unsplash.com/photo-1758599668780-60d53c35135d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  },
  {
    name: "Marco Silva",
    university: "Oxford, Engineering",
    text: "The exam prep resources and application timeline kept me on track throughout the entire process.",
    image:
      "https://images.unsplash.com/photo-1752650143742-502a15f4770f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  },
  {
    name: "Priya Patel",
    university: "Stanford, Business",
    text: "From university selection to visa application, every step was simplified with AI-powered insights.",
    image:
      "https://images.unsplash.com/photo-1758613171187-9a41d0fc93ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const shapeY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden">
        <motion.div style={{ y: shapeY }} className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[var(--accent-violet)]/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[var(--accent-amber)]/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-[var(--accent-coral)]/10 to-transparent rounded-full blur-3xl" />
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              style={{ y: heroY, opacity: heroOpacity }}
              className="space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Badge className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--accent-amber)]/10 to-[var(--accent-coral)]/10 border-[var(--accent-amber)]/20 text-sm font-medium">
                  <Sparkles className="w-4 h-4 text-[var(--accent-amber)]" />
                  AI-Powered Global Education Platform
                </Badge>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-6"
              >
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-[var(--font-serif)] text-[var(--primary)] leading-tight">
                  Your Intelligent Global Education{" "}
                  <span className="bg-gradient-to-r from-[var(--accent-amber)] via-[var(--accent-coral)] to-[var(--accent-violet)] bg-clip-text text-transparent">
                    Co-Pilot
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-[var(--muted-foreground)] max-w-xl leading-relaxed">
                  Navigate your study abroad journey with AI-powered insights.
                  From university selection to visa applications, we simplify
                  every step of your global education adventure.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="gradient"
                    size="lg"
                    className="group"
                    onClick={() => navigate("/login")}
                  >
                    Start Your Journey
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate("/search")}
                  >
                    Explore Universities
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex items-center gap-6 pt-4"
              >
                <div className="flex -space-x-3">
                  {testimonials.slice(0, 3).map((t, i) => (
                    <img
                      key={t.name}
                      src={t.image}
                      alt={t.name}
                      className="w-10 h-10 rounded-full border-2 border-white object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-[var(--foreground)]">
                    Join 50,000+ students
                  </div>
                  <div className="text-[var(--muted-foreground)]">
                    Already achieving their dreams
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative z-10"
                >
                  <div className="aspect-[4/5]">
                    <img
                      src="https://images.unsplash.com/photo-1758613171187-9a41d0fc93ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
                      alt="Diverse students"
                      className="rounded-3xl shadow-2xl object-cover w-full h-full"
                      loading="lazy"
                    />
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                  className="absolute -top-6 -left-6 bg-white rounded-2xl shadow-xl p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-violet)] to-[var(--accent-violet-light)] flex items-center justify-center">
                      <Globe2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[var(--foreground)]">
                        10K+
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        Universities
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-amber)] to-[var(--accent-coral)] flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[var(--foreground)]">
                        98%
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        Success Rate
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-transparent to-[var(--secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-[var(--font-serif)] text-[var(--primary)] mb-4">
              Everything you need to succeed abroad
            </h2>
            <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
              Comprehensive tools and insights powered by advanced AI to guide
              your entire study abroad journey.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <div className="h-full bg-white rounded-2xl p-8 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-xl)] transition-all border border-transparent hover:border-[var(--accent-amber)]/20">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--accent-amber)]/10 to-[var(--accent-coral)]/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7 text-[var(--accent-amber)]" />
                    </div>
                    <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-[var(--muted-foreground)] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 bg-[var(--secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-[var(--font-serif)] text-[var(--primary)] mb-4">
              Success stories from around the world
            </h2>
            <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
              Join thousands of students who have achieved their dream of
              studying abroad.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, index) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-[var(--shadow-md)] border border-[var(--border)]"
              >
                <div className="flex items-start gap-4 mb-6">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-14 h-14 rounded-full object-cover"
                    loading="lazy"
                  />
                  <div>
                    <div className="font-semibold text-[var(--foreground)]">
                      {t.name}
                    </div>
                    <div className="text-sm text-[var(--accent-amber)]">
                      {t.university}
                    </div>
                  </div>
                </div>
                <p className="text-[var(--muted-foreground)] leading-relaxed italic">
                  "{t.text}"
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-[var(--primary)] via-[#3730a3] to-[var(--accent-violet-dark)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-[var(--font-serif)] text-white leading-tight">
              Ready to begin your global education journey?
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Get personalized university recommendations, application guidance,
              and visa support in minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="bg-white text-[var(--primary)] hover:bg-white/90 shadow-xl font-semibold"
                  onClick={() =>
                    window.alert("Hook this up to your signup flow.")
                  }
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 hover:bg-white/20"
                  onClick={() =>
                    window.alert("Hook this up to your courses page.")
                  }
                >
                  View Courses
                </Button>
              </motion.div>
            </div>

            <div className="pt-8 flex items-center justify-center gap-8 text-white/70">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm">Free consultation</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
