import type { SearchHit, UniversityResult } from "../types/search";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1762913475977-6a865fde924d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  "https://images.unsplash.com/photo-1763811938846-0de457436794?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  "https://images.unsplash.com/photo-1772692678600-2822edc0b95f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
];

export function mapSearchHitToResult(hit: SearchHit, index: number): UniversityResult {
  const { data, score } = hit;
  const isVisa = data.type === "visa";
  const contentSnippet = data.content?.trim();

  const highlights: string[] = [];
  if (contentSnippet) {
    highlights.push(
      contentSnippet.length > 100 ? `${contentSnippet.slice(0, 100)}…` : contentSnippet,
    );
  }
  if (data.url) {
    highlights.push("Source link available");
  }

  const matchPercent =
    score != null && score > 0
      ? Math.min(99, Math.max(50, Math.round(score * 8)))
      : 75;

  return {
    id: data.url || `${data.type}-${index}-${data.title}`,
    name: data.title,
    location: data.location?.trim() || "Location not specified",
    program: isVisa ? "Visa / Immigration" : "University program",
    tuition: "See official source",
    duration: "—",
    ranking: index + 1,
    match: matchPercent,
    acceptance: "—",
    startDate: "—",
    image: FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
    highlights: highlights.length > 0 ? highlights : ["No description available"],
    url: data.url,
    type: data.type,
  };
}

export function filterResults(
  items: UniversityResult[],
  options: {
    countries: string[];
    fields: string[];
    types: ("university" | "visa")[];
  },
): UniversityResult[] {
  return items.filter((item) => {
    if (options.types.length > 0 && !options.types.includes(item.type as "university" | "visa")) {
      return false;
    }
    if (options.countries.length > 0) {
      const loc = item.location.toLowerCase();
      if (!options.countries.some((c) => loc.includes(c.toLowerCase()))) {
        return false;
      }
    }
    if (options.fields.length > 0) {
      const haystack = `${item.name} ${item.program} ${item.highlights.join(" ")}`.toLowerCase();
      if (!options.fields.some((f) => haystack.includes(f.toLowerCase()))) {
        return false;
      }
    }
    return true;
  });
}
