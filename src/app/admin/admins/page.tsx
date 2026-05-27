"use client";

// =============================================================================
// Admins List Page — Manage Administrator Profiles (SUPER_ADMIN only)
// =============================================================================
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export default function AdminsListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/admins");
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError("Access Denied. You do not have permission to view this page.");
          return;
        }
        throw new Error("Failed to load administrators");
      }
      const json = await res.json();
      setAdmins(json.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role !== "SUPER_ADMIN") {
        setError("Access Denied. Only SUPER_ADMIN accounts can manage administrators.");
        setLoading(false);
      } else {
        fetchAdmins();
      }
    }
  }, [status, session, fetchAdmins]);

  const handleToggleStatus = async (admin: AdminUser) => {
    if (admin.id === session?.user?.id) {
      alert("You cannot disable your own account.");
      return;
    }

    setActionLoadingId(admin.id);
    try {
      const res = await fetch(`/api/admin/admins/${admin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !admin.isActive }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to update status");
      }

      setAdmins((prev) =>
        prev.map((item) =>
          item.id === admin.id ? { ...item, isActive: !item.isActive } : item
        )
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (admin.id === session?.user?.id) {
      alert("You cannot delete your own account.");
      return;
    }

    if (!confirm(`Are you sure you want to delete the administrator account for ${admin.name}?`)) {
      return;
    }

    setActionLoadingId(admin.id);
    try {
      const res = await fetch(`/api/admin/admins/${admin.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to delete account");
      }

      setAdmins((prev) => prev.filter((item) => item.id !== admin.id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "ADMIN":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "EDITOR":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "UPLOADER":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      default:
        return "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="skeleton h-8 w-48 rounded-xl" />
          <div className="skeleton h-10 w-32 rounded-xl" />
        </div>
        <div className="card-glass border border-white/10 p-6 rounded-3xl space-y-4">
          <div className="skeleton h-10 w-full rounded-xl" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>🛡️</span> All Administrators
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manage admin panel users, active state, and edit permission levels.
          </p>
        </div>
        <Link
          href="/admin/admins/add"
          className="btn-primary flex items-center justify-center gap-2 h-10 px-5 rounded-xl font-bold text-sm text-white shrink-0 shadow-lg"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Admin
        </Link>
      </div>

      {/* Table Container */}
      <div className="card-glass border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.01] to-purple-500/[0.01] pointer-events-none" />
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[11px] font-bold uppercase tracking-wider text-neutral-400 bg-white/[0.01]">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-neutral-500">
                    No administrators found.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-white/[0.01] transition-all">
                    {/* User profile */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {admin.avatar ? (
                          <img src={admin.avatar} alt="" className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 bg-gradient-to-br from-emerald-500/20 to-purple-500/20 border border-white/5">
                            {admin.name[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{admin.name}</p>
                          <p className="text-xs text-neutral-400 truncate mt-0.5">{admin.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getRoleBadgeStyle(admin.role)}`}>
                        {admin.role.replace("_", " ")}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(admin)}
                        disabled={admin.id === session?.user?.id || actionLoadingId === admin.id}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          admin.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                        } disabled:opacity-40`}
                      >
                        {actionLoadingId === admin.id ? (
                          <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 align-middle" />
                        ) : null}
                        {admin.isActive ? "Active" : "Disabled"}
                      </button>
                    </td>

                    {/* Last Login */}
                    <td className="px-6 py-4 text-xs text-neutral-300">
                      {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : "Never logged in"}
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 text-xs text-neutral-300">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleDeleteAdmin(admin)}
                          disabled={admin.id === session?.user?.id || actionLoadingId === admin.id}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-30"
                          title="Delete Administrator"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
