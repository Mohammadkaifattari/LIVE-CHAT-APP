"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-muted text-sm font-medium animate-pulse">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-[100dvh] bg-background text-foreground overflow-hidden">
      
      {/* ── Mobile hamburger button ── */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-glass-100 border border-glass-border backdrop-blur-md text-foreground shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Mobile drawer backdrop ── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in-up"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile drawer close button ── */}
      {drawerOpen && (
        <button
          onClick={() => setDrawerOpen(false)}
          className="md:hidden fixed top-4 left-[232px] z-[60] icon-btn p-2"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* ── Sidebar ── */}
      {/* Desktop: always visible | Mobile: drawer */}
      <div
        className={`
          fixed md:static inset-y-0 left-0 z-50
          transform transition-transform duration-300 ease-in-out
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <Sidebar onNavigate={() => setDrawerOpen(false)} />
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 h-full overflow-hidden relative md:ml-0 pt-16 md:pt-0">
        <div className="absolute top-0 left-0 w-full h-[30%] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />
        {children}
      </main>
    </div>
  );
}