import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();

const COURSE_QUERY_PREFIXES = ["my-courses", "my-stats", "my-milestones", "course-catalog"];

export function clearCourseQueryCache() {
  COURSE_QUERY_PREFIXES.forEach((key) => {
    queryClient.removeQueries({ queryKey: [key] });
  });
}
