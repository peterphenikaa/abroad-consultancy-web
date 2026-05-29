import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { Button, Input } from "@/components/ui";
import apiClient from "@/services/apiClient";

export function ChangePasswordForm() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
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
      const detail =
        err?.response?.data?.error?.detail || "Failed to change password.";
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div>
        <label className="block text-sm font-medium text-(--foreground) mb-1.5">
          Current Password
        </label>
        <Input
          type={showPasswords ? "text" : "password"}
          value={form.currentPassword}
          onChange={(e) =>
            setForm({ ...form, currentPassword: e.target.value })
          }
          required
          placeholder="Enter current password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-(--foreground) mb-1.5">
          New Password
        </label>
        <Input
          type={showPasswords ? "text" : "password"}
          value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          required
          placeholder="Enter new password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-(--foreground) mb-1.5">
          Confirm New Password
        </label>
        <Input
          type={showPasswords ? "text" : "password"}
          value={form.confirmPassword}
          onChange={(e) =>
            setForm({ ...form, confirmPassword: e.target.value })
          }
          required
          placeholder="Confirm new password"
        />
      </div>

      <button
        type="button"
        onClick={() => setShowPasswords(!showPasswords)}
        className="text-sm text-(--muted-foreground) flex items-center gap-1.5 hover:text-(--foreground) transition-colors"
      >
        {showPasswords ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
        {showPasswords ? "Hide" : "Show"} passwords
      </button>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Password changed successfully!
        </p>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Lock className="w-4 h-4 mr-2" />
        )}
        Change Password
      </Button>
    </form>
  );
}
