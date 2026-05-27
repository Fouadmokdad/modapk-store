"use client";

// =============================================================================
// Admin Login Page
// =============================================================================
import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/admin");
    }
  }, [status, router]);

  // Loading state or redirecting state
  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "hsl(var(--color-bg-primary))" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse"
            style={{
              background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: "hsl(var(--color-text-tertiary))" }}>
            {status === "authenticated" ? "Redirecting to Dashboard..." : "Checking credentials..."}
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
      {/* Ambient glow */}
      <div
        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{ background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))" }}
      />

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div
          className="glass rounded-3xl p-8 shadow-xl fade-in"
          style={{ background: "hsl(var(--color-bg-card) / 0.85)" }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              style={{
                background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))",
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "hsl(var(--color-text-primary))" }}
            >
              Admin Dashboard
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: "hsl(var(--color-text-secondary))" }}
            >
              Sign in to manage your MOD APK store
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-6 p-3 rounded-xl text-sm text-center font-medium"
              style={{
                background: "hsl(0 84% 60% / 0.1)",
                color: "hsl(0 84% 60%)",
                border: "1px solid hsl(0 84% 60% / 0.2)",
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-sm font-medium mb-2"
                style={{ color: "hsl(var(--color-text-secondary))" }}
              >
                Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@modapkstore.com"
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none"
                style={{
                  background: "hsl(var(--color-bg-secondary))",
                  color: "hsl(var(--color-text-primary))",
                  border: "1px solid hsl(var(--color-border))",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "hsl(142 71% 45%)";
                  e.target.style.boxShadow = "0 0 0 3px hsl(142 71% 45% / 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "hsl(var(--color-border))";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium mb-2"
                style={{ color: "hsl(var(--color-text-secondary))" }}
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none"
                style={{
                  background: "hsl(var(--color-bg-secondary))",
                  color: "hsl(var(--color-text-primary))",
                  border: "1px solid hsl(var(--color-border))",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "hsl(142 71% 45%)";
                  e.target.style.boxShadow = "0 0 0 3px hsl(142 71% 45% / 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "hsl(var(--color-border))";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all relative overflow-hidden disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p
          className="text-center text-xs mt-6"
          style={{ color: "hsl(var(--color-text-tertiary))" }}
        >
          ModAPK Store Admin Panel • Authorized Access Only
        </p>
      </div>
    </div>
  );
}
