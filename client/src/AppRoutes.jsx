import { AnimatePresence, motion } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import LandingPage from "./components/LandingPage.jsx";
import AIAdvisorPage from "./pages/AIAdvisorPage.jsx";
import CoursesPage from "./pages/courses/CoursesPage.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import Navigation from "./components/Navigation";
import CourseDetailPage from "./pages/courses/CourseDetailPage.jsx";
import QuizExecutionPage from "./pages/courses/QuizExecutionPage.jsx";
import CoursePaymentPage from "./pages/courses/CoursePaymentPage.jsx";
import { LoginPage } from "./pages/auth/LoginPage.tsx";
import { SignUpPage } from "./pages/auth/SignUpPage.tsx";
import { VerifyEmailPage } from "./pages/auth/VerifyEmailPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { VerifyResetOtpPage } from "./pages/auth/VerifyResetOtpPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { GoogleCallbackPage } from "./pages/auth/GoogleCallbackPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

const pageVariants = {
  initial: { opacity: 0, y: 10, filter: "blur(2px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(2px)" },
};

export default function AppRoutes() {
  const location = useLocation();

  const isCourseDetailPage =
    location.pathname.startsWith("/courses/") &&
    location.pathname !== "/courses" &&
    !location.pathname.endsWith("/payment");

  const isCourseCheckoutPage =
    location.pathname.startsWith("/courses/") &&
    location.pathname.endsWith("/payment") &&
    location.pathname !== "/courses";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {!isCourseDetailPage && !isCourseCheckoutPage && <Navigation />}
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/advisor" element={<ProtectedRoute><AIAdvisorPage /></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
            <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route
              path="/courses/:courseId/payment"
              element={<ProtectedRoute><CoursePaymentPage /></ProtectedRoute>}
            />
            <Route path="/courses/:id" element={<ProtectedRoute><CourseDetailPage /></ProtectedRoute>} />
            <Route
              path="/courses/:courseId/quiz/:contentId/take"
              element={<ProtectedRoute><QuizExecutionPage /></ProtectedRoute>}
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/forgot-password/verify-otp"
              element={<VerifyResetOtpPage />}
            />
            <Route
              path="/forgot-password/reset"
              element={<ResetPasswordPage />}
            />
            <Route
              path="/oauth/google/callback"
              element={<GoogleCallbackPage />}
            />
          </Routes>
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
