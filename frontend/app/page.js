"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getApiBase } from "@/lib/config";
import { extractImageUrls } from "@/lib/recommendations";
import FilterRow from "@/components/FilterRow";

function IconLocation(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShield(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 3 20 7v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7l8-4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CategoryBadge({ category }) {
  return (
    <span
      className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-900 ring-1 ring-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
    >
      {category}
    </span>
  );
}

function SafetySegments({ rating, outOf = 5 }) {
  const safe = Math.max(0, Math.min(outOf, Number(rating) || 0));
  return (
    <div className="flex items-center gap-1" aria-label={`Safety rating: ${safe}/${outOf}`}>
      {Array.from({ length: outOf }).map((_, idx) => {
        const active = idx < safe;
        return (
          <span
            key={idx}
            className={[
              "h-2.5 w-3.5 rounded-sm ring-1",
              active
                ? "bg-zinc-900 ring-zinc-900 dark:bg-zinc-50 dark:ring-zinc-50"
                : "bg-zinc-100 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}

function Stars({ value, outOf = 5, size = "h-4 w-4", interactive = false, onChange }) {
  const v = Math.max(0, Math.min(outOf, Number(value) || 0));
  return (
    <div className="inline-flex items-center gap-1" role={interactive ? "radiogroup" : undefined}>
      {Array.from({ length: outOf }).map((_, i) => {
        const filled = i < v;
        const Star = (
          <svg viewBox="0 0 20 20" aria-hidden="true" className={size}>
            <path
              d="M10 1.8 12.6 7l5.7.8-4.1 4 1 5.7L10 14.8 4.8 17.5l1-5.7-4.1-4L7.4 7 10 1.8Z"
              fill={filled ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        );

        if (!interactive) {
          return (
            <span
              key={i}
              className={filled ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-300 dark:text-zinc-700"}
            >
              {Star}
            </span>
          );
        }

        const next = i + 1;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange?.(next)}
            className={[
              "rounded-md p-0.5 transition",
              filled ? "text-amber-500" : "text-zinc-300 hover:text-amber-400 dark:text-zinc-700 dark:hover:text-amber-400",
            ].join(" ")}
            aria-label={`${next} star`}
          >
            {Star}
          </button>
        );
      })}
    </div>
  );
}

function RecommendationCardModern({ rec }) {
  return (
    <Link href={rec.href} className="block group">
      <article className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 overflow-hidden h-full flex flex-col border border-zinc-200 dark:border-zinc-800">
        {rec.imageUrl ? (
          <div className="relative h-40 sm:h-48 overflow-hidden bg-gray-100 dark:bg-zinc-800 shrink-0 border-b border-gray-100 dark:border-zinc-800">
            <img
              src={rec.imageUrl}
              alt={rec.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute top-3 left-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur rounded-full px-3 py-1 text-xs font-medium text-gray-900 dark:text-zinc-100 shadow-sm">
              {rec.category}
            </div>
            {/* <div className="absolute top-3 right-3 text-xs font-medium text-white shadow-sm drop-shadow-md">
              {rec.date}
            </div> */}
          </div>
        ) : (
          <div className="relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-800 shrink-0 flex items-center justify-center border-b border-gray-100/50 dark:border-zinc-800">
            <span className="text-indigo-200 dark:text-zinc-600 font-medium">No Image</span>
            <div className="absolute top-3 left-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur rounded-full px-3 py-1 text-xs font-medium text-gray-900 dark:text-zinc-100 shadow-sm">
              {rec.category}
            </div>
            {/* <div className="absolute top-3 right-3 text-xs font-medium text-gray-500 dark:text-zinc-400">
              {rec.date}
            </div> */}
          </div>
        )}

        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 line-clamp-1">
            {rec.title}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400 line-clamp-2">
            {rec.description}
          </p>

          <div className="mt-auto pt-4 space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-zinc-400">
              <div className="flex items-center gap-1.5 line-clamp-1">
                <IconLocation className="h-4 w-4 shrink-0" />
                <span className="truncate">{rec.location || "N/A"}</span>
              </div>
              <span className="shrink-0 font-medium text-xs">{rec.priceRange}</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-50 dark:border-zinc-800">
              <div className="flex items-center gap-1.5">
                <Stars value={rec.overallStars} size="h-3.5 w-3.5" />
                <div className="flex items-baseline gap-1 text-xs">
                  <span className="font-semibold text-gray-900 dark:text-zinc-100">
                    {Number(rec.overallRating).toFixed(1)}
                  </span>
                  <span className="text-gray-500 dark:text-zinc-400">
                    ({rec.ratingCount})
                  </span>
                </div>
              </div>
              <div className="flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                Read more <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

const FILTER_OPTIONS = [
  "All",
  "Food",
  "Travel",
  "Hostel Services",
  "Study Spots",
  "Entertainment",
  "Shopping",
  "Health & Fitness",
  "Other",
];

const TYPE_TO_CATEGORY = {
  food: "Food",
  travel: "Travel",
  service: "Hostel Services",
  study_spot: "Study Spots",
  entertainment: "Entertainment",
  shopping: "Shopping",
  health_and_fitness: "Health & Fitness",
  other: "Other",
};

function typeToCategory(type) {
  return TYPE_TO_CATEGORY[type] ?? "Other";
}

function formatPriceRange(priceRange) {
  if (priceRange == null) return "Free";
  const tier = Number(priceRange);
  if (!Number.isFinite(tier) || tier <= 0) return "Free";
  if (tier <= 2) return "₹0–100";
  if (tier <= 4) return "₹100–500";
  return "₹500+";
}

function formatIsoDate(dateLike) {
  if (!dateLike) return "";
  try {
    return new Date(dateLike).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function computeOverallFromRatings(ratings) {
  const list = Array.isArray(ratings) ? ratings : [];
  const ratingCount = list.length;
  if (ratingCount === 0) {
    return { overallRating: 0, overallStars: 0, ratingCount: 0 };
  }

  const sum = list.reduce((acc, r) => {
    const p = Number(r.price_rating) || 0;
    const q = Number(r.quality_rating) || 0;
    const s = Number(r.safety_rating) || 0;
    return acc + (p + q + s) / 3;
  }, 0);

  const overallRating = Math.round((sum / ratingCount) * 10) / 10;
  const overallStars = Math.max(0, Math.min(5, Math.round(overallRating)));
  return { overallRating, overallStars, ratingCount };
}
function computeAverageMetric(ratings, key) {
  const list = Array.isArray(ratings) ? ratings : [];
  if (list.length === 0) return 0;
  const total = list.reduce((acc, r) => acc + (Number(r?.[key]) || 0), 0);
  return Math.round((total / list.length) * 10) / 10;
}

function checkQuality(r, level) {
  const l = level.toLowerCase();
  if (level === "all") return true;
  if (level === "high") return r.avgQuality >= 4;
  if (level === "moderate") return r.avgQuality >= 3;
  if (level === "low") return r.avgQuality >= 1;
  return true;
}

function checkSafety(r, level) {
  const l = level.toLowerCase();
  if (level === "all") return true;
  if (level === "high") return r.avgSafety >= 4;
  if (level === "moderate") return r.avgSafety >= 3;
  if (level === "low") return r.avgSafety >= 1;
  return true;
}

function checkPrice(r, level) {
  const l = level.toLowerCase();
  if (level === "all") return true;
  if (level === "high") return r.avgPrice >= 4;
  if (level === "moderate") return r.avgPrice >= 3;
  if (level === "low") return r.avgPrice >= 1;
  return true;
}

export default function Home() {
  const [category, setCategory] = useState("All");
  const [searchDraft, setSearchDraft] = useState("");
  const [priceLevel, setPriceLevel] = useState("all");
  const [qualityLevel, setQualityLevel] = useState("all");
  const [safetyLevel, setSafetyLevel] = useState("all");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const base = getApiBase();

        const res = await fetch(
          `${base}/api/v1/recommendations?limit=50`
        );

        const json = await res.json();

        const recommendations = Array.isArray(json?.data)
          ? json.data
          : [];

        const detailResults = await Promise.allSettled(
          recommendations.map(async (t) => {
            const id = t.recommendation_id;

            const res = await fetch(
              `${base}/api/v1/recommendations/${id}`
            );

            const json = await res.json();

            return json?.recommendation ?? null;
          })
        );

        const mapped = detailResults
          .filter((r) => r.status === "fulfilled" && r.value)
          .map((r) => {
            const rec = r.value;

            const categoryLabel = typeToCategory(rec.type);

            const { overallRating, overallStars, ratingCount } =
              computeOverallFromRatings(rec.ratings);

            const avgPrice = computeAverageMetric(rec.ratings, "price_rating");
            const avgQuality = computeAverageMetric(rec.ratings, "quality_rating");
            const avgSafety = computeAverageMetric(rec.ratings, "safety_rating");

            const rawPriceTier = Number(rec.price_range);

            const priceTier =
              Number.isFinite(rawPriceTier) && rawPriceTier > 0
                ? rawPriceTier
                : 1;

            return {
              recommendationId: rec.recommendation_id,
              //category: categoryLabel === "Other" ? "All" : categoryLabel,
              category: categoryLabel,
              title: rec.title,
              description: rec.description,
              priceRange: formatPriceRange(rec.price_range),
              priceTier,
              avgPrice,
              avgQuality,
              avgSafety,
              location: rec.location ?? "",
              overallRating,
              overallStars,
              ratingCount,
              date: formatIsoDate(rec.created_at),
              imageUrl: extractImageUrls(rec)[0] ?? null,
              href: `/recommendations/${rec.recommendation_id}`,
            };
          });

        setCards(mapped);
      } catch (e) {
        setError(e?.message ?? "Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    const shouldShow = searchDraft.trim() !== "" || category !== "All";
    setIsFilterVisible(shouldShow);
    if (!shouldShow) {
      setPriceLevel("all");
      setQualityLevel("all");
      setSafetyLevel("all");
    }
  }, [searchDraft, category]);

  const visible = useMemo(() => {
    const q = searchDraft.trim().toLowerCase();

    const filtered = cards.filter((r) => {
      const matchesCategory = category === "All" ? true : r.category === category;
      const matchesSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q);
      const matchesPrice = checkPrice(r, priceLevel);
      const matchesQuality = checkQuality(r, qualityLevel);
      const matchesSafety = checkSafety(r, safetyLevel);
      return (
        matchesCategory &&
        matchesSearch &&
        matchesPrice &&
        matchesQuality &&
        matchesSafety
      );
    });
    function sortByActiveFilter(list) {
      if (qualityLevel !== "all") {
        return [...list].sort((a, b) => b.avgQuality - a.avgQuality);
      }
      if (safetyLevel !== "all") {
        return [...list].sort((a, b) => b.avgSafety - a.avgSafety);
      }
      if (priceLevel !== "all") {
        return [...list].sort((a, b) => b.avgPrice - a.avgPrice);
      }
      return list;
    }
    return sortByActiveFilter(filtered);
  }, [cards, category, searchDraft, priceLevel, qualityLevel, safetyLevel]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 min-h-screen">
      {/* HERO SECTION */}
      <section className="rounded-3xl bg-gradient-to-r from-purple-100 via-indigo-100 to-pink-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 p-10 sm:p-16 shadow-lg shadow-indigo-100/50 dark:shadow-none mb-12 relative overflow-hidden">
        {/* subtle glow effect via an absolute div */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/40 dark:bg-white/5 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-white/60 dark:bg-zinc-800/60 backdrop-blur px-4 py-1.5 text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-6 shadow-sm">
            ✨ Community Powered
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            Campus Community<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              Recommendations
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-zinc-400 max-w-2xl mx-auto mb-8">
            Discover trusted picks from your campus — curated by the community for the community.
          </p>

          <div className="w-full max-w-xl relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 dark:text-zinc-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="search"
              placeholder="Search recommendations..."
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              className="w-full rounded-full border-0 bg-white dark:bg-zinc-900 shadow-md pl-12 pr-6 py-4 text-base text-gray-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow transition-colors placeholder:text-gray-400 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>
      </section>

      {/* DISCOVERY FEED & FILTERS */}
      <section className="mb-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Discovery Feed</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
              {FILTER_OPTIONS.map((opt) => {
                const active = opt === category;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setCategory(opt)}
                    className={[
                      "shrink-0 rounded-full px-5 py-2 text-xs sm:text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-indigo-600 text-white shadow-md hover:scale-105 dark:bg-indigo-500"
                        : "bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:scale-105 hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400",
                    ].join(" ")}
                    aria-pressed={active}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
          {isFilterVisible ? (
            <FilterRow
              priceLevel={priceLevel}
              qualityLevel={qualityLevel}
              safetyLevel={safetyLevel}
              onPriceChange={setPriceLevel}
              onQualityChange={setQualityLevel}
              onSafetyChange={setSafetyLevel}
            />
          ) : null}
        </div>
      </section>

      {/* POSTS GRID */}
      <section className="mb-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-2xl bg-gray-200 dark:bg-zinc-800"
              />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-950/50 p-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : visible.length === 0 ? (
          <div className="py-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <p className="text-gray-500 dark:text-zinc-400">No recommendations match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((rec) => (
              <RecommendationCardModern
                key={rec.recommendationId}
                rec={rec}
              />
            ))}
          </div>
        )}
      </section>

      {/* CTA SECTION */}
      <section className="rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl shadow-indigo-200/50 dark:shadow-none">
        <div className="flex items-center gap-4 text-white text-center md:text-left">
          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0 backdrop-blur hidden sm:flex">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Share your campus secrets</h3>
            <p className="mt-1 text-indigo-100 text-sm">Help others discover the best spots around campus.</p>
          </div>
        </div>
        <Link
          href="/recommendations/new"
          className="shrink-0 bg-white text-indigo-600 font-semibold rounded-full px-8 py-3 shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300"
        >
          Share Your Pick
        </Link>
      </section>
    </main>
  );
}
