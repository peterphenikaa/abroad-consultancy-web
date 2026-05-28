/**
 * Centralized permission constants
 * Uses flat, uppercase structure with 'as const' for strict type safety
 * Prevents typos and magic strings across the application
 */

export const PERMISSIONS = {
  // Profile Permissions
  PROFILE_READ_OWN: "profile:read:own",
  PROFILE_UPDATE_OWN: "profile:update:own",
  PROFILE_READ_ANY: "profile:read:any",

  // Course Permissions
  COURSE_READ: "course:read",
  COURSE_CREATE: "course:create",
  COURSE_UPDATE_OWN: "course:update:own",

  // Enrollment Permissions
  ENROLLMENT_CREATE: "enrollment:create",

  // Student Permissions
  STUDENT_VIEW: "student:view",

  // Grade Permissions
  GRADE_MANAGE: "grade:manage",

  // Content Permissions
  CONTENT_MANAGE: "content:manage",

  // User Permissions
  USER_MANAGE: "user:manage",

  // Organization Permissions
  ORG_MANAGE: "org:manage",

  // Report Permissions
  REPORT_VIEW: "report:view",

  // Super Admin Wildcard
  ALL: "*",
} as const;

export type PermissionType = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
