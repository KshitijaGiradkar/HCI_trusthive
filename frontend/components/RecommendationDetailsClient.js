"use client";

import { useMemo, useRef, useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppAuth } from "@/hooks/use-app-auth";
import { apiJson } from "@/lib/api";

function Stars({ value, outOf = 5, interactive = false, onChange }) {
  const v = Math.max(0, Math.min(outOf, Number(value) || 0));
  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: outOf }).map((_, i) => {
        const filled = i < v;
        const next = i + 1;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={interactive ? () => onChange?.(next) : undefined}
            className={[
              "rounded-md p-0.5",
              interactive ? "cursor-pointer" : "cursor-default",
              filled
                // ? "text-zinc-900 dark:text-zinc-50"
                ? "text-amber-500"
                : "text-zinc-300 dark:text-zinc-700",
              interactive
                ? "hover:text-zinc-600 dark:hover:text-zinc-200"
                : "",
            ].join(" ")}
            aria-label={`${next} star`}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 transition-transform active:scale-110">
              <path
                d="M10 1.8 12.6 7l5.7.8-4.1 4 1 5.7L10 14.8 4.8 17.5l1-5.7-4.1-4L7.4 7 10 1.8Z"
                fill={filled ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

function DisplayStars({ value, outOf = 5 }) {
  const v = Math.max(0, Math.min(outOf, Number(value) || 0));
  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: outOf }).map((_, i) => {
        const fillPct = Math.max(0, Math.min(1, v - i));
        return (
          <span key={i} className="relative inline-block h-4 w-4 text-zinc-300 dark:text-zinc-700">
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
              <path d="M10 1.8 12.6 7l5.7.8-4.1 4 1 5.7L10 14.8 4.8 17.5l1-5.7-4.1-4L7.4 7 10 1.8Z" fill="currentColor" />
            </svg>
            <span className="absolute inset-0 overflow-hidden text-amber-500" style={{ width: `${fillPct * 100}%` }}>
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
                <path d="M10 1.8 12.6 7l5.7.8-4.1 4 1 5.7L10 14.8 4.8 17.5l1-5.7-4.1-4L7.4 7 10 1.8Z" fill="currentColor" />
              </svg>
            </span>
          </span>
        );
      })}
    </div>
  );
}

function CategoryBadge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-900 ring-1 ring-zinc-200 dark:bg-zinc-900/30 dark:text-zinc-100 dark:ring-zinc-700">
      {children}
    </span>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        {value}
      </div>
    </div>
  );
}

function RatingRow({ label, value, outOf = 5 }) {
  const pct = Math.max(0, Math.min(100, (value / outOf) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <div className="h-2.5 flex-1 rounded-full bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="h-2.5 rounded-full bg-zinc-900 dark:bg-zinc-50" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right text-sm font-semibold text-zinc-950 dark:text-zinc-50">{value}/{outOf}</span>
    </div>
  );
}

export default function RecommendationDetailsClient({ rec }) {
  const { user, userId, token } = useAppAuth();
  const router = useRouter();

  const [avgRatings, setAvgRatings] = useState({
    price: Number(rec.ratings.Price) || 0,
    quality: Number(rec.ratings.Quality) || 0,
    safety: Number(rec.ratings.Safety) || 0,
  });
  const [priceStars, setPriceStars] = useState(0);
  const [qualityStars, setQualityStars] = useState(0);
  const [safetyStars, setSafetyStars] = useState(0);

  const [comments, setComments] = useState(rec.comments);
  const [commentText, setCommentText] = useState("");
  const [pendingComment, setPendingComment] = useState(false);
  const [pendingRating, setPendingRating] = useState(false);
  const [pendingPost, setPendingPost] = useState(false);
  const [error, setError] = useState("");
  const [ratingId, setRatingId] = useState(null);
  const [ratingCount, setRatingCount] = useState(rec.overallRatingCount ?? 0);
  const [recTitle, setRecTitle] = useState(rec.title);
  const [recDescription, setRecDescription] = useState(rec.description);
  const [recLocation, setRecLocation] = useState(rec.location || "");
  const [recBestTime, setRecBestTime] = useState(rec.bestTime || "");
  const [recSafety, setRecSafety] = useState(rec.safetyInfo || "");
  const [editingPost, setEditingPost] = useState(false);
  const titleInputRef = useRef(null);
  const [commentEditId, setCommentEditId] = useState(null);
  const [commentEditText, setCommentEditText] = useState("");

  async function syncRecommendation() {
    try {
      const json = await apiJson(`/api/v1/recommendations/${rec.recommendationId}`, {
        token,
      });
      const latest = json?.recommendation;
      if (!latest) return;
      setRecTitle(latest.title ?? "");
      setRecDescription(latest.description ?? "");
      setRecLocation(latest.location ?? "");
      setRecBestTime(latest.best_time_to_visit ?? "");
      setRecSafety(latest.safety_description ?? "");

      const ratings = Array.isArray(latest.ratings) ? latest.ratings : [];
      const commentsList = Array.isArray(latest.comments) ? latest.comments : [];
      const count = ratings.length;

      const avg = ratings.reduce(
        (acc, r) => {
          acc.price += Number(r.price_rating) || 0;
          acc.quality += Number(r.quality_rating) || 0;
          acc.safety += Number(r.safety_rating) || 0;
          return acc;
        },
        { price: 0, quality: 0, safety: 0 }
      );

      const avgPrice = count > 0 ? avg.price / count : 0;
      const avgQuality = count > 0 ? avg.quality / count : 0;
      const avgSafety = count > 0 ? avg.safety / count : 0;
      setAvgRatings({
        price: Math.round(avgPrice * 10) / 10,
        quality: Math.round(avgQuality * 10) / 10,
        safety: Math.round(avgSafety * 10) / 10,
      });

      setRatingCount(count);
      setComments(
        commentsList.map((c) => ({
          id: c.comment_id,
          userId: c.user_id,
          name: c.author_name ?? "Anonymous",
          date: c.created_at ? new Date(c.created_at).toISOString().slice(0, 10) : "",
          text: c.comment_text,
        }))
      );
      const myRating = ratings.find((r) => r.user_id === userId);
      setRatingId(myRating?.rating_id ?? null);
      if (myRating) {
        setPriceStars(Number(myRating.price_rating) || 0);
        setQualityStars(Number(myRating.quality_rating) || 0);
        setSafetyStars(Number(myRating.safety_rating) || 0);
      } else {
        setPriceStars(0);
        setQualityStars(0);
        setSafetyStars(0);
      }
    } catch {
      // keep currently rendered data on sync failure
    }
  }

  useEffect(() => {
    if (!token) return;
    syncRecommendation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, rec.recommendationId, userId]);

  useEffect(() => {
    if (editingPost && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [editingPost]);

  const overall = useMemo(() => {
    const avg =
      (Number(avgRatings.price) + Number(avgRatings.quality) + Number(avgRatings.safety)) / 3;
    return Math.round(avg * 10) / 10;
  }, [avgRatings]);

  const overallRatingCount = Number(ratingCount ?? 0) || 0;
  const canEditPost = Boolean(userId && rec.createdBy === userId);

  function formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  async function submitComment(e) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || !token || pendingComment) return;

    setPendingComment(true);
    setError("");
    try {
      await apiJson(`/api/v1/recommendations/${rec.recommendationId}/comments`, {
        method: "POST",
        token,
        body: JSON.stringify({ comment_text: text, is_anonymous: false }),
      });
      const now = new Date();
      const next = {
        id: `${Date.now()}`,
        name: user?.name ?? "You",
        date: formatDate(now),
        text,
      };
      setComments((prev) => [next, ...prev]);
      setCommentText("");
      await syncRecommendation();
    } catch (err) {
      setError(err.message || "Could not post comment");
    } finally {
      setPendingComment(false);
    }
  }

  async function editComment(commentId) {
    if (!token || !commentEditText.trim()) return;
    try {
      await apiJson(`/api/v1/comments/${commentId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ comment_text: commentEditText.trim() }),
      });
      setCommentEditId(null);
      setCommentEditText("");
      await syncRecommendation();
    } catch (err) {
      setError(err.message || "Could not edit comment");
    }
  }

  async function deleteComment(commentId) {
    if (!token) return;
    try {
      await apiJson(`/api/v1/comments/${commentId}`, { method: "DELETE", token });
      await syncRecommendation();
    } catch (err) {
      setError(err.message || "Could not delete comment");
    }
  }

  async function submitRating(e) {
    e.preventDefault();
    if (!token || pendingRating) return;
    setPendingRating(true);
    setError("");
    try {
      const body = {
        price_rating: Number(priceStars),
        quality_rating: Number(qualityStars),
        safety_rating: Number(safetyStars),
      };
      if (ratingId) {
        await apiJson(`/api/v1/ratings/${ratingId}`, {
          method: "PATCH",
          token,
          body: JSON.stringify(body),
        });
      } else {
        const created = await apiJson(
          `/api/v1/recommendations/${rec.recommendationId}/ratings`,
          {
            method: "POST",
            token,
            body: JSON.stringify(body),
          }
        );
        setRatingId(created?.rating?.rating_id ?? null);
      }
      await syncRecommendation();
    } catch (err) {
      setError(err.message || "Could not submit rating");
    } finally {
      setPendingRating(false);
    }
  }

  async function savePostEdits() {
    if (!token || pendingPost) return;
    setPendingPost(true);
    try {
      await apiJson(`/api/v1/recommendations/${rec.recommendationId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          title: recTitle,
          description: recDescription,
          location: recLocation || null,
          best_time_to_visit: recBestTime || null,
          safety_description: recSafety || null,
        }),
      });
      await syncRecommendation();
      setEditingPost(false);
    } catch (err) {
      setError(err.message || "Could not update post");
    } finally {
      setPendingPost(false);
    }
  }

  async function deletePost() {
    if (!token || pendingPost) return;
    setPendingPost(true);
    try {
      await apiJson(`/api/v1/recommendations/${rec.recommendationId}`, {
        method: "DELETE",
        token,
      });
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err.message || "Could not delete post");
      setPendingPost(false);
    }
  }

  const titleParts = recTitle.split(" ");
  const firstWord = titleParts[0] || "";
  const restWords = titleParts.slice(1).join(" ");

  return (
    <div className="space-y-6">
      {/* 1. TOP NAVBAR ROW */}
      <div className="flex justify-between items-center mb-2">
        <button onClick={() => router.push("/")} className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <svg className="w-5 h-5 focus:outline-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>

        {canEditPost ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditingPost((v) => !v)}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 transition-all hover:-translate-y-0.5"
            >
              {editingPost ? "Cancel" : "Edit"}
            </button>
            {editingPost && (
              <button
                type="button"
                onClick={savePostEdits}
                disabled={pendingPost}
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-60"
              >
                Save
              </button>
            )}
            <button
              type="button"
              onClick={deletePost}
              disabled={pendingPost}
              className="rounded-full bg-red-50 text-red-600 border border-red-100 px-4 py-2 text-sm font-medium shadow-sm hover:bg-red-100 transition-all hover:-translate-y-0.5 disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>

      {/* 2. MAIN POST CARD */}
      <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 space-y-6">

        {/* 3. CATEGORY BADGE */}
        <div>
          <span className="inline-block rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            {rec.category}
          </span>
        </div>

        {/* 4. TITLE SECTION */}
        <div className="flex flex-col gap-2">
          {editingPost ? (
            <input
              ref={titleInputRef}
              value={recTitle}
              onChange={(e) => setRecTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-2xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              <span className="text-gray-900">{firstWord}</span>
              {restWords && (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 ml-2">
                  {restWords}
                </span>
              )}
            </h1>
          )}
          {rec.author?.name && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Posted by {rec.author.name}
            </div>
          )}
        </div>

        {/* 5. RATING ROW */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <DisplayStars value={overall} />
          <span className="font-semibold text-gray-900">{overall.toFixed(1)}</span>
          <span className="text-gray-400">•</span>
          <span>{overallRatingCount} reviews</span>
        </div>

        {/* 6. DESCRIPTION */}
        {editingPost ? (
          <textarea
            value={recDescription}
            onChange={(e) => setRecDescription(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        ) : (
          <p className="text-gray-500 text-sm italic leading-relaxed md:text-base">
            {recDescription}
          </p>
        )}

        {/* 8. MEDIA SECTION */}
        {Array.isArray(rec.imageUrls) && rec.imageUrls.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {rec.imageUrls.map((url, idx) => (
              <div key={`${url}-${idx}`} className="overflow-hidden rounded-2xl hover:-translate-y-1 transition-transform shadow-sm group">
                <img src={url} alt={`${recTitle} ${idx + 1}`} className="h-40 md:h-52 w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 flex flex-col items-center justify-center h-40 md:h-52 text-gray-400">
            <svg className="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-sm font-medium">Click to view photo</span>
          </div>
        )}

        {/* 7. INFO SECTION (Location, Price, Time) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Location: Full width logically or spans first */}
          <div className="col-span-1 md:col-span-2 bg-gray-50 rounded-xl p-4 flex items-center border border-gray-100 shadow-sm">
            <div className="bg-indigo-100 text-indigo-600 rounded-full p-2 mr-3 shrink-0"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
            <div className="flex-1 w-full">
              <span className="block text-xs uppercase tracking-wide text-gray-400 font-semibold mb-0.5">Location</span>
              {editingPost ? (
                <input value={recLocation} onChange={(e) => setRecLocation(e.target.value)} className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-indigo-500" />
              ) : (
                // <span className="text-sm font-semibold text-gray-900 block truncate">{recLocation || "Not specified"}</span>
                // <div className="text-sm font-semibold text-gray-900 overflow-x-auto whitespace-nowrap scrollbar-thin">
                //   {recLocation || "Not specified"}
                // </div>
                <span className="text-sm font-semibold text-gray-900 block break-words leading-relaxed">{recLocation || "Not specified"}</span>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex items-center border border-gray-100 shadow-sm">
            <div className="bg-green-100 text-green-600 rounded-full p-2 mr-3 shrink-0"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            <div>
              <span className="block text-xs uppercase tracking-wide text-gray-400 font-semibold mb-0.5">Price Range</span>
              <span className="text-sm font-semibold text-gray-900">{rec.priceRange}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex items-center border border-gray-100 shadow-sm">
            <div className="bg-orange-100 text-orange-600 rounded-full p-2 mr-3 shrink-0"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            <div className="flex-1 w-full flex-col">
              <span className="block text-xs uppercase tracking-wide text-gray-400 font-semibold mb-0.5">Best Time</span>
              {editingPost ? (
                <input value={recBestTime} onChange={(e) => setRecBestTime(e.target.value)} className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-indigo-500" />
              ) : (
                // <span className="text-sm font-semibold text-gray-900 block truncate">{recBestTime || "Not specified"}</span>
                // <div className="text-sm font-semibold text-gray-900 overflow-x-auto whitespace-nowrap scrollbar-thin">
                //   {recBestTime || "Not specified"}
                // </div>
                // <div className="flex-1 w-full overflow-hidden">
                //   <div className="text-sm font-semibold text-gray-900 overflow-x-auto whitespace-nowrap">
                //     {recBestTime || "Not specified"}
                //   </div>
                // </div>
                <span className="text-sm font-semibold text-gray-900 block break-words leading-relaxed">
                  {recBestTime || "Not specified"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 9. SAFETY INFO SECTION */}
        <div className="bg-gray-50 rounded-2xl p-4 md:p-5 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            Safety Info
          </h3>
          {editingPost ? (
            <textarea value={recSafety} onChange={(e) => setRecSafety(e.target.value)} rows={2} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500" />
          ) : (
            <p className="text-sm text-gray-500 leading-relaxed">{recSafety || "No safety notes provided."}</p>
          )}
        </div>
      </div>

      {/* 10. SECOND SECTION (STATS + RATINGS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 11. COMMUNITY STATS CARD */}
        <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100 hover:-translate-y-1 transition-transform duration-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Community Stats</h3>
          <div className="space-y-4">
            {[{ label: "Price", val: avgRatings.price }, { label: "Quality", val: avgRatings.quality }, { label: "Safety", val: avgRatings.safety }].map(stat => (
              <div key={stat.label} className="flex items-center gap-3">
                <span className="w-16 text-sm font-medium text-gray-600">{stat.label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden shrink-0 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, (stat.val / 5) * 100))}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-semibold text-gray-800">{stat.val}/5</span>
              </div>
            ))}
          </div>
        </div>

        {/* 12. USER RATING CARD */}
        <form onSubmit={submitRating} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-md p-5 flex flex-col hover:-translate-y-1 transition-transform duration-300 border border-indigo-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Your Ratings</h3>
          <div className="space-y-3 flex-1">
            <div className="flex justify-between items-center bg-white/60 p-2.5 rounded-xl backdrop-blur-sm border border-white/50">
              <span className="text-sm font-medium text-gray-700 ml-2">Price</span>
              <div className="group"><Stars value={priceStars} interactive onChange={setPriceStars} /></div>
            </div>
            <div className="flex justify-between items-center bg-white/60 p-2.5 rounded-xl backdrop-blur-sm border border-white/50">
              <span className="text-sm font-medium text-gray-700 ml-2">Quality</span>
              <div className="group"><Stars value={qualityStars} interactive onChange={setQualityStars} /></div>
            </div>
            <div className="flex justify-between items-center bg-white/60 p-2.5 rounded-xl backdrop-blur-sm border border-white/50">
              <span className="text-sm font-medium text-gray-700 ml-2">Safety</span>
              <div className="group"><Stars value={safetyStars} interactive onChange={setSafetyStars} /></div>
            </div>
          </div>
          <button type="submit" disabled={!token || pendingRating} className="mt-5 w-full rounded-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-sm font-medium text-white shadow-md hover:from-indigo-600 hover:to-purple-600 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 text-center flex justify-center items-center">
            {pendingRating ? <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> : "Post Rating"}
          </button>
        </form>
      </div>

      {/* 13. COMMENTS SECTION */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 space-y-6">
        {/* 14. HEADER */}
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
          Comments ({comments.length})
        </h3>

        {/* 15. COMMENT INPUT */}
        <form onSubmit={submitComment} className="flex gap-3 items-start">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share your experience..."
            rows={2}
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors resize-y min-h-[48px] shadow-sm"
          />
          {/* <button type="submit" disabled={!commentText.trim() || !token || pendingComment} className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100 mt-1">
            <svg className="w-5 h-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button> */}

          <button
            type="submit"
            disabled={!commentText.trim() || !token || pendingComment}
            className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100 mt-1"
          >
            <svg
              className="w-5 h-5 ml-0.5 rotate-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>

        {/* 16. COMMENT CARD array */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          {error && <div className="text-xs text-red-500 bg-red-50 p-2 rounded">{error}</div>}
          {comments.map((c) => (
            <div key={c.id ?? `${c.name}-${c.date}`} className="bg-gray-50 rounded-xl p-4 flex gap-4 hover:shadow-sm transition-shadow group border border-transparent hover:border-gray-100">
              <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-200 border-2 border-white shadow-sm flex items-center justify-center text-indigo-700 font-bold text-sm uppercase">
                {c.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-900 text-sm">{c.name}</span>
                  {/* removed the comment dates */}
                  {/* <span className="text-xs text-gray-400 font-medium">{c.date}</span> */}
                </div>
                {commentEditId === c.id ? (
                  <div className="mt-2">
                    <textarea value={commentEditText} onChange={(e) => setCommentEditText(e.target.value)} rows={2} className="w-full text-sm border border-indigo-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-inner" />
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => editComment(c.id)} className="text-xs font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-full hover:bg-indigo-700 transition">Save</button>
                      <button type="button" onClick={() => setCommentEditId(null)} className="text-xs font-medium text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-full transition">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{c.text}</p>
                )}
                {userId && c.userId === userId && commentEditId !== c.id ? (
                  <div className="mt-3 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => { setCommentEditId(c.id); setCommentEditText(c.text); }} className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors font-semibold uppercase tracking-wide">Edit</button>
                    <button type="button" onClick={() => deleteComment(c.id)} className="text-xs text-red-300 hover:text-red-600 transition-colors font-semibold uppercase tracking-wide">Delete</button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
              No comments yet. Be the first to share your thoughts!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

