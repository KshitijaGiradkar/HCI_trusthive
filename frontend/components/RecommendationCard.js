import Link from "next/link";
import { typeLabel } from "@/lib/recommendations";

export default function RecommendationCard({ rec }) {
  return (
    <Link
      href={`/recommendations/${rec.recommendation_id}`}
      className="group block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      {Array.isArray(rec.image_urls) && rec.image_urls[0] ? (
        <div className="mb-3 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <img
            src={rec.image_urls[0]}
            alt={rec.title}
            className="h-40 w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {typeLabel(rec.type)}
        </span>
        {rec.price_range != null && (
          <span>Price tier {rec.price_range}</span>
        )}
        {rec.location ? <span>• {rec.location}</span> : null}
      </div>
      <h2 className="mt-2 text-lg font-semibold text-zinc-900 group-hover:text-teal-700 dark:text-zinc-100 dark:group-hover:text-teal-400">
        {rec.title}
      </h2>
      <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
        {rec.description}
      </p>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        {rec.author?.name ?? "Unknown"}
        {/* {rec.created_at
          ? ` · ${new Date(rec.created_at).toLocaleDateString()}`
          : ""} */}
      </p>
    </Link>
  );
}
