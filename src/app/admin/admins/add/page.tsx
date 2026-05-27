"use client";

// =============================================================================
// Add Admin Page — Create New Administrator (SUPER_ADMIN only)
// =============================================================================
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CustomSelect } from "@/components/ui/CustomSelect";

export default function AddAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role !== "SUPER_ADMIN") {
        setError("Access Denied. Only SUPER_ADMIN accounts can create new administrators.");
        setAuthChecking(false);
      } else {
        setAuthChecking(false);
      }
    }
  }, [status, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) return setError("Name is required");
    if (!email.trim()) return setError("Email is required");
    if (password.length < 6) return setError("Password must be at least 6 characters");

    setLoading(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password,
          role,
          isActive,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create account");
      }

      setSuccess("Administrator account created successfully!");
      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setRole("ADMIN");
      setIsActive(true);

      // Redirect after brief delay
      setTimeout(() => {
        router.push("/admin/admins");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (authChecking) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="card-glass border border-white/10 p-6 rounded-3xl space-y-4">
          <div className="skeleton h-10 w-full rounded-xl" />
          <div className="skeleton h-10 w-full rounded-xl" />
          <div className="skeleton h-10 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error && session?.user?.role !== "SUPER_ADMIN") {
    return (
      <div className="card-glass p-8 text-center max-w-lg mx-auto rounded-3xl border border-white/10 mt-12 shadow-2xl">
        <div className="text-5xl mb-4">🛡️</div>
        <h2 className="text-xl font-bold mb-3 text-white">Access Restricted</h2>
        <p className="text-sm text-neutral-400 leading-relaxed mb-6">{error}</p>
        <Link href="/admin" className="btn-primary py-2.5 px-6 rounded-xl font-bold text-sm inline-block">
          Go back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] pb-5">
        <Link href="/admin/admins" className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Add Administrator
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Create a new administrator account with tailored roles and permissions.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="card-glass border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.01] to-purple-500/[0.01] pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {/* Notifications */}
          {error && (
            <div className="p-3 rounded-xl text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              ✓ {success}
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              required
              className="input w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white outline-none focus:border-emerald-500/30 transition-all text-sm"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. johndoe@company.com"
              required
              className="input w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white outline-none focus:border-emerald-500/30 transition-all text-sm"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Default Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              className="input w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white outline-none focus:border-emerald-500/30 transition-all text-sm"
            />
          </div>

          {/* Role selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Role Access Level</label>
            <CustomSelect
              value={role}
              onChange={(val) => setRole(val)}
              options={[
                { value: "SUPER_ADMIN", label: "SUPER ADMIN (Full Access + Admin Management)" },
                { value: "ADMIN", label: "ADMIN (Full Content management)" },
                { value: "EDITOR", label: "EDITOR (Modify apps content only)" },
                { value: "UPLOADER", label: "UPLOADER (Upload versions/mirrors only)" },
              ]}
            />
          </div>

          {/* Active status */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-white/10 bg-white/[0.03] text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
            />
            <label htmlFor="isActive" className="text-xs font-bold text-neutral-300 uppercase tracking-wider cursor-pointer">
              Enable profile immediately
            </label>
          </div>

          {/* Submit */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
