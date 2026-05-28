import { AnimatePresence, motion } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import LandingPage from "./components/LandingPage.jsx";
import AIAdvisorPage from "./pages/AIAdvisorPage.jsx";
import CoursesPage from "./pages/courses/CoursesPage.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import Navigation from "./components/Navigation.jsx";
import CourseDetailPage from "./pages/courses/CourseDetailPage.jsx";
import QuizExecutionPage from "./pages/courses/QuizExecutionPage.jsx";
import CoursePaymentPage from "./pages/courses/CoursePaymentPage.jsx";

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
    location.pathname.endsWith("/payment");

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
            <Route path="/advisor" element={<AIAdvisorPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/courses/:courseId/payment" element={<CoursePaymentPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route path="/courses/:courseId/quiz/:contentId/take" element={<QuizExecutionPage />} />

          </Routes>
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
