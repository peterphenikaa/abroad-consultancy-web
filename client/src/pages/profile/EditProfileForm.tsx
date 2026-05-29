import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { getMyProfile, updateMyProfile } from "@/services/userService";
import type { UpdateProfileData } from "@/types/user";

export function EditProfileForm() {
  const queryClient = useQueryClient();
  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
  });

  const [form, setForm] = useState<UpdateProfileData>({});

  useEffect(() => {
    if (profile) {
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-(--muted-foreground)" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-red-500 py-4">
        Failed to load profile. Please try again.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-(--foreground) mb-1.5">
          Full Name
        </label>
        <Input
          value={form.fullName || ""}
          onChange={(e) => handleChange("fullName", e.target.value)}
          maxLength={255}
          placeholder="Enter your full name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-(--foreground) mb-1.5">
          Phone
        </label>
        <Input
          value={form.phone || ""}
          onChange={(e) => handleChange("phone", e.target.value)}
          maxLength={20}
          placeholder="Enter your phone number"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-(--foreground) mb-1.5">
          Educational Level
        </label>
        <select
          value={form.educationalLevel || ""}
          onChange={(e) => handleChange("educationalLevel", e.target.value)}
          className="w-full rounded-lg border border-(--border) bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-amber)"
        >
          <option value="">Select your level...</option>
          <option value="High School">High School</option>
          <option value="Bachelor">Bachelor</option>
          <option value="Master">Master</option>
          <option value="PhD">PhD</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-(--foreground) mb-1.5">
          Bio
        </label>
        <textarea
          value={form.bio || ""}
          onChange={(e) => handleChange("bio", e.target.value)}
          rows={3}
          placeholder="Tell us about yourself..."
          className="w-full rounded-lg border border-(--border) bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-amber) resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-(--foreground) mb-1.5">
          Learning Goals
        </label>
        <textarea
          value={form.learningGoals || ""}
          onChange={(e) => handleChange("learningGoals", e.target.value)}
          rows={3}
          placeholder="What are your learning objectives?"
          className="w-full rounded-lg border border-(--border) bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-amber) resize-none"
        />
      </div>

      {mutation.isError && (
        <p className="text-red-500 text-sm">
          Failed to update profile. Please try again.
        </p>
      )}
      {mutation.isSuccess && (
        <p className="text-green-600 text-sm">Profile updated successfully!</p>
      )}

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Save Changes
      </Button>
    </form>
  );
}
