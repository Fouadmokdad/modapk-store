"use client";

// =============================================================================
// My Account Page — Self profile management (change password)
// =============================================================================
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function MyAccountPage() {
  const { data: session } = useSession();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword) return setError("Current password is required");
    if (newPassword.length < 6) return setError("New password must be at least 6 characters");
    if (newPassword !== confirmPassword) return setError("New passwords do not match");

    setLoading(true);
    try {
      const res = await fetch("/api/admin/admins/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to change password");
      }

      setSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <span>👤</span> My Account
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          View your profile details and securely update your password.
        </p>
      </div>

      {/* Profile Info Card */}
      <div className="card-glass border border-white/10 p-6 rounded-3xl shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.01] to-purple-500/[0.01] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4">
          {session?.user?.avatar ? (
            <img src={session.user.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-md shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0 bg-gradient-to-br from-emerald-500/20 to-purple-500/20 border border-white/5 shadow-md">
              {session?.user?.name?.[0]?.toUpperCase() || "A"}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white truncate">{session?.user?.name}</h2>
            <p className="text-xs text-neutral-400 truncate mt-0.5">{session?.user?.email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {session?.user?.role?.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      {/* Password Change Card */}
      <div className="card-glass border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.01] to-purple-500/[0.01] pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2 uppercase tracking-wider text-neutral-300">
            🔒 Change Password
          </h3>

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

          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white outline-none focus:border-emerald-500/30 transition-all text-sm"
            />
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              className="input w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white outline-none focus:border-emerald-500/30 transition-all text-sm"
            />
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="input w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white outline-none focus:border-emerald-500/30 transition-all text-sm"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating password...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
