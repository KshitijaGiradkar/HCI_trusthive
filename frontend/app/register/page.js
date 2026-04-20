"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiJson } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setPending(true);
    const fd = new FormData(e.target);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    try {
      const data = await apiJson("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      setMessage(data?.message || "OTP sent to your email.");
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50 font-sans relative overflow-hidden">
      
      {/* 2. TOP NAVBAR */}
      <nav className="w-full flex justify-between items-center px-6 py-4 absolute top-0 z-20">
        <Link href="/login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
          <svg className="w-5 h-5 focus:outline-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </Link>
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shadow-inner">
             <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
           </div>
           <span className="text-indigo-600 font-bold tracking-tight">TrustHive</span>
        </div>
      </nav>

      {/* Center content wrapper */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-12 z-10 w-full max-w-md mx-auto">
        
        {/* 3. MAIN CARD CONTAINER */}
        <div className="w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/40 p-6 md:p-8 flex flex-col items-center">
           
           {/* 4. TOP BADGE */}
           <div className="mb-6">
             <span className="inline-block rounded-full bg-purple-100 text-purple-600 px-4 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">
               Phase: Onboarding
             </span>
           </div>

           {/* 5. MAIN HEADING */}
           <h1 className="text-4xl md:text-5xl font-extrabold italic tracking-tight text-gray-900 text-center mb-3">
             JOIN THE <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">HIVE</span>
           </h1>

           {/* 6. SUBTEXT */}
           <p className="text-sm text-gray-500 text-center leading-relaxed max-w-xs mb-8 font-medium">
             Connect, share, and review campus life with your institutional email.
           </p>

           <form onSubmit={onSubmit} className="w-full space-y-5">
             
             {error && (
               <div className="rounded-2xl bg-red-50 p-4 border border-red-100 flex gap-3 text-sm text-red-800 shadow-sm">
                 <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                 <span className="leading-tight">{error}</span>
               </div>
             )}

             {message && (
               <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 flex gap-3 text-sm text-emerald-800 shadow-sm">
                 <svg className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                 <span className="leading-tight">{message}</span>
               </div>
             )}

             {/* 8. INPUT FIELD DESIGN */}
             <div className="space-y-1.5 flex flex-col">
               <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 ml-1">
                 Full Name
               </label>
               <div className="relative flex items-center">
                  <div className="absolute left-4 text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14v.01M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <input
                    name="name"
                    required
                    minLength={2}
                    autoComplete="name"
                    placeholder="Rakesh Sharma"
                    className="w-full rounded-2xl border border-gray-200 bg-white/60 py-3.5 pl-11 pr-4 text-sm text-gray-900 shadow-sm outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
               </div>
             </div>

             <div className="space-y-1.5 flex flex-col pt-1">
               <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 ml-1">
                 Campus Email
               </label>
               <div className="relative flex items-center">
                  <div className="absolute left-4 text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="bcs_1234567@iiitm.ac.in"
                    className="w-full rounded-2xl border border-gray-200 bg-white/60 py-3.5 pl-11 pr-4 text-sm text-gray-900 shadow-sm outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
               </div>
             </div>

             <div className="space-y-1.5 flex flex-col pt-1">
               <div className="flex justify-between items-baseline mb-0.5 mt-1 ml-1 pr-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Password
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">Min 6 chars</span>
               </div>
               <div className="relative flex items-center">
                  <div className="absolute left-4 text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    maxLength={64}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    className="w-full rounded-2xl border border-gray-200 bg-white/60 py-3.5 pl-11 pr-20 text-sm text-gray-900 shadow-sm outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {/* 9. PASSWORD SHOW FIELD */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-600 focus:outline-none hover:bg-gray-200 hover:text-gray-900 transition-colors uppercase tracking-wide border border-gray-200/50"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
               </div>
             </div>

             {/* 10. PRIMARY CTA BUTTON */}
             <div className="pt-5">
               <button
                 type="submit"
                 disabled={pending}
                 className="flex w-full justify-center items-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 py-3.5 px-4 text-sm font-bold tracking-wide text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-purple-600 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:scale-100"
               >
                 {pending ? (
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                 ) : (
                   "Create Account"
                 )}
               </button>
             </div>
           </form>

           {/* 11. FOOTER LINK */}
           <div className="mt-8 mb-2">
             <span className="text-sm text-gray-500 font-medium">
               Already part of the network?{" "}
               <Link href="/login" className="text-indigo-600 font-bold hover:text-indigo-500 transition-colors hover:underline underline-offset-2">
                 Log in
               </Link>
             </span>
           </div>

        </div>

        {/* 12. BOTTOM INFO (SECURITY NOTE) */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400 font-semibold opacity-90 backdrop-blur-sm bg-white/40 px-4 py-2 rounded-full border border-white/60 shadow-sm">
           <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
           <span>Encrypted & Verified Campus Layer</span>
        </div>
      </div>
    </main>
  );
}
