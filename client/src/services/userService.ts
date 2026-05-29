import type { MeResponse, UpdateProfileData } from "@/types/user";
import apiClient from "./apiClient";

export const getMyProfile = async (): Promise<MeResponse> => {
  const res = await apiClient.get<{ success: boolean; data: MeResponse }>(
    "/users/me",
  );
  return res.data.data;
};

export const updateMyProfile = async (
  data: UpdateProfileData,
): Promise<MeResponse> => {
  const res = await apiClient.put<{ success: boolean; data: MeResponse }>(
    "/users/me",
    data,
  );
  return res.data.data;
};
