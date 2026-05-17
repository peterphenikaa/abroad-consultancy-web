import { Role } from '@prisma/client';
import { PERMISSIONS, PermissionType } from './permission.constant';

// prioty order for role hierarchy
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.STUDENT]: 1,
  [Role.TEACHER]: 2,
  [Role.CONTENT_CREATOR]: 3,
  [Role.ORG_ADMIN]: 4,
  [Role.SUPER_ADMIN]: 5,
};

// Permission map - strictly typed to use only defined permissions
export const ROLE_PERMISSIONS: Record<Role, PermissionType[]> = {
  [Role.STUDENT]: [
    PERMISSIONS.PROFILE_READ_OWN,
    PERMISSIONS.PROFILE_UPDATE_OWN,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.ENROLLMENT_CREATE,
  ],
  [Role.TEACHER]: [
    PERMISSIONS.PROFILE_READ_OWN,
    PERMISSIONS.PROFILE_UPDATE_OWN,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.COURSE_CREATE,
    PERMISSIONS.COURSE_UPDATE_OWN,
    PERMISSIONS.STUDENT_VIEW,
    PERMISSIONS.GRADE_MANAGE,
  ],
  [Role.CONTENT_CREATOR]: [
    PERMISSIONS.PROFILE_READ_OWN,
    PERMISSIONS.PROFILE_UPDATE_OWN,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.COURSE_CREATE,
    PERMISSIONS.COURSE_UPDATE_OWN,
    PERMISSIONS.CONTENT_MANAGE,
  ],
  [Role.ORG_ADMIN]: [
    PERMISSIONS.PROFILE_READ_OWN,
    PERMISSIONS.PROFILE_UPDATE_OWN,
    PERMISSIONS.PROFILE_READ_ANY,
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.ORG_MANAGE,
    PERMISSIONS.REPORT_VIEW,
  ],
  [Role.SUPER_ADMIN]: [PERMISSIONS.ALL],
};

// helper: role A >= role B?
export function hasRoleLevel(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Export PERMISSIONS for external use
export { PERMISSIONS, PermissionType } from './permission.constant';
