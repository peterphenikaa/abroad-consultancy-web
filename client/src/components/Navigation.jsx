import { useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Globe,
  Compass,
  GraduationCap,
  CreditCard,
  LayoutDashboard,
  Search,
  BarChart3,
  PenLine,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Home", icon: Globe },
  { path: "/advisor", label: "AI Advisor", icon: Compass },
  { path: "/writing-score", label: "Writing AES", icon: PenLine },
  { path: "/courses", label: "Courses", icon: GraduationCap },
  { path: "/payment", label: "Payment", icon: CreditCard },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/search", label: "Search", icon: Search },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[var(--border)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-amber)] to-[var(--accent-coral)] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-[var(--font-serif)] text-lg leading-none text-[var(--primary)]">
                  Study Abroad AI
                </span>
                <span className="text-[10px] text-[var(--muted-foreground)] leading-none mt-0.5">
                  Global Education Co-Pilot
                </span>
              </div>
            </Link>

            <LayoutGroup id="nav-tabs">
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      className="relative px-4 py-2 rounded-lg transition-colors"
                      to={item.path}
                      end={item.path === "/"}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2">
                            <Icon
                              className={`w-4 h-4 ${
                                isActive
                                  ? "text-[var(--accent-amber)]"
                                  : "text-[var(--muted-foreground)]"
                              }`}
                            />
                            <span
                              className={`text-sm font-medium ${
                                isActive
                                  ? "text-[var(--foreground)]"
                                  : "text-[var(--muted-foreground)]"
                              }`}
                            >
                              {item.label}
                            </span>
                          </div>
                          {isActive && (
                            <motion.div
                              layoutId="activeTab"
                              className="absolute inset-0 bg-[var(--accent)]/50 rounded-lg -z-10"
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </LayoutGroup>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-[var(--accent)] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-[var(--border)] bg-white/95 backdrop-blur-xl"
          >
            <div className="px-4 py-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? "bg-[var(--accent)] text-[var(--foreground)]"
                        : "hover:bg-[var(--secondary)]"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        location.pathname === item.path
                          ? "text-[var(--accent-amber)]"
                          : "text-[var(--muted-foreground)]"
                      }`}
                    />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.nav>

      <div className="h-16" />
    </>
  );
}

