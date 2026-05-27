"use client";

// =============================================================================
// Admin Sidebar Component — Premium Design with Collapsible Groups & RBAC
// =============================================================================
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";

interface SubItem {
  label: string;
  href: string;
  roleCheck?: (role: string) => boolean;
  permission?: string;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  permission?: string;
  roleCheck?: (role: string) => boolean;
  children?: SubItem[];
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role || "ADMIN";

  // State to track expanded dropdown folders
  const [adminsExpanded, setAdminsExpanded] = useState(false);

  // Auto-expand admins submenu if currently viewing any of its child pages
  useEffect(() => {
    if (
      pathname.startsWith("/admin/admins") ||
      pathname.startsWith("/admin/my-account")
    ) {
      setAdminsExpanded(true);
    }
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      label: "Apps",
      href: "/admin/apps",
      permission: "edit:apps",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        </svg>
      ),
    },
    {
      label: "Categories",
      href: "/admin/categories",
      permission: "manage:taxonomies",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      label: "Tags",
      href: "/admin/tags",
      permission: "manage:taxonomies",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      ),
    },
    {
      label: "Fetch from Play Store",
      href: "/admin/apps/fetch",
      permission: "create:apps",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x="1" y="3" width="22" height="5" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      ),
    },
    {
      label: "Import from URL",
      href: "/admin/apps/import-url",
      permission: "create:apps",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" strokeWidth="2" />
          <rect x="2" y="2" width="20" height="20" rx="4" />
        </svg>
      ),
    },
    {
      label: "Reports",
      href: "/admin/reports",
      permission: "view:reports",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      label: "Admins",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      children: [
        {
          label: "All Admins",
          href: "/admin/admins",
          permission: "manage:admins",
        },
        {
          label: "Add Admin",
          href: "/admin/admins/add",
          permission: "manage:admins",
        },
        {
          label: "My Account",
          href: "/admin/my-account",
        },
        {
          label: "Security Logs",
          href: "/admin/admins/logs",
          roleCheck: (role) => role === "SUPER_ADMIN" || role === "ADMIN",
        },
      ],
    },
    {
      label: "Telegram Logs",
      href: "/admin/telegram-logs",
      permission: "manage:settings",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      ),
    },
    {
      label: "Telegram Designer",
      href: "/admin/settings/telegram",
      permission: "manage:settings",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 9.25 20.25 7 18 7H16.5C15.67 7 15 6.33 15 5.5V5C15 3.34 13.66 2 12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22Z" />
          <circle cx="7.5" cy="10.5" r="1.5" fill="currentColor" />
          <circle cx="11.5" cy="7.5" r="1.5" fill="currentColor" />
          <circle cx="16.5" cy="11.5" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: "Settings",
      href: "/admin/settings",
      permission: "manage:settings",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  // Helper to filter subitems by permission
  const getVisibleSubItems = (children: SubItem[]) => {
    return children.filter((child) => {
      if (child.roleCheck && !child.roleCheck(userRole)) return false;
      if (child.permission && !hasPermission(userRole, child.permission as any)) return false;
      return true;
    });
  };

  // Helper to check if a parent item is visible
  const isItemVisible = (item: NavItem) => {
    if (item.permission && !hasPermission(userRole, item.permission as any)) return false;
    if (item.roleCheck && !item.roleCheck(userRole)) return false;
    if (item.children) {
      const visibleChildren = getVisibleSubItems(item.children);
      return visibleChildren.length > 0;
    }
    return true;
  };

  return (
    <aside
      className="w-full h-full flex flex-col transition-all"
      style={{
        background: "hsl(var(--color-bg-card))",
        borderRight: "1px solid hsl(var(--color-border))",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-6 shrink-0"
        style={{ height: "var(--header-height)", borderBottom: "1px solid hsl(var(--color-border))" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold animate-fade-in" style={{ color: "hsl(var(--color-text-primary))" }}>
            ModAPK Store
          </h2>
          <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">
            {userRole.replace("_", " ")} Panel
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <ul>
          {navItems.filter(isItemVisible).map((item, idx) => {
            if (item.children) {
              const visibleChildren = getVisibleSubItems(item.children);
              const isChildActive = visibleChildren.some((child) => pathname === child.href);

              return (
                <li key={idx} className="mb-1.5">
                  <button
                    onClick={() => setAdminsExpanded(!adminsExpanded)}
                    className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-neutral-300 hover:bg-white/[0.04] hover:text-white"
                    style={{
                      color: isChildActive ? "hsl(var(--color-text-primary))" : undefined,
                      background: isChildActive ? "bg-white/[0.02]" : undefined,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="shrink-0 text-neutral-400">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform duration-200 text-neutral-500 ${
                        adminsExpanded ? "rotate-90 text-white" : ""
                      }`}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>

                  {/* Collapsible Children block */}
                  {adminsExpanded && (
                    <ul className="mt-1.5 pl-9 space-y-1 border-l border-white/5 ml-[21px] mr-1.5 animate-slide-down">
                      {visibleChildren.map((child, cIdx) => {
                        const active = pathname === child.href;
                        return (
                          <li key={cIdx}>
                            <Link
                              href={child.href}
                              className="block py-2 px-3 rounded-lg text-xs font-semibold transition-all"
                              style={{
                                color: active
                                  ? "hsl(142 71% 45%)"
                                  : "hsl(var(--color-text-secondary))",
                                background: active
                                  ? "hsl(142 71% 45% / 0.08)"
                                  : "transparent",
                              }}
                              onMouseEnter={(e) => {
                                if (!active) {
                                  e.currentTarget.style.color = "hsl(var(--color-text-primary))";
                                  e.currentTarget.style.background = "white/[0.02]";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!active) {
                                  e.currentTarget.style.color = "hsl(var(--color-text-secondary))";
                                  e.currentTarget.style.background = "transparent";
                                }
                              }}
                            >
                              {child.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            const active = isActive(item.href || "");
            return (
              <li key={idx} className="mb-1">
                <Link
                  href={item.href || "#"}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    color: active
                      ? "hsl(142 71% 45%)"
                      : "hsl(var(--color-text-secondary))",
                    background: active
                      ? "hsl(142 71% 45% / 0.1)"
                      : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "hsl(var(--color-bg-secondary))";
                      e.currentTarget.style.color = "hsl(var(--color-text-primary))";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "hsl(var(--color-text-secondary))";
                    }
                  }}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div
        className="px-3 py-4 shrink-0"
        style={{ borderTop: "1px solid hsl(var(--color-border))" }}
      >
        {/* Visit Site */}
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1 hover:bg-white/[0.04]"
          style={{ color: "hsl(var(--color-text-secondary))" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <span>Visit Site</span>
        </Link>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full cursor-pointer hover:bg-red-500/10"
          style={{ color: "hsl(0 84% 60%)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
