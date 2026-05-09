# RBAC - Role-Based Access Control

## 1. Core Components

a RBAC syss consists of the following core components:

- **User**: an individual who interacts with the system. Each user can have one or more roles assigned to them.
- **Role**: a group of permissions that can be assigned to users. Examples: STUDENT, TEACHER, ORG_ADMIN, CONTENT_CREATOR, SUPER_ADMIN
- **Permission**: a specific action that can be performed in the system. Examples: `CREATE_COURSE`, `EDIT_COURSE`, `DELETE_COURSE`, `VIEW_ANALYTICS`
- **Resource**: an entity in the system that permissions apply to. Examples: `Course`, `User`, `AnalyticsReport`

## 2. Core Concepts

1. **Role Assignment**: Users are assigned roles, and roles have permissions. This allows for flexible access control based on user responsibilities.
2. **Authentication**: Users must authenticate themselves (e.g., via JWT) to access the system. The authentication process verifies the user's identity and retrieves their assigned roles and permissions.
3. **Authorization Middleware**: In an Express.js application, you can create middleware to check user permissions before allowing access to certain routes.
