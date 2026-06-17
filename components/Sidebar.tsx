"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  MessageSquare,
  Bell,
  LogOut,
  MessageCircle,
  Sun,
  Moon,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import gsap from "gsap";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Simple theme hook ──────────────────────────────────────────
function useTheme() {
  const [dark, setDark] = React.useState(true);

  useEffect(() => {
    // Read saved preference, default dark
    const saved = localStorage.getItem("theme");
    const isDark = saved ? saved === "dark" : true;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return { dark, toggle };
}
// ──────────────────────────────────────────────────────────────

interface SidebarProps {
  onNavigate?: () => void;
}

export const Sidebar = ({ onNavigate }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  const sidebarRef = useRef<HTMLElement>(null);
  const { dark, toggle } = useTheme();

  const navItems = [
    { name: "Friends", href: "/dashboard", icon: Users },
    { name: "Messages", href: "/dashboard/chat", icon: MessageSquare },
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  ];

  // GSAP entry animation
  useEffect(() => {
    if (sidebarRef.current) {
      gsap.fromTo(
        sidebarRef.current,
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
      );
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/auth/login");
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  return (
    <aside
      ref={sidebarRef}
      className="w-20 md:w-64 h-screen glass-card !rounded-none border-y-0 border-l-0 flex flex-col p-4 z-50 overflow-hidden"
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-2 mb-10 mt-2">
        <div className="w-10 h-10 bg-premium-gradient rounded-xl flex items-center justify-center flex-shrink-0">
          <MessageCircle className="text-white w-6 h-6" />
        </div>
        <span className="font-outfit font-bold text-xl tracking-tight hidden md:block">
          ChatApp
        </span>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group",
                isActive
                  ? "bg-premium-gradient text-white shadow-lg shadow-primary/20"
                  : "text-foreground/60 hover:bg-glass-100 hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "w-6 h-6 transition-transform",
                  !isActive && "group-hover:scale-110"
                )}
              />
              <span className="font-medium hidden md:block">{item.name}</span>
              {isActive && (
                <div
                  className="w-1.5 h-6 bg-white rounded-full ml-auto hidden md:block"
                  style={{
                    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom section ── */}
      <div className="pt-4 border-t border-glass-border space-y-2">
        
        {/* User info — desktop only */}
        <div className="hidden md:flex items-center gap-3 p-2 mb-2">
          <div className="w-10 h-10 bg-glass-200 rounded-full flex items-center justify-center font-bold text-primary flex-shrink-0">
            {profile?.userName?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">
              {profile?.userName}
            </span>
            <span className="text-[10px] text-foreground/40 font-mono">
              ONLINE
            </span>
          </div>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-foreground/60 hover:bg-glass-100 hover:text-foreground transition-colors group"
          aria-label="Toggle theme"
        >
          {dark ? (
            <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-300" />
          )}
          <span className="font-medium hidden md:block">
            {dark ? "Light Mode" : "Dark Mode"}
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors group"
        >
          <LogOut className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          <span className="font-medium hidden md:block">Logout</span>
        </button>
      </div>
    </aside>
  );
};