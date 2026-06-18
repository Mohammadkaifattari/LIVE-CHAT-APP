"use client";

import React, { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { X } from "lucide-react";
import { setUserOnline, setUserOffline } from "@/lib/firebase";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { drawerOpen, setDrawerOpen } = useSidebar();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setDrawerOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    setUserOnline(user.uid);
    window.addEventListener("beforeunload", () => setUserOffline(user.uid));
    return () => {
      setUserOffline(user.uid);
      window.removeEventListener("beforeunload", () => setUserOffline(user.uid));
    };
  }, [user]);

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

      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}>
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

      {/* Main content — no padding top */}
      <main className="flex-1 h-full overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}