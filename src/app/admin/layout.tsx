"use client";

// =============================================================================
// Admin Layout — Sidebar + Header + Content Area
// =============================================================================
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  // Redirect to login if not authenticated, or redirect to dashboard if authenticated on login page
  useEffect(() => {
    if (status === "unauthenticated" && !isLoginPage) {
      router.replace("/admin/login");
    }

    if (status === "authenticated" && isLoginPage) {
      router.replace("/admin");
    }
  }, [status, isLoginPage, router]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--color-bg-primary))" }}>
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
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Redirecting state for unauthenticated users accessing protected paths
  if (status === "unauthenticated" && !isLoginPage) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--color-bg-primary))" }}>
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
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  // Render the login page raw without sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--color-bg-primary))" }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile unless toggled */}
      <div
        className={`
          fixed top-0 left-0 z-40 h-full transition-transform duration-300 lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ width: "var(--sidebar-width)" }}
      >
        <AdminSidebar />
      </div>

      {/* Main content area */}
      <div
        className="min-h-screen transition-all lg:ml-[var(--sidebar-width)]"
      >
        <AdminHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
