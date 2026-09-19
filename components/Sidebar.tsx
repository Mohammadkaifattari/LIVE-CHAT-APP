"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  MessageSquare,
  Bell,
  LogOut,
  MessageCircle,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import gsap from "gsap";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getRoomId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("_");
}

interface SidebarProps {
  onNavigate?: () => void;
}

export const Sidebar = ({ onNavigate }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user: authUser } = useAuth();
  const sidebarRef = useRef<HTMLElement>(null);
  const [dark, setDark] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const navItems = [
    { name: "Friends", href: "/dashboard", icon: Users },
    { name: "Messages", href: "/dashboard/chat", icon: MessageSquare },
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  ];

  // Keep the sidebar badge and browser notifications in sync with Firebase.
  useEffect(() => {
    if (!authUser || !profile?.friends?.length) {
      setUnreadMessages(0);
      return;
    }

    const unreadByRoom = new Map<string, number>();
    const initializedRooms = new Set<string>();
    const unsubscribeFunctions = profile.friends.map((friendId: string) => {
      const roomId = getRoomId(authUser.uid, friendId);
      const unreadQuery = query(
        collection(db, "chats", roomId, "messages"),
        where("senderId", "!=", authUser.uid),
        where("seen", "==", false)
      );

      return onSnapshot(unreadQuery, (snapshot) => {
        unreadByRoom.set(roomId, snapshot.size);
        setUnreadMessages(
          Array.from(unreadByRoom.values()).reduce((total, count) => total + count, 0)
        );

        // Do not show notifications for messages that were already unread when
        // the app opened. Only notify for messages arriving afterwards.
        if (!initializedRooms.has(roomId)) {
          initializedRooms.add(roomId);
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type !== "added") return;
          const message = change.doc.data();
          if (typeof window === "undefined" || !("Notification" in window)) return;

          const showNotification = (permission: NotificationPermission) => {
            if (permission !== "granted") return;
            const notification = new Notification("New message", {
              body: message.text || "You received a new message",
              tag: `chat-${roomId}`,
            });
            notification.onclick = () => {
              window.focus();
              window.location.href = `/dashboard/chat/${friendId}`;
            };
          };

          if (Notification.permission === "granted") {
            showNotification("granted");
          } else if (Notification.permission === "default") {
            Notification.requestPermission().then(showNotification).catch(() => {});
          }
        });
      });
    });

    return () => unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
  }, [authUser?.uid, profile?.friends]);

  useEffect(() => {
    if (sidebarRef.current) {
      gsap.fromTo(
        sidebarRef.current,
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
      );
    }
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

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
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/25">
          <MessageCircle className="text-white w-5 h-5" />
        </div>
        <span className="font-outfit font-bold text-lg tracking-tight text-white">ChatApp</span>
      </div>

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
              {item.name === "Messages" && unreadMessages > 0 && (
                <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-violet-500/40">
                  {unreadMessages > 99 ? "99+" : unreadMessages}
                </span>
              )}
              {isActive && (
                <div className="w-1.5 h-4 bg-gradient-to-b from-violet-400 to-indigo-500 rounded-full ml-auto" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 overflow-hidden">
            {profile?.profileImage ? (
              <img src={profile.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              profile?.userName?.[0]?.toUpperCase() ?? "?"
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-white/80 truncate">{profile?.userName}</span>
            <span className="text-[10px] text-emerald-400 font-mono">● ONLINE</span>
          </div>
        </div>

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
