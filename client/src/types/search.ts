export interface SearchHitData {
  type: string;
  title: string;
  location?: string | null;
  content?: string;
  url?: string;
  countryId?: number;
}

export interface SearchHit {
  score: number | null;
  data: SearchHitData;
}

export interface SearchResponse {
  results: SearchHit[];
  total: number;
}

export interface UniversityResult {
  id: string;
  name: string;
  location: string;
  program: string;
  tuition: string;
  duration: string;
  ranking: number;
  match: number;
  acceptance: string;
  startDate: string;
  image: string;
  highlights: string[];
  url?: string;
  type: string;
}
