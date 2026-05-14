import { Role } from '@prisma/client';

// prioty order for role hierarchy
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.STUDENT]: 1,
  [Role.TEACHER]: 2,
  [Role.CONTENT_CREATOR]: 3,
  [Role.ORG_ADMIN]: 4,
  [Role.SUPER_ADMIN]: 5,
};

// Permission map
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.STUDENT]: ['profile:read:own', 'profile:update:own', 'course:read', 'enrollment:create'],
  [Role.TEACHER]: [
    'profile:read:own',
    'profile:update:own',
    'course:read',
    'course:create',
    'course:update:own',
    'student:view',
    'grade:manage',
  ],
  [Role.CONTENT_CREATOR]: [
    'profile:read:own',
    'profile:update:own',
    'course:read',
    'course:create',
    'course:update:own',
    'content:manage',
  ],
  [Role.ORG_ADMIN]: [
    'profile:read:own',
    'profile:update:own',
    'profile:read:any',
    'user:manage',
    'org:manage',
    'report:view',
  ],
  [Role.SUPER_ADMIN]: ['*'],
};

// helper: role A >= role B?
export function hasRoleLevel(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
