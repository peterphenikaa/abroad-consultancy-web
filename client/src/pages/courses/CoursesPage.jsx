import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BookOpen, TrendingUp, Award, Calendar, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { CourseCard } from "./components/CourseCard";
import { MilestoneList } from "./components/MilestoneList";
import { StudyStreak } from "./components/StudyStreak";
import { ExamCard } from "./components/ExamCard";
import { upcomingExams } from "./data";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { openCourseWithPaymentGate, formatMoneyVnd, coursePriceVnd } from "../../lib/courseAccess";

const themeColors = "var(--chart-1)";

export default function CoursesPage() {

  const navigate = useNavigate();

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [openingCourseId, setOpeningCourseId] = useState(null);

  const { data: coursesData, isLoading: isLoadingCourses, error: errorCourses } = useQuery({
    queryKey: ["my-courses"],
    queryFn: async () => {
      const res = await axios.get("/api/v1/courses/my-courses");
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: catalogData, isLoading: isLoadingCatalog } = useQuery({
    queryKey: ["course-catalog"],
    queryFn: async () => {
      const res = await axios.get("/api/v1/courses?limit=20");
      return res.data.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: milestonesData, isLoading: isLoadingMilestones } = useQuery({
    queryKey: ["my-milestones"],
    queryFn: async () => {
      const res = await axios.get("/api/v1/courses/my-milestones");
      return res.data.data;
    },
  });

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ["my-stats"],
    queryFn: async () => {
      const res = await axios.get("/api/v1/courses/my-stats");
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const courses = coursesData || [];
  const isLoading = isLoadingCourses || isLoadingStats || isLoadingMilestones;
  const error = errorCourses ? "Failed to load courses. Please try again later." : null;

  const handleCourseSelect = (courseId) => {
    setSelectedCourse((prev) => (prev === courseId ? null : courseId));
  };

  const handleOpenCourse = async (course) => {
    const courseId = course.id || course.courseId;
    setOpeningCourseId(courseId);
    try {
      await openCourseWithPaymentGate(courseId, navigate);
    } finally {
      setOpeningCourseId(null);
    }
  };

  const enrolledCourseIds = courses.map(c => c.id || c.courseId);
  const catalogCourses = (catalogData || [])
    .filter((c) => c.status === "PUBLISHED")
    .filter((c) => !enrolledCourseIds.includes(c.courseId || c.id));

  const displayStats = statsData || {
    coursesEnrolled: 0,
    averageProgress: 0,
    contentCompleted: 0,
    totalContents: 0,
  };

  const STATS_ARRAY = [
    { icon: BookOpen, label: "Courses Enrolled", value: displayStats.coursesEnrolled },
    { icon: TrendingUp, label: "Average Progress", value: `${displayStats.averageProgress}%` },
    { icon: Award, label: "Items Completed", value: `${displayStats.contentCompleted}/${displayStats.totalContents}` },
    { icon: Calendar, label: "Total Items", value: displayStats.totalContents },
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <main className="max-w-7xl mx-auto px-6 py-8">

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-[var(--font-serif)] text-[var(--primary)] mb-3">
            Your Learning Journey
          </h1>
          <p className="text-lg text-[var(--muted-foreground)]">
            Track your progress, master exams, and achieve your study abroad goals
          </p>
        </motion.div>

        {/* Overall Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12 bg-gradient-to-br from-[var(--primary)] via-[#3730a3] to-[var(--accent-violet)] rounded-3xl p-8 text-white shadow-[var(--shadow-2xl)]"
        >
          <div className="grid md:grid-cols-4 gap-6">
            {STATS_ARRAY.map(({ icon: Icon, label, value }) => (
              <div key={label}>
                <div className="flex items-center gap-2 mb-2 opacity-90">
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <div className="text-3xl font-bold">{value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-[var(--accent-amber)]" />
                Explore courses
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                {isLoadingCatalog ? (
                  <p className="text-neutral-500 col-span-2">Loading courses…</p>
                ) : catalogCourses.length === 0 ? (
                  <p className="text-neutral-500 col-span-2">No courses available yet.</p>
                ) : (
                  catalogCourses.map((course) => {
                    const courseId = course.courseId || course.id;
                    const priceVnd = course.isFree ? 0 : coursePriceVnd(course.price);
                    return (
                      <Card
                        key={courseId}
                        className="border-neutral-200 rounded-2xl hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-5 space-y-4">
                          <div className="space-y-2">
                            <Badge variant="secondary" className="font-normal border-0 text-xs">
                              {course.subject || "Course"}
                            </Badge>
                            <h3 className="text-lg font-bold font-[var(--font-serif)] text-neutral-900">
                              {course.title}
                            </h3>
                            <p className="text-sm text-neutral-500 line-clamp-2">
                              {course.description || "Quality content with a clear learning path."}
                            </p>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-[var(--primary)]">
                              {course.isFree ? "Free" : formatMoneyVnd(priceVnd)}
                            </span>
                            <Button
                              variant="gradient"
                              size="sm"
                              disabled={openingCourseId === courseId}
                              onClick={() => handleOpenCourse({ ...course, id: courseId, courseId })}
                            >
                              {openingCourseId === courseId ? "Checking access…" : "Start learning"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-[var(--accent-amber)]" />
                Active Courses
              </h2>
              <div className="space-y-4">
                {isLoading === true ? (
                  <p className="text-neutral-500">Loading courses data.....</p>
                ) : error ? (
                  <p className="text-red-500">{error}</p>
                ) : courses.length === 0 ? (
                  <p className="text-neutral-500">No active courses found. Enroll in a course to get started!</p>
                ) : (
                  courses.map((course) => {
                    const courseId = course.id || course.courseId;
                    return (
                      <CourseCard
                        key={courseId}
                        course={course}
                        isSelected={selectedCourse === courseId}
                        onSelect={() => handleCourseSelect(courseId)}
                        onOpenCourse={handleOpenCourse}
                      />
                    );
                  })
                )}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-[var(--accent-violet)]" />
                Upcoming Exams
              </h2>
              <div className="space-y-4">
                {upcomingExams.map((exam) => <ExamCard key={exam.id} exam={exam} />)}
              </div>
            </section>
          </div>

          <div className="col-span-1 space-y-4">
            <MilestoneList milestones={milestonesData || []} />
            <StudyStreak streak={statsData?.streak || { days: 0, weekDays: [] }} />
          </div>
        </div>
      </main>
    </div>
  );
}
