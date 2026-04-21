"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Users, 
  MessageSquare, 
  Settings, 
  LogOut, 
  MessageCircle,
  Bell
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

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  const sidebarRef = useRef(null);

  const navItems = [
    { name: "Friends", href: "/dashboard", icon: Users },
    { name: "Messages", href: "/dashboard/chat", icon: MessageSquare },
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  ];

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
      <div className="flex items-center gap-3 px-2 mb-10 mt-2">
        <div className="w-10 h-10 bg-premium-gradient rounded-xl flex items-center justify-center flex-shrink-0">
          <MessageCircle className="text-white w-6 h-6" />
        </div>
        <span className="font-outfit font-bold text-xl tracking-tight hidden md:block">ChatApp</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group",
                isActive 
                  ? "bg-premium-gradient text-white shadow-lg shadow-primary/20" 
                  : "text-foreground/60 hover:bg-glass-100 hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-6 h-6 transition-transform", !isActive && "group-hover:scale-110")} />
              <span className="font-medium hidden md:block">{item.name}</span>
              {isActive && (
                <div 
                  className="w-1.5 h-6 bg-white rounded-full ml-auto hidden md:block" 
                  style={{ animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-glass-border space-y-2">
        <div className="flex items-center gap-3 p-2 mb-4 hidden md:flex">
          <div className="w-10 h-10 bg-glass-200 rounded-full flex items-center justify-center font-bold text-primary">
            {profile?.userName?.[0].toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold truncate max-w-[120px]">{profile?.userName}</span>
            <span className="text-[10px] text-foreground/40 font-mono">ONLINE</span>
          </div>
        </div>
        
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
