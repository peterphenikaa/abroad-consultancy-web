import { useState, useEffect } from "react";
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
  LogIn,
  UserPlus,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const publicItems: NavItem[] = [
  { path: "/", label: "Home", icon: Globe },
  { path: "/courses", label: "Courses", icon: GraduationCap },
  { path: "/search", label: "Search", icon: Search },
];

const privateItems: NavItem[] = [
  { path: "/advisor", label: "AI Advisor", icon: Compass },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/payment", label: "Payment", icon: CreditCard },
];

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const visibleItems = isAuthenticated
    ? [...publicItems, ...privateItems]
    : publicItems;

  useEffect(() => {
    const handleClickOutside = () => setUserMenuOpen(false);
    if (userMenuOpen) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [userMenuOpen]);

  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

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
                {visibleItems.map((item) => {
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
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                              }}
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </LayoutGroup>

            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserMenuOpen(!userMenuOpen);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--accent)] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-amber)] to-[var(--accent-coral)] flex items-center justify-center text-white text-sm font-bold">
                      {userInitial}
                    </div>
                    <User className="w-4 h-4 text-[var(--muted-foreground)]" />
                  </button>

                  {userMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[var(--border)] py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-[var(--border)]">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">
                          {user?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-br from-[var(--accent-amber)] to-[var(--accent-coral)] text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign up
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-[var(--accent)] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
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
              {visibleItems.map((item) => {
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

              <div className="border-t border-[var(--border)] pt-2 mt-2">
                {isAuthenticated ? (
                  <div className="px-4 py-2 space-y-2">
                    <div className="flex items-center gap-3 px-4 py-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-amber)] to-[var(--accent-coral)] flex items-center justify-center text-white text-sm font-bold">
                        {userInitial}
                      </div>
                      <span className="text-sm font-medium text-[var(--foreground)] truncate">
                        {user?.email}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Log out</span>
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-2 space-y-1">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--secondary)] transition-colors"
                    >
                      <LogIn className="w-5 h-5 text-[var(--muted-foreground)]" />
                      <span className="font-medium">Log in</span>
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--secondary)] transition-colors"
                    >
                      <UserPlus className="w-5 h-5 text-[var(--muted-foreground)]" />
                      <span className="font-medium">Sign up</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </motion.nav>

      <div className="h-16" />
    </>
  );
}
