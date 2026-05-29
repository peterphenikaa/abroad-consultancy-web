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
