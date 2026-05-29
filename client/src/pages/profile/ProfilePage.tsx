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
        className="bg-white rounded-2xl border border-(--border) shadow-sm p-8"
      >
        <h1 className="text-3xl sm:text-4xl font-(--font-serif) text-(--foreground) mb-8">
          My Profile
        </h1>

        <div className="flex gap-6 border-b border-(--border) mb-8">
          <button
            onClick={() => setSearchParams({ tab: "profile" })}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === "profile"
                ? "border-b-2 border-(--primary) text-(--foreground)"
                : "text-(--muted-foreground) hover:text-(--foreground)"
            }`}
          >
            Edit Profile
          </button>
          <button
            onClick={() => setSearchParams({ tab: "password" })}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === "password"
                ? "border-b-2 border-(--primary) text-(--foreground)"
                : "text-(--muted-foreground) hover:text-(--foreground)"
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
