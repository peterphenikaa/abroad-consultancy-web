/**
 * Enums
 */
export namespace $Enums {
  export const Role = {
    STUDENT: "STUDENT",
    TEACHER: "TEACHER",
    ORG_ADMIN: "ORG_ADMIN",
    CONTENT_CREATOR: "CONTENT_CREATOR",
    SUPER_ADMIN: "SUPER_ADMIN",
  } as const;

  export type Role = (typeof Role)[keyof typeof Role];

  export const Status = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    LOCKED: "LOCKED",
    BANNED: "BANNED",
  } as const;

  export type Status = (typeof Status)[keyof typeof Status];
}

/**
 * Xuất cả Type và Value ra lớp ngoài cùng để các file UI import ngắn gọn nhất
 */
// Export cho phần định nghĩa kiểu dữ liệu: let currentRole: Role;
export type Role = $Enums.Role;
// Export cho phần gọi giá trị trực tiếp: if (role === Role.STUDENT)
export const Role = $Enums.Role;

export type Status = $Enums.Status;
export const Status = $Enums.Status;
