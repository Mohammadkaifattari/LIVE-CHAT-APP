"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  orderBy,
  limit,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Search, MessageCircle, Users, Menu } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { gsap } from "gsap";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FriendData {
  userId: string;
  UserName: string;
  email?: string;
  profileImage?: string;
}

interface ConversationItem {
  friend: FriendData;
  lastMessage: string;
  lastMessageTime: Date | null;
  unreadCount: number;
  isOnline: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoomId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("_");
}

function formatTime(date: Date | null): string {
  if (!date) return "";
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl animate-pulse">
      <div className="w-12 h-12 rounded-2xl bg-white/5" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-28 rounded-full bg-white/5" />
        <div className="h-3 w-44 rounded-full bg-white/5" />
      </div>
      <div className="h-3 w-8 rounded-full bg-white/5" />
    </div>
  );
}

// ─── Conversation Row ──────────────────────────────────────────────────────────

function ConversationRow({ item }: { item: ConversationItem }) {
  const initial = item.friend.UserName?.[0]?.toUpperCase() ?? "?";

  return (
    <Link
      href={`/dashboard/chat/${item.friend.userId}`}
      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 active:scale-[0.98] transition-all group cursor-pointer"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/20 overflow-hidden">
          {item.friend.profileImage ? (
            <img src={item.friend.profileImage} alt="" className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </div>
        {/* Online dot */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0f0f1a] transition-colors ${
            item.isOnline ? "bg-emerald-400" : "bg-gray-500"
          }`}
        />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm text-white/90 truncate">
            {item.friend.UserName}
          </span>
          <span className="text-[10px] text-white/30 flex-shrink-0">
            {formatTime(item.lastMessageTime)}
          </span>
        </div>
        <p
          className={`text-xs truncate mt-0.5 transition-colors ${
            item.unreadCount > 0
              ? "text-white/70 font-medium"
              : "text-white/30 group-hover:text-white/50"
          }`}
        >
          {item.lastMessage || "Start a conversation"}
        </p>
      </div>

      {/* Unread badge */}
      {item.unreadCount > 0 && (
        <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-violet-500/40">
          {item.unreadCount > 99 ? "99+" : item.unreadCount}
        </span>
      )}
    </Link>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ChatListPage() {
  const { profile, user: authUser } = useAuth();
  const { setDrawerOpen } = useSidebar();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  // ── GSAP entry animation ──────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && conversations.length > 0 && !hasAnimated.current) {
      hasAnimated.current = true;
      const items = listRef.current?.querySelectorAll("[data-row]");
      if (items?.length) {
        gsap.fromTo(
          items,
          { opacity: 0, x: -16 },
          {
            opacity: 1,
            x: 0,
            duration: 0.35,
            stagger: 0.055,
            ease: "power2.out",
          }
        );
      }
    }
  }, [loading, conversations.length]);

  // ── Real-time friends + metadata ──────────────────────────────────────────
  useEffect(() => {
    if (!authUser || !profile?.friends?.length) {
      setLoading(false);
      return;
    }

    const friendIds: string[] = profile.friends;

    // 1) Friends list listener
    const usersQ = query(
      collection(db, "users"),
      where("userId", "in", friendIds)
    );

    const unsubUsers = onSnapshot(usersQ, async (snap) => {
      const friends: FriendData[] = snap.docs.map((d) => ({
        userId: d.data().userId,
        UserName: d.data().UserName,
        email: d.data().email,
        profileImage: d.data().profileImage || "",
      }));

      // 2) For each friend: fetch last message + unread count + online status
      const items: ConversationItem[] = await Promise.all(
        friends.map(async (friend) => {
          const roomId = getRoomId(authUser.uid, friend.userId);

          // Last message
          let lastMessage = "";
          let lastMessageTime: Date | null = null;
          let unreadCount = 0;

          try {
           const msgsQ = query(
              collection(db, "chats", roomId, "messages"),
              orderBy("timestamp", "desc"),
              limit(1)
            );
            await new Promise<void>((resolve) => {
              const unsub = onSnapshot(msgsQ, (msgSnap) => {
                if (!msgSnap.empty) {
                  const msgData = msgSnap.docs[0].data();
                  lastMessage = msgData.text ?? "";
                  lastMessageTime = msgData.timestamp?.toDate?.() ?? null;
                }
                unsub();
                resolve();
              });
            });
          } catch {
            // room may not exist yet
          }

          // Unread count — messages where senderId != me and seen == false
          try {
            const unreadQ = query(
              collection(db, "chats", roomId, "messages"),
              where("senderId", "!=", authUser.uid),
              where("seen", "==", false)
            );
            await new Promise<void>((resolve) => {
              const unsub = onSnapshot(unreadQ, (snap) => {
                unreadCount = snap.size;
                unsub();
                resolve();
              });
            });
          } catch {
            // index may not be ready
          }

          // Online status
          let isOnline = false;
          try {
            const presenceDoc = await getDoc(
              doc(db, "presence", friend.userId)
            );
            isOnline = presenceDoc.data()?.online === true;
          } catch {
            // presence collection may not exist
          }

          return { friend, lastMessage, lastMessageTime, unreadCount, isOnline };
        })
      );

      // Sort: unread first, then by last message time
      items.sort((a, b) => {
        if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
        if (a.lastMessageTime && b.lastMessageTime)
          return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
        return 0;
      });

      setConversations(items);
      setLoading(false);
    });

    return () => unsubUsers();
  }, [authUser, profile?.friends]);

  const filtered = conversations.filter((c) =>
    c.friend.UserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-[#0f0f1a]">
      {/* ── Left panel ── */}
      <div className="w-full md:w-80 border-r border-white/5 flex flex-col">
        {/* Header */}
        <div className="p-5 space-y-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setDrawerOpen(true)}
                className="md:hidden w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                <Menu className="w-4 h-4" />
              </button>
              <h2 className="text-xl font-bold text-white font-outfit tracking-tight">
                Messages
              </h2>
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-xs font-semibold border border-violet-500/30">
                  {totalUnread}
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-all cursor-pointer">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
            <input
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all"
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {loading ? (
            <>
              <ConversationSkeleton />
              <ConversationSkeleton />
              <ConversationSkeleton />
              <ConversationSkeleton />
            </>
          ) : filtered.length > 0 ? (
            filtered.map((item) => (
              <div key={item.friend.userId} data-row>
                <ConversationRow item={item} />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <Users className="w-5 h-5 text-white/20" />
              </div>
              <p className="text-sm text-white/30">
                {searchQuery ? "No match found" : "Add friends to start chatting"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel — empty state ── */}
      <div className="hidden md:flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-5 text-center max-w-xs px-6">
          <div className="w-20 h-20 rounded-[1.75rem] bg-white/4 border border-white/8 flex items-center justify-center">
            <MessageCircle className="w-9 h-9 text-white/15" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white/70 font-outfit mb-1.5">
              Pick a conversation
            </h3>
            <p className="text-sm text-white/30 leading-relaxed">
              Select a friend on the left to open your private, real-time chat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}