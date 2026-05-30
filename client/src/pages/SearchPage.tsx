import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  MapPin,
  GraduationCap,
  DollarSign,
  Calendar,
  TrendingUp,
  Star,
  ExternalLink,
  BookmarkPlus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { AspectRatio } from "../components/ui/aspect-ratio";
import { Badge } from "../components/ui/badge";
import { searchStudyAbroad } from "../services/searchService";
import { filterResults, mapSearchHitToResult } from "../lib/searchMappers";
import type { UniversityResult } from "../types/search";
import { isAxiosError } from "axios";

const filters = {
  countries: ["USA", "Canada", "UK", "Germany", "Australia", "Netherlands"],
  programLevels: ["Bachelor", "Master", "PhD", "Certificate"],
  fields: ["Computer Science", "Engineering", "Business", "Medicine", "Arts", "Law"],
  tuitionRange: ["< $20k", "$20k - $40k", "$40k - $60k", "> $60k"],
};

type ResultTypeFilter = "university" | "visa";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [showUniversities, setShowUniversities] = useState(true);
  const [showVisa, setShowVisa] = useState(true);
  const [rawResults, setRawResults] = useState<UniversityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(searchQuery.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const runSearch = useCallback(async (q: string) => {
    if (!q) {
      setRawResults([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await searchStudyAbroad(q);
      setRawResults(response.results.map(mapSearchHitToResult));
    } catch (err) {
      setRawResults([]);
      if (isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        const msg =
          typeof detail === "string"
            ? detail
            : err.response?.status === 401
              ? "Please log in to search."
              : err.message;
        setError(msg || "Search failed. Please try again.");
      } else {
        setError(err instanceof Error ? err.message : "Search failed.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      void runSearch(debouncedQuery);
    } else if (debouncedQuery.length === 0) {
      setRawResults([]);
      setHasSearched(false);
      setError(null);
    }
  }, [debouncedQuery, runSearch]);

  const typeFilters = useMemo((): ResultTypeFilter[] => {
    const types: ResultTypeFilter[] = [];
    if (showUniversities) types.push("university");
    if (showVisa) types.push("visa");
    return types;
  }, [showUniversities, showVisa]);

  const results = useMemo(
    () =>
      filterResults(rawResults, {
        countries: selectedCountries,
        fields: selectedFields,
        types: typeFilters,
      }),
    [rawResults, selectedCountries, selectedFields, typeFilters],
  );

  const toggleCountry = (country: string) => {
    setSelectedCountries((prev) =>
      prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country],
    );
  };

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runSearch(searchQuery.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--background)] to-[var(--secondary)] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-[var(--font-serif)] text-[var(--primary)] mb-3">
              Find Your Perfect University
            </h1>
            <p className="text-lg text-[var(--muted-foreground)]">
              Search universities and visa information powered by CAM EDU search API
            </p>
          </div>

          <form className="max-w-4xl mx-auto" onSubmit={handleSubmit}>
            <div className="relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by university, program, location, visa, or keywords..."
                className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white border-2 border-transparent focus:border-[var(--accent-amber)] focus:outline-none shadow-[var(--shadow-lg)] transition-all text-lg"
              />
            </div>

            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <Button
                type="button"
                variant={showFilters ? "gradient" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
                <span className="font-medium">Filters</span>
              </Button>

              <Button type="submit" variant="gradient" disabled={loading || !searchQuery.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </Button>
            </div>
          </form>
        </motion.div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-white rounded-2xl p-6 shadow-[var(--shadow-md)] border border-[var(--border)]">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] mb-3">Result type</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showUniversities}
                          onChange={(e) => setShowUniversities(e.target.checked)}
                          className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent-amber)] focus:ring-[var(--accent-amber)]"
                        />
                        <span className="text-sm text-[var(--foreground)]">Universities</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showVisa}
                          onChange={(e) => setShowVisa(e.target.checked)}
                          className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent-amber)] focus:ring-[var(--accent-amber)]"
                        />
                        <span className="text-sm text-[var(--foreground)]">Visa</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] mb-3">Countries</h3>
                    <div className="space-y-2">
                      {filters.countries.map((country) => (
                        <label key={country} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCountries.includes(country)}
                            onChange={() => toggleCountry(country)}
                            className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent-amber)] focus:ring-[var(--accent-amber)]"
                          />
                          <span className="text-sm text-[var(--foreground)]">{country}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] mb-3">Field of Study</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {filters.fields.map((field) => (
                        <label key={field} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFields.includes(field)}
                            onChange={() => toggleField(field)}
                            className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent-amber)] focus:ring-[var(--accent-amber)]"
                          />
                          <span className="text-sm text-[var(--foreground)]">{field}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="text-[var(--muted-foreground)]">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Searching…
              </span>
            ) : hasSearched ? (
              <>
                Found{" "}
                <span className="font-semibold text-[var(--foreground)]">{results.length}</span> results
                {rawResults.length !== results.length && (
                  <span className="text-sm"> (of {rawResults.length} from API)</span>
                )}
              </>
            ) : (
              "Enter at least 2 characters to search"
            )}
          </div>
        </div>

        {!loading && hasSearched && results.length === 0 && !error && (
          <div className="text-center py-16 text-[var(--muted-foreground)]">
            <p className="text-lg">No results found for &quot;{debouncedQuery}&quot;</p>
            <p className="text-sm mt-2">Try different keywords or adjust filters.</p>
          </div>
        )}

        <div className="space-y-6">
          {results.map((university, index) => (
            <motion.div
              key={university.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl overflow-hidden shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-xl)] transition-all border border-[var(--border)] hover:border-[var(--accent-amber)]/20 group"
            >
              <div className="grid md:grid-cols-[300px_1fr] gap-6">
                <div className="relative overflow-hidden">
                  <AspectRatio ratio={3 / 4} className="bg-[var(--secondary)]">
                    <img
                      src={university.image}
                      alt={university.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </AspectRatio>
                  <Badge className="absolute top-4 left-4 rounded-full bg-gradient-to-r from-[var(--accent-amber)] to-[var(--accent-coral)] text-white border-transparent text-sm">
                    <TrendingUp className="w-4 h-4" />
                    {university.match}% Match
                  </Badge>
                  <Badge className="absolute top-14 left-4 rounded-full bg-white/90 text-[var(--foreground)] border-transparent text-xs capitalize">
                    {university.type}
                  </Badge>
                  <div className="absolute top-4 right-4">
                    <Button
                      type="button"
                      size="icon"
                      className="rounded-full bg-white/90 backdrop-blur-sm hover:bg-white"
                    >
                      <BookmarkPlus className="w-5 h-5 text-[var(--foreground)]" />
                    </Button>
                  </div>
                </div>

                <div className="p-6 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-2xl font-semibold text-[var(--foreground)]">
                          {university.name}
                        </h3>
                        {university.type === "university" && (
                          <Badge className="rounded-full bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] border-transparent">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm font-medium">#{university.ranking}</span>
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[var(--muted-foreground)] mb-3">
                        <MapPin className="w-4 h-4" />
                        <span>{university.location}</span>
                      </div>
                      <div className="inline-block px-3 py-1 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] font-medium mb-4">
                        {university.program}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {university.highlights.map((highlight, i) => (
                      <Badge
                        key={i}
                        className="rounded-full bg-gradient-to-r from-[var(--accent-violet)]/10 to-[var(--accent-amber)]/10 border-transparent text-sm"
                      >
                        {highlight}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-1 text-[var(--muted-foreground)] text-sm mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span>Tuition</span>
                      </div>
                      <div className="font-semibold text-[var(--foreground)]">{university.tuition}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-[var(--muted-foreground)] text-sm mb-1">
                        <Calendar className="w-4 h-4" />
                        <span>Duration</span>
                      </div>
                      <div className="font-semibold text-[var(--foreground)]">{university.duration}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-[var(--muted-foreground)] text-sm mb-1">
                        <GraduationCap className="w-4 h-4" />
                        <span>Type</span>
                      </div>
                      <div className="font-semibold text-[var(--foreground)] capitalize">
                        {university.type}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-auto">
                    {university.url ? (
                      <Button variant="gradient" className="flex-1" asChild>
                        <a href={university.url} target="_blank" rel="noopener noreferrer">
                          View Source
                        </a>
                      </Button>
                    ) : (
                      <Button variant="gradient" className="flex-1" disabled>
                        View Details
                      </Button>
                    )}
                    {university.url && (
                      <Button variant="secondary" asChild>
                        <a href={university.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                          Website
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
