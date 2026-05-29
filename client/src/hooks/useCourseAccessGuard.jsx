import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchCourseAccess } from "../lib/courseAccess";
import { ContentSkeleton } from "../pages/courses/components/ContentSkeleton";

/** Chặn truy cập nội dung khóa học nếu chưa thanh toán. */
export function useCourseAccessGuard() {
  const { id, courseId: courseIdParam } = useParams();
  const courseId = id || courseIdParam;
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const access = await fetchCourseAccess(courseId);
        if (cancelled) return;
        if (access.hasAccess && !access.requiresLogin) {
          setAllowed(true);
          return;
        }
        navigate(`/courses/${courseId}/payment`, { replace: true });
      } catch {
        if (!cancelled) {
          navigate(`/courses/${courseId}/payment`, { replace: true });
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    if (courseId) check();
    return () => {
      cancelled = true;
    };
  }, [courseId, navigate]);

  return { allowed, checking, courseId };
}

export function CourseAccessGate({ children }) {
  const { allowed, checking } = useCourseAccessGuard();
  if (checking) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-8">
        <ContentSkeleton />
      </div>
    );
  }
  if (!allowed) return null;
  return children;
}
