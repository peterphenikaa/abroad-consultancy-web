# Plan: Profile UI

## Tổng quan

Tạo trang profile cho phép user:
- Xem / chỉnh sửa thông tin cá nhân (fullName, phone, educationalLevel, bio, learningGoals)
- Đổi mật khẩu

Gồm **6 tasks** — làm tuần tự từ backend đến frontend.

---

## Task 1: Backend — Thêm endpoint `PUT /auth/change-password`

### File: `services/auth-service/src/modules/auth/auth.scheme.ts`

Thêm vào cuối file:

```typescript
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});

export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;
```

### File: `services/auth-service/src/modules/auth/auth.service.ts`

Thêm method `changePassword` vào class `AuthService`:

```typescript
static async changePassword(userId: string, payload: ChangePasswordDTO) {
  const { currentPassword, newPassword } = payload;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');

  if (!user.passwordHash) {
    throw new ApiError(400, 'Cannot change password for OAuth accounts', 'OAUTH_ACCOUNT');
  }

  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new ApiError(400, 'Current password is incorrect', 'INVALID_PASSWORD');
  }

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword },
  });

  return { message: 'Password changed successfully' };
}
```

### File: `services/auth-service/src/modules/auth/auth.controller.ts`

Thêm method vào class `AuthController`:

```typescript
static async changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as AuthUser;
    if (!user) throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');

    const parseResult = changePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errors = z.flattenError(parseResult.error).fieldErrors;
      throw new ApiError(400, 'Validation Error', 'VALIDATION_ERROR', errors);
    }

    const result = await AuthService.changePassword(user.id, parseResult.data);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
```

### File: `services/auth-service/src/modules/auth/auth.route.ts`

Thêm import và route:

```typescript
import { validateToken } from '../../middleware/validateToken';

// Thêm dòng này sau route refresh:
authRouter.put('/change-password', validateToken, AuthController.changePassword);
```

### Build & restart

```bash
cd services/auth-service && docker compose up -d --build auth-service
```

---

## Task 2: Frontend — Tạo userService client

### File: `client/src/services/userService.ts` (NEW)

```typescript
import apiClient from "./apiClient";

export interface UserProfile {
  userId: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  phone: string | null;
  educationalLevel: string | null;
  learningGoals: string | null;
}

export interface MeResponse {
  id: string;
  email: string;
  role: string;
  status: string;
  profile: UserProfile;
}

export interface UpdateProfileData {
  fullName?: string;
  bio?: string;
  phone?: string;
  educationalLevel?: string;
  learningGoals?: string;
}

export const getMyProfile = (): Promise<MeResponse> =>
  apiClient.get("/users/me").then((r) => r.data.data);

export const updateMyProfile = (data: UpdateProfileData): Promise<MeResponse> =>
  apiClient.put("/users/me", data).then((r) => r.data.data);
```

---

## Task 3: Frontend — Tạo EditProfileForm component

### File: `client/src/pages/profile/EditProfileForm.tsx` (NEW)

```tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { getMyProfile, updateMyProfile, type UpdateProfileData } from "@/services/userService";

export function EditProfileForm() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
  });

  const [form, setForm] = useState<UpdateProfileData>({});

  useEffect(() => {
    if (profile?.profile) {
      setForm({
        fullName: profile.profile.fullName || "",
        bio: profile.profile.bio || "",
        phone: profile.profile.phone || "",
        educationalLevel: profile.profile.educationalLevel || "",
        learningGoals: profile.profile.learningGoals || "",
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const handleChange = (field: keyof UpdateProfileData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (isError) return <p className="text-red-500">Failed to load profile.</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <Input value={form.fullName || ""} onChange={(e) => handleChange("fullName", e.target.value)} maxLength={255} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <Input value={form.phone || ""} onChange={(e) => handleChange("phone", e.target.value)} maxLength={20} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Educational Level</label>
        <select
          value={form.educationalLevel || ""}
          onChange={(e) => handleChange("educationalLevel", e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Select...</option>
          <option value="High School">High School</option>
          <option value="Bachelor">Bachelor</option>
          <option value="Master">Master</option>
          <option value="PhD">PhD</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Bio</label>
        <textarea
          value={form.bio || ""}
          onChange={(e) => handleChange("bio", e.target.value)}
          rows={3}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Learning Goals</label>
        <textarea
          value={form.learningGoals || ""}
          onChange={(e) => handleChange("learningGoals", e.target.value)}
          rows={3}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      {mutation.isError && (
        <p className="text-red-500 text-sm">Failed to update profile. Please try again.</p>
      )}
      {mutation.isSuccess && (
        <p className="text-green-600 text-sm">Profile updated successfully!</p>
      )}

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save Changes
      </Button>
    </form>
  );
}
```

---

## Task 4: Frontend — Tạo ChangePasswordForm component

### File: `client/src/pages/profile/ChangePasswordForm.tsx` (NEW)

```tsx
import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { Button, Input } from "@/components/ui";
import apiClient from "@/services/apiClient";

export function ChangePasswordForm() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.put("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      const detail = err?.response?.data?.error?.detail || "Failed to change password.";
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div className="relative">
        <label className="block text-sm font-medium mb-1">Current Password</label>
        <Input
          type={showPasswords ? "text" : "password"}
          value={form.currentPassword}
          onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          required
        />
      </div>

      <div className="relative">
        <label className="block text-sm font-medium mb-1">New Password</label>
        <Input
          type={showPasswords ? "text" : "password"}
          value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          required
        />
      </div>

      <div className="relative">
        <label className="block text-sm font-medium mb-1">Confirm New Password</label>
        <Input
          type={showPasswords ? "text" : "password"}
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          required
        />
      </div>

      <button
        type="button"
        onClick={() => setShowPasswords(!showPasswords)}
        className="text-sm text-[var(--muted-foreground)] flex items-center gap-1"
      >
        {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        {showPasswords ? "Hide" : "Show"} passwords
      </button>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">Password changed successfully!</p>}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
        Change Password
      </Button>
    </form>
  );
}
```

---

## Task 5: Frontend — Tạo ProfilePage (tổng hợp)

### File: `client/src/pages/profile/ProfilePage.tsx` (NEW)

```tsx
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { EditProfileForm } from "./EditProfileForm";
import { ChangePasswordForm } from "./ChangePasswordForm";

export function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "profile";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-8"
      >
        <h1 className="text-3xl sm:text-4xl font-[var(--font-serif)] text-[var(--foreground)] mb-8">
          My Profile
        </h1>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-[var(--border)] mb-8">
          <button
            onClick={() => setSearchParams({ tab: "profile" })}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === "profile"
                ? "border-b-2 border-[var(--primary)] text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Edit Profile
          </button>
          <button
            onClick={() => setSearchParams({ tab: "password" })}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === "password"
                ? "border-b-2 border-[var(--primary)] text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Change Password
          </button>
        </div>

        {activeTab === "profile" ? <EditProfileForm /> : <ChangePasswordForm />}
      </motion.div>
    </div>
  );
}
```

---

## Task 6: Frontend — Route + Navigation

### File: `client/src/AppRoutes.jsx`

**Thêm import:**
```jsx
import { ProfilePage } from "./pages/profile/ProfilePage";
```

**Thêm route** (sau route `/payment`, trước `/dashboard`):
```jsx
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  }
/>
```

### File: `client/src/components/Navigation.tsx`

**Thêm icon** vào import từ `lucide-react`:
```tsx
UserCircle,
```

**Thêm link "My Profile"** vào dropdown user menu (giữa header email và Log out button):
```tsx
<Link
  to="/profile"
  onClick={() => setUserMenuOpen(false)}
  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--accent)] transition-colors"
>
  <UserCircle className="w-4 h-4" />
  My Profile
</Link>
```

---

## Kiểm tra tổng thể

| # | Test case | Expected |
|---|---|---|
| 1 | Click avatar → dropdown có "My Profile" | Hiển thị link |
| 2 | Click "My Profile" → vào `/profile?tab=profile` | Hiển thị form Edit Profile |
| 3 | Edit Profile load đúng dữ liệu từ API | Pre-fill form |
| 4 | Sửa fullName → Save → reload | Dữ liệu đã cập nhật |
| 5 | Switch tab "Change Password" | Hiển thị form đổi mật khẩu |
| 6 | Nhập sai current password | 400 "Current password is incorrect" |
| 7 | Đổi mật khẩu thành công | 200 + success message |
| 8 | Vào `/profile` không có token | Redirect `/login` |

---

## Tổng quan files

| # | File | Action |
|---|---|---|
| 1 | `services/auth-service/src/modules/auth/auth.scheme.ts` | ✏️ Thêm schema |
| 2 | `services/auth-service/src/modules/auth/auth.service.ts` | ✏️ Thêm method |
| 3 | `services/auth-service/src/modules/auth/auth.controller.ts` | ✏️ Thêm handler |
| 4 | `services/auth-service/src/modules/auth/auth.route.ts` | ✏️ Thêm route |
| 5 | `client/src/services/userService.ts` | 🆕 Mới |
| 6 | `client/src/pages/profile/EditProfileForm.tsx` | 🆕 Mới |
| 7 | `client/src/pages/profile/ChangePasswordForm.tsx` | 🆕 Mới |
| 8 | `client/src/pages/profile/ProfilePage.tsx` | 🆕 Mới |
| 9 | `client/src/AppRoutes.jsx` | ✏️ Thêm route |
| 10 | `client/src/components/Navigation.tsx` | ✏️ Thêm link |
