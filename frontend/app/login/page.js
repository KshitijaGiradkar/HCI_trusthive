
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const verified = searchParams.get("verified") === "1";
  const authError = searchParams.get("error");

  // 🔥 Always reset state when page loads
  useEffect(() => {
    setEmail("");
    setPassword("");
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  // async function onSubmit(e) {
  //   e.preventDefault();
  //   setError("");
  //   setPending(true);

  //   try {
  //     const result = await signIn("credentials", {
  //       email,
  //       password,
  //       redirect: false,
  //       callbackUrl: "/",
  //     });

  //     if (result?.error) {
  //       throw new Error("Invalid email or password");
  //     }

  //     // ✅ clear inputs after success
  //     setEmail("");
  //     setPassword("");

  //     router.replace(result?.url || "/");
  //     router.refresh();
  //   } catch (err) {
  //     setError(err.message || "Unable to sign in");

  //     // ✅ clear only password on failure
  //     setPassword("");
  //   } finally {
  //     setPending(false);
  //   }
  // }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setPending(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        throw new Error("Invalid email or password");
      }

      router.push(result?.url || "/");
    } catch (err) {
      setError(err.message || "Unable to sign in");
      setPassword("");
    } finally {
      setPending(false);
    }
  }

  async function onGoogleSignIn() {
    setError("");
    setGooglePending(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setError("Unable to start Google sign-in. Please try again.");
      setGooglePending(false);
    }
  }

  return (
    <main key="login-page" className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12 relative overflow-hidden">

      {/* Optional subtle background gradients */}
      <div className="absolute top-[0%] left-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md z-10 relative mt-8 md:mt-0">

        {/* 2. LOGO + BRAND SECTION */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center shadow-inner mb-3">
            <svg className="w-7 h-7 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
            TrustHive
          </span>
        </div>

        {/* 3. LOGIN CARD CONTAINER */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8">

          {/* 4. HEADER TEXT */}
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Welcome back.</h1>
            <p className="mt-2 text-sm text-gray-500">
              Use your campus email.{" "}
              <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                Create an account
              </Link>
            </p>
          </div>

          {verified && (
            <div className="mb-6 rounded-xl bg-green-50 p-4 border border-green-100 flex items-center gap-3 text-sm text-green-800">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              <span>OTP verified successfully. You can now log in.</span>
            </div>
          )}

          {authError === "AccessDenied" && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-100 flex items-center gap-3 text-sm text-red-800">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              <span>Only campus email IDs are allowed.</span>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-100 flex items-center gap-3 text-sm text-red-800">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              <span>{error}</span>
            </div>
          )}

          {/* 5. FORM FIELDS */}
          <form onSubmit={onSubmit} autoComplete="off" className="space-y-5">

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 ml-1">
                Email Address
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                  placeholder="name@institute.edu"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between ml-1 pr-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Password
                </label>
                {/* 7. FORGOT PASSWORD */}
                <Link href="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-16 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {/* 6. HIDE / SHOW TOGGLE */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 focus:outline-none hover:bg-gray-200 hover:text-gray-700 transition"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* 8. PRIMARY BUTTON (SIGN IN) */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={pending}
                className="flex w-full justify-center items-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 py-3.5 px-4 text-sm font-semibold text-white shadow-md hover:from-indigo-600 hover:to-purple-600 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
              >
                {pending ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>

          {/* 9. DIVIDER */}
          <div className="my-8 flex items-center justify-center relative">
            <div className="h-px w-full bg-gray-200"></div>
            <span className="bg-white px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest absolute">or</span>
          </div>

          <button
            type="button"
            onClick={onGoogleSignIn}
            disabled={googlePending}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 hover:-translate-y-0.5"
          >
            {googlePending ? (
              <svg className="animate-spin h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                Continue with Google
              </>
            )}
          </button>
        </div>

        {/* 10. FOOTER INFO */}
        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-gray-400 font-medium pb-8">
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          <span>Identity Verification Active</span>
        </div>
      </div>
    </main>
  );
}

