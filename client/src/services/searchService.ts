import apiClient from "./apiClient";
import type { SearchResponse } from "../types/search";

/** GET /api/search?q= — routed via Kong → search-service-fastAPI */
export async function searchStudyAbroad(q: string): Promise<SearchResponse> {
  const { data } = await apiClient.get<SearchResponse>("/search", {
    params: { q: q.trim() },
  });
  return data;
}
