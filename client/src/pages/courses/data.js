export const statsData = {
  coursesEnrolled: 4,
  averageProgress: 53,
  lessonsCompleted: 44,
  totalLessons: 92,
  nextExamDays: 6,
};

export const activeCourses = [
  {
    id: 1,
    category: "English Proficiency",
    title: "TOEFL Preparation",
    nextLesson: "Speaking Practice: Task 1",
    completedLessons: 16,
    totalLessons: 24,
    dueDate: "4/15/2026",
    progress: 65,
    progressColor: "violet", 
  },
  {
    id: 2,
    category: "Graduate Exam",
    title: "GRE Quantitative Reasoning",
    nextLesson: "Algebra: Linear Equations",
    completedLessons: 13,
    totalLessons: 30,
    dueDate: "5/1/2026",
    progress: 42,
    progressColor: "amber",
  },
  {
    id: 3,
    category: "Application Skills",
    title: "Statement of Purpose Writing",
    nextLesson: "Final Review & Editing",
    completedLessons: 8,
    totalLessons: 10,
    dueDate: "4/20/2026",
    progress: 80,
    progressColor: "blue", 
  },
  {
    id: 4,
    category: "English Proficiency",
    title: "IELTS Academic Module",
    nextLesson: "Reading: Academic Texts",
    completedLessons: 7,
    totalLessons: 28,
    dueDate: "5/10/2026",
    progress: 25,
    progressColor: "pink", 
  },
];

export const milestones = [
  {
    id: 1,
    title: "Complete TOEFL Course",
    targetDate: "4/15/2026",
    completed: false,
  },
  {
    id: 2,
    title: "Take TOEFL Exam",
    targetDate: "4/18/2026",
    completed: false,
  },
  {
    id: 3,
    title: "Finish GRE Prep",
    targetDate: "5/1/2026",
    completed: false,
  },
  {
    id: 4,
    title: "Take GRE Exam",
    targetDate: "5/5/2026",
    completed: false,
  },
  {
    id: 5,
    title: "Finalize SOP",
    targetDate: "4/20/2026",
    completed: false,
  },
];

export const studyStreak = {
  days: 12,
  weekDays: [
    { label: "M", active: true },
    { label: "T", active: true },
    { label: "W", active: true },
    { label: "T", active: true },
    { label: "F", active: true },
    { label: "S", active: false },
    { label: "S", active: false },
  ],
};

export const upcomingExams = [
  {
    id: 1,
    title: "TOEFL iBT",
    date: "Saturday, April 18, 2026",
    time: "09:00 AM",
    location: "ETS Testing Center, Downtown",
    registerBy: "4/10/2026",
    status: "UPCOMING",
  },
  {
    id: 2,
    title: "GRE General Test",
    date: "Tuesday, May 5, 2026",
    time: "10:30 AM",
    location: "Prometric Test Center",
    registerBy: "4/25/2026",
    status: "UPCOMING",
  },
  {
    id: 3,
    title: "IELTS Practice Test",
    date: "Sunday, April 12, 2026",
    time: "02:00 PM",
    location: "Online",
    registerBy: "4/10/2026",
    status: "UPCOMING",
  },
];
