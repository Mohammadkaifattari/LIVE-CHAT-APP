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

function useTheme() {
  const [dark, setDark] = React.useState(true);

  useEffect(() => {
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
    { name: "Friends",       href: "/dashboard",               icon: Users },
    { name: "Messages",      href: "/dashboard/chat",          icon: MessageSquare },
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  ];

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
      className="w-64 h-screen flex flex-col bg-[#0d0d1a] border-r border-white/5 z-50 overflow-hidden"
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/25">
          <MessageCircle className="text-white w-5 h-5" />
        </div>
        <span className="font-outfit font-bold text-lg tracking-tight text-white">
          ChatApp
        </span>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-violet-500/15 border border-violet-500/25 text-white"
                  : "text-white/40 hover:bg-white/5 hover:text-white/80"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-transform", !isActive && "group-hover:scale-110")} />
              <span className="font-medium text-sm">{item.name}</span>
              {isActive && (
                <div className="w-1.5 h-4 bg-gradient-to-b from-violet-400 to-indigo-500 rounded-full ml-auto" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom ── */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
            {profile?.userName?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-white/80 truncate">
              {profile?.userName}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">● ONLINE</span>
          </div>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:bg-white/5 hover:text-white/80 transition-all group"
        >
          {dark ? (
            <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-300" />
          )}
          <span className="text-sm font-medium">{dark ? "Light Mode" : "Dark Mode"}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all group"
        >
          <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};