"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppAuth } from "@/hooks/use-app-auth";
import { apiJson } from "@/lib/api";
import { typeLabel } from "@/lib/recommendations";

export default function RecommendationDetail({ id }) {
  const { user, userId, token } = useAppAuth();
  const router = useRouter();
  const [rec, setRec] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await apiJson(`/api/v1/recommendations/${id}`, {
        method: "GET",
        token: token ?? undefined,
      });
      setRec(data.recommendation);
    } catch (e) {
      setError(e.message);
      setRec(null);
    }
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  async function onVote(vote_type) {
    if (!token) {
      router.push("/login");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await apiJson(`/api/v1/recommendations/${id}/votes`, {
        method: "POST",
        token,
        body: JSON.stringify({ vote_type }),
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function onComment(e) {
    e.preventDefault();
    if (!token) {
      router.push("/login");
      return;
    }
    const fd = new FormData(e.target);
    const comment_text = String(fd.get("comment_text") ?? "").trim();
    const is_anonymous = fd.get("is_anonymous") === "on";
    if (!comment_text) return;
    setBusy(true);
    setError("");
    try {
      await apiJson(`/api/v1/recommendations/${id}/comments`, {
        method: "POST",
        token,
        body: JSON.stringify({ comment_text, is_anonymous }),
      });
      e.target.reset();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onRating(e) {
    e.preventDefault();
    if (!token) {
      router.push("/login");
      return;
    }
    const fd = new FormData(e.target);
    const body = {
      price_rating: Number(fd.get("price_rating")),
      quality_rating: Number(fd.get("quality_rating")),
      safety_rating: Number(fd.get("safety_rating")),
    };
    setBusy(true);
    setError("");
    try {
      await apiJson(`/api/v1/recommendations/${id}/ratings`, {
        method: "POST",
        token,
        body: JSON.stringify(body),
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!rec && !error) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>
    );
  }

  if (error && !rec) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
        {error}
        <div className="mt-3">
          <Link href="/recommendations" className="text-sm font-medium underline">
            Back to list
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user && rec.created_by === userId;
  const votes = rec.votes ?? { upvote: 0, downvote: 0 };

  return (
    <article className="space-y-8">
      {error && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          {error}
        </p>
      )}

      <div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {typeLabel(rec.type)}
          </span>
          {rec.price_range != null && <span>Price tier {rec.price_range}</span>}
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {rec.title}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {rec.author?.name ?? "Unknown"} ·{" "}
          {/* {rec.created_at
            ? new Date(rec.created_at).toLocaleString()
            : ""} */}
        </p>
      </div>

      <div className="prose prose-zinc max-w-none dark:prose-invert">
        <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
          {rec.description}
        </p>
        {rec.safety_description && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900 dark:bg-amber-950/30">
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Safety note
            </h3>
            <p className="mt-1 whitespace-pre-wrap text-sm text-amber-950 dark:text-amber-100">
              {rec.safety_description}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          ↑ {votes.upvote ?? 0} · ↓ {votes.downvote ?? 0}
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={() => onVote("upvote")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${rec.viewer_vote_type === "upvote"
            ? "bg-teal-600 text-white"
            : "border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            }`}
        >
          Upvote
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onVote("downvote")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${rec.viewer_vote_type === "downvote"
            ? "bg-zinc-700 text-white"
            : "border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            }`}
        >
          Downvote
        </button>
        {!token && (
          <span className="text-xs text-zinc-500">Log in to vote</span>
        )}
      </div>

      {isOwner && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          You created this recommendation. Edit or delete via the API for now.
        </p>
      )}

      <section className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Rate (1–5 each)
        </h2>
        {!token && (
          <p className="mt-1 text-sm text-zinc-500">
            <Link href="/login" className="underline">
              Log in
            </Link>{" "}
            to submit a rating.
          </p>
        )}
        <form onSubmit={onRating} className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { name: "price_rating", label: "Price" },
            { name: "quality_rating", label: "Quality" },
            { name: "safety_rating", label: "Safety" },
          ].map(({ name, label }) => (
            <label
              key={name}
              className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              {label}
              <select
                name={name}
                required
                disabled={!token || busy}
                className="rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                defaultValue="5"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={!token || busy}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Submit rating
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Comments
        </h2>
        <form onSubmit={onComment} className="mt-3 space-y-2">
          <textarea
            name="comment_text"
            rows={3}
            required
            disabled={!token || busy}
            placeholder={
              token ? "Write a comment…" : "Log in to comment"
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input type="checkbox" name="is_anonymous" disabled={!token} />
            Post anonymously
          </label>
          <button
            type="submit"
            disabled={!token || busy}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Post comment
          </button>
        </form>
        <ul className="mt-6 space-y-4">
          {(rec.comments ?? []).map((c) => (
            <li
              key={c.comment_id}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <p className="text-sm text-zinc-800 dark:text-zinc-200">
                {c.comment_text}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                {c.is_anonymous
                  ? "Anonymous"
                  : c.author_name ?? "Member"}{" "}
                · {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
              </p>
            </li>
          ))}
        </ul>
        {(!rec.comments || rec.comments.length === 0) && (
          <p className="mt-4 text-sm text-zinc-500">No comments yet.</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Recent ratings
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          {(rec.ratings ?? []).map((r) => (
            <li key={r.rating_id}>
              Price {r.price_rating} · Quality {r.quality_rating} · Safety{" "}
              {r.safety_rating}
              {r.created_at
                ? ` · ${new Date(r.created_at).toLocaleDateString()}`
                : ""}
            </li>
          ))}
        </ul>
        {(!rec.ratings || rec.ratings.length === 0) && (
          <p className="mt-2 text-sm text-zinc-500">No ratings yet.</p>
        )}
      </section>
    </article>
  );
}
