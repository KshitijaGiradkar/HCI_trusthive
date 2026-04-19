"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // ✅ NEW
import { apiJson } from "@/lib/api";
import { typeLabel } from "@/lib/recommendations";

function AvatarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M20 21a8 8 0 0 0-16 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CategoryPill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
      {children}
    </span>
  );
}

function ListCard({ children }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { data: session, status } = useSession(); // ✅ NEW
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState("");

  // ✅ FIXED REDIRECT LOGIC
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.replace("/login");
    }
  }, [session, status, router]);

  // ✅ Extract values from session
  const userId = session?.user?.id;
  const token = session?.accessToken;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token || !userId) return;

      setError("");

      try {
        const [profileData, activityData] = await Promise.all([
          apiJson(`/api/v1/users/${userId}`, { token }), // ✅ added token
          apiJson(`/api/v1/users/${userId}/activity`, { token }),
        ]);

        if (!cancelled) {
          setProfile(profileData.user);
          setActivity(activityData);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load profile");
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [token, userId]);

  // ✅ FIXED LOADING STATE
  if (status === "loading" || !session) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <p className="text-zinc-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 space-y-8 font-sans">

      {/* 1. PROFILE HEADER CARD */}
      <section className="bg-white rounded-3xl shadow-md p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 border border-gray-100 relative">

        {/* 🖼 PROFILE IMAGE */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden text-indigo-400">
            {profile?.image ? (
              <img src={profile.image} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
            )}
          </div>
          {/* Online Indicator */}
          <div className="absolute bottom-1 right-2 w-5 h-5 bg-green-500 border-[3px] border-white rounded-full shadow-sm"></div>
        </div>

        {/* 👤 USER INFO */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {profile?.name ?? session?.user?.name ?? "User"}
          </h1>
          <div className="mt-2 flex flex-col sm:flex-row items-center gap-3 md:gap-5 text-sm text-gray-500 font-medium">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              {profile?.email ?? session?.user?.email ?? "—"}
            </span>
            {/* <span className="hidden sm:block text-gray-300">•</span> */}
            {/* <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
             </span> */}
          </div>
        </div>

        {/* ✏️ EDIT BUTTON
        <button className="mt-4 md:mt-0 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full px-6 py-2.5 shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-200 font-semibold text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          Edit Profile
        </button> */}

      </section>

      {error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
          {error}
        </p>
      ) : null}

      {/* 2. RECOMMENDATIONS SECTION */}
      <section className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 px-1">
          <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Recommendations ({activity?.posts?.length ?? 0})
          </h2>
        </div>

        <div className="grid gap-3">
          {(activity?.posts?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center shadow-sm">
              <p className="text-sm font-medium text-gray-500">No recommendations authored yet.</p>
            </div>
          ) : (
            activity.posts.map((post) => (
              <Link key={post.recommendation_id} href={`/recommendations/${post.recommendation_id}`} className="group outline-none block w-full">
                <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 flex items-center justify-between shadow-sm transition-all duration-200 group-hover:scale-[1.01] group-hover:border-indigo-400 group-hover:shadow-md group-focus:ring-2 group-focus:ring-indigo-500 group-hover:bg-indigo-50/10">
                  {/* Left */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 shrink-0 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-100 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm md:text-base font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors truncate">
                        {post.title}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs font-medium text-gray-400">
                        <span className="uppercase tracking-wider">{typeLabel(post.type)}</span>
                        <span>•</span>
                        {/* <span>{new Date(post.created_at).toLocaleDateString()}</span> */}
                      </div>
                    </div>
                  </div>
                  {/* Right */}
                  <div className="shrink-0 text-gray-300 group-hover:text-indigo-500 transition-colors pl-3">
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* 3. MY COMMENTS SECTION */}
      <section className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 px-1">
          <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            My Comments ({activity?.comments?.length ?? 0})
          </h2>
        </div>

        <div className="grid gap-4">
          {(activity?.comments?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center shadow-sm">
              <p className="text-sm font-medium text-gray-500">No comments posted yet.</p>
            </div>
          ) : (
            activity.comments.map((comment) => (
              <Link key={comment.comment_id} href={`/recommendations/${comment.recommendation_id}`} className="group outline-none block">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:border-indigo-300 group-focus:ring-2 group-focus:ring-indigo-500 group-hover:scale-[1.01]">

                  <div className="flex justify-between items-baseline gap-2 mb-3">
                    <span className="inline-flex items-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-indigo-500 transition-colors">
                      On {comment.recommendation?.title ?? "Recommendation"}
                    </span>
                    {comment.created_at && (
                      <span className="text-xs font-medium text-gray-400 whitespace-nowrap">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <p className="text-sm leading-relaxed text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                    "{comment.comment_text}"
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

    </main>
  );
}