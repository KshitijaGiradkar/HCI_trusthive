"use client";
import { uploadImage } from "@/utils/uploadImage";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson } from "@/lib/api";
import { useSession } from "next-auth/react";

const TYPE_OPTIONS = [
  { value: "food", label: "Food" },
  { value: "travel", label: "Travel" },
  { value: "service", label: "Hostel Services" },
  { value: "study_spot", label: "Study Spots" },
  { value: "entertainment", label: "Entertainment" },
  { value: "shopping", label: "Shopping" },
  { value: "health_and_fitness", label: "Health & Fitness" },
  { value: "other", label: "Other" },
];

export default function NewRecommendationPage() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.replace("/login");
    }
  }, [status, session, router]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > 3 * 1024 * 1024) {
      setError("Image must be under 3MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadComplete(false);
    setError("");

    const fileName = `uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/trusthive/${fileName}`;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Authorization", `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`);
    xhr.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trusthive/${fileName}`;
        setUploadedImageUrl(publicUrl);
        setUploadComplete(true);
        setIsUploading(false);
      } else {
        setError("Image upload failed.");
        setIsUploading(false);
      }
    };

    xhr.onerror = () => {
      setError("Network error during image upload.");
      setIsUploading(false);
    };

    xhr.send(file);
  };

  const handleRemoveImage = () => {
    setUploadedImageUrl("");
    setUploadComplete(false);
    setUploadProgress(0);
    setIsUploading(false);
    setError("");
    const fileInput = document.querySelector('input[name="images"]');
    if (fileInput) fileInput.value = "";
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (!token || pending) return;
    setError("");
    setPending(true);
    const fd = new FormData(e.target);
    const title = String(fd.get("title") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const location = String(fd.get("location") ?? "").trim() || undefined;
    const type = String(fd.get("type") ?? "");
    const priceRangeRaw = String(fd.get("price_range") ?? "").trim();
    const parsedPriceRange = Number(priceRangeRaw);
    const price_range = Number.isInteger(parsedPriceRange) && parsedPriceRange > 0
      ? parsedPriceRange
      : undefined;
    const files = fd.getAll("images").filter((f) => f instanceof File && f.size > 0);
    const best_time_to_visit =
      String(fd.get("best_time_to_visit") ?? "").trim() || undefined;
    const safety_description =
      String(fd.get("safety_description") ?? "").trim() || undefined;

    try {
      const imageUrls = [];
      if (uploadedImageUrl) {
        imageUrls.push(uploadedImageUrl);
      } else {
        const accepted = files.filter(
          (file) => file.type.startsWith("image/") && file.size <= 3 * 1024 * 1024
        );
        setUploadingCount(accepted.length);
        for (const file of accepted) {
          const url = await uploadImage(file);
          imageUrls.push(url);
        }
      }

      const body = {
        title,
        description,
        type,
        ...(location ? { location } : {}),
        ...(price_range !== undefined ? { price_range } : {}),
        ...(best_time_to_visit ? { best_time_to_visit } : {}),
        ...(safety_description ? { safety_description } : {}),
        ...(imageUrls.length ? { image_urls: imageUrls } : {}),
      };

      const data = await apiJson("/api/v1/recommendations", {
        method: "POST",
        token,
        body: JSON.stringify(body),
      });
      router.push(`/recommendations/${data.recommendation.recommendation_id}`);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingCount(0);
      setPending(false);
    }
  }

  if (status === "loading" || !session) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-zinc-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 min-h-screen">
      {/* 1. TOP HEADER SECTION */}
      <header className="flex flex-col items-center justify-center text-center mb-8">
        <div className="inline-flex items-center justify-center rounded-full bg-purple-100 text-purple-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
          Share The Circle
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-3">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Share A Discovery</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mt-2 max-w-xl mx-auto">
          Add your favorite spot, service, or hidden gem to the community map.
        </p>
      </header>

      {/* 2. FORM CONTAINER (MAIN CARD) */}
      <section className="bg-white rounded-3xl shadow-xl p-6 md:p-8 max-w-3xl mx-auto border border-gray-100">

        {/* 3. FORM HEADER */}
        <div className="mb-8 border-b border-gray-50 pb-4">
          <span className="text-xs font-bold uppercase tracking-wide text-gray-400 block mb-1">
            Post Guidelines Active
          </span>
          <h2 className="text-lg font-semibold text-gray-900">
            Recommendation Details
          </h2>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800 border border-red-100 flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* TITLE field */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Title
            </label>
            <input
              name="title"
              required
              minLength={3}
              maxLength={200}
              placeholder="e.g. Best Coffee Shop Near Campus"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-400"
            />
          </div>

          {/* DESCRIPTION field */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Description
              </label>
              <span className="text-xs text-gray-400 font-medium">min 10 characters</span>
            </div>
            <textarea
              name="description"
              required
              minLength={10}
              maxLength={5000}
              rows={5}
              placeholder="Tell others what makes this special…"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-400 resize-y"
            />
          </div>

          {/* CATEGORY + PRICE RANGE grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Category
              </label>
              <div className="relative">
                <select
                  name="type"
                  required
                  defaultValue=""
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                >
                  <option value="" disabled>Select category</option>
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Price Level
              </label>
              <input
                name="price_range"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 200"
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* LOCATION field */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Location (optional)
            </label>
            <input
              name="location"
              maxLength={255}
              placeholder="e.g. Near Main Gate, IIITM"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-400"
            />
          </div>

          {/* BEST TIME + SAFETY INFO grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2 h-full">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Best Time to Visit
              </label>
              <input
                name="best_time_to_visit"
                placeholder="e.g. Weekday mornings"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-400 h-full"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Safety Description
              </label>
              <textarea
                name="safety_description"
                maxLength={1000}
                rows={2}
                placeholder="Any safety tips or info…"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-400 resize-y"
              />
            </div>
          </div>

          {/* IMAGE UPLOAD SECTION */}
          <div className="flex flex-col gap-2 pt-2">
            <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Photo
            </label>
            <div className="relative group flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 py-10 transition-colors hover:border-indigo-400 hover:bg-indigo-50">
              <svg className="w-10 h-10 text-indigo-400 mb-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {uploadedImageUrl ? (
                // <div className="flex flex-col items-center">
                //   <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-2">
                //     <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                //   </div>
                //   <p className="text-sm font-medium text-gray-700">Image selected</p>
                //   <p className="text-xs text-gray-500 mt-1">Click to replace</p>
                // </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Image selected</p>
                  <p className="text-xs text-gray-500 mt-1">Click to replace</p>

                  {/* ← ADD THIS BUTTON */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-200 bg-white text-xs font-medium text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors z-10 relative"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Remove image
                  </button>

                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">Click to upload photo</p>
                  <p className="text-xs text-gray-500 mt-1 mb-4">PNG, JPG, GIF up to 500 KB</p>
                  <div className="px-5 py-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-600 shadow-sm group-hover:border-indigo-300 group-hover:text-indigo-600 transition-colors">
                    Choose File
                  </div>
                </>
              )}
              <input
                name="images"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Choose file"
              />
            </div>
            {/* Progress Bar Container */}
            {(isUploading || uploadComplete) && (
              <div className="mt-3 w-full">
                <div className="flex justify-between items-center mb-2 text-sm font-medium">
                  <span className={uploadComplete ? "text-green-600" : "text-indigo-600"}>
                    {uploadComplete ? "Upload complete" : `Uploading... ${uploadProgress}%`}
                  </span>
                  {!uploadComplete && <span className="text-gray-500">{uploadProgress}%</span>}
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner flex">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* PRIMARY BUTTON */}
          <div className="pt-6 border-t border-gray-50">
            <button
              type="submit"
              disabled={pending || isUploading}
              className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 py-3.5 text-base font-semibold text-white shadow-md hover:shadow-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center"
            >
              {pending
                ? uploadingCount > 0
                  ? <span className="flex items-center gap-2"><svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Uploading {uploadingCount} image(s)…</span>
                  : <span className="flex items-center gap-2"><svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Publishing…</span>
                : "Publish Recommendation"}
            </button>
          </div>
        </form>
      </section>

      {/* 7. FOOTER TIP SECTION */}
      <section className="max-w-3xl mx-auto mt-6 rounded-2xl bg-gray-900 text-white p-5 flex items-start sm:items-center gap-4 shadow-lg shadow-gray-900/20">
        <div className="shrink-0 p-2 rounded-xl bg-gray-800/80 text-yellow-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h4 className="font-bold text-sm text-gray-100">Pro-Tip for Great Posts</h4>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            Including appealing photos and a detailed reason why you recommend this spot increases community trust and views!
          </p>
        </div>
      </section>
    </main>
  );
}