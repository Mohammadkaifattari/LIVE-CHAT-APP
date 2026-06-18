"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Menu, X } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <span className="text-white/30 text-sm font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-[100dvh] bg-[#09090b] text-foreground overflow-hidden">

      {/* ── Mobile hamburger ── */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-xl bg-white/8 border border-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/12 transition-all shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Backdrop ── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-fade-in-scale"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Sidebar — desktop static, mobile drawer ── */}
      <div
        className={`
          fixed md:static inset-y-0 left-0 z-50
          transform transition-transform duration-300 ease-in-out
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Close button inside drawer on mobile */}
        {drawerOpen && (
          <button
            onClick={() => setDrawerOpen(false)}
            className="md:hidden absolute top-3 right-3 z-10 w-8 h-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <Sidebar onNavigate={() => setDrawerOpen(false)} />
      </div>

      {/* ── Main content ── */}
     <main className="flex-1 h-full overflow-hidden relative">
  <div className="h-full pt-14 md:pt-0 overflow-hidden">
    {children}
  </div>
</main>
    </div>
  );
}