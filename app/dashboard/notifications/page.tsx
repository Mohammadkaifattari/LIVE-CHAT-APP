"use client";
import { Bell, UserCheck, UserX, Users, Menu } from "lucide-react";
import React, { useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/context/SidebarContext";
import gsap from "gsap";

interface Requester {
  userId: string;
  UserName: string;
  email?: string;
  profileImage?: string;
}

export default function NotificationsPage() {
  const { user: authUser, profile } = useAuth();
  const [requesters, setRequesters] = React.useState<Requester[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  // ── GSAP entry ──
  useEffect(() => {
    if (!loading && requesters.length > 0 && !hasAnimated.current) {
      hasAnimated.current = true;
      const items = listRef.current?.querySelectorAll("[data-card]");
      if (items?.length) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, ease: "power2.out" }
        );
      }
    }
  }, [loading, requesters.length]);

  // ── Real-time friend requests ──
  useEffect(() => {
    if (!authUser || !profile?.friendRequests?.length) {
      setLoading(false);
      return;
    }

    const ids: string[] = profile.friendRequests;

    const q = query(collection(db, "users"), where("userId", "in", ids));
    const unsub = onSnapshot(q, (snap) => {
      const data: Requester[] = snap.docs.map((d) => ({
        userId: d.data().userId,
        UserName: d.data().UserName,
        email: d.data().email,
        profileImage: d.data().profileImage || "",
      }));
      setRequesters(data);
      setLoading(false);
    });

    return () => unsub();
  }, [authUser, profile?.friendRequests]);

  // ── Accept ──
  const handleAccept = async (requesterId: string) => {
    if (!authUser) return;
    setActionLoading(requesterId + "_accept");
    try {
      const myRef = doc(db, "users", authUser.uid);
      const theirRef = doc(db, "users", requesterId);

      await updateDoc(myRef, {
        friends: arrayUnion(requesterId),
        friendRequest: arrayRemove(requesterId),
      });
      await updateDoc(theirRef, {
        friends: arrayUnion(authUser.uid),
        sendrequest: arrayRemove(authUser.uid),
      });

      setRequesters((prev) => prev.filter((r) => r.userId !== requesterId));
    } catch (err) {
      console.error("Accept error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Reject ──
  const handleReject = async (requesterId: string) => {
    if (!authUser) return;
    setActionLoading(requesterId + "_reject");
    try {
      const myRef = doc(db, "users", authUser.uid);
      const theirRef = doc(db, "users", requesterId);

      await updateDoc(myRef, {
        friendRequest: arrayRemove(requesterId),
      });
      await updateDoc(theirRef, {
        sendrequest: arrayRemove(authUser.uid),
      });

      setRequesters((prev) => prev.filter((r) => r.userId !== requesterId));
    } catch (err) {
      console.error("Reject error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const { setDrawerOpen } = useSidebar();

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setDrawerOpen(true)}
          className="md:hidden w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-white/60 hover:text-white transition-all flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center hidden md:flex">
          <Bell className="w-5 h-5 text-white/50" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white font-outfit tracking-tight">
            Notifications
          </h1>
          <p className="text-xs text-white/30">
            {requesters.length > 0
              ? `${requesters.length} pending request${requesters.length > 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
      </div>

      {/* List */}
      <div ref={listRef} className="space-y-3">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : requesters.length > 0 ? (
          requesters.map((r) => (
            <div
              key={r.userId}
              data-card
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/4 border border-white/8 hover:bg-white/6 transition-all"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg shadow-violet-500/20 overflow-hidden">
                {r.profileImage ? (
                  <img src={r.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  r.UserName?.[0]?.toUpperCase()
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white/90 text-sm truncate">
                  {r.UserName}
                </p>
                <p className="text-xs text-white/30 mt-0.5">
                  Sent you a friend request
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleAccept(r.userId)}
                  disabled={actionLoading !== null}
                  className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 hover:bg-violet-500/30 hover:text-violet-300 transition-all flex items-center justify-center disabled:opacity-40"
                >
                  {actionLoading === r.userId + "_accept" ? (
                    <span className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleReject(r.userId)}
                  disabled={actionLoading !== null}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 text-white/30 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all flex items-center justify-center disabled:opacity-40"
                >
                  {actionLoading === r.userId + "_reject" ? (
                    <span className="w-4 h-4 border-2 border-white/10 border-t-white/30 rounded-full animate-spin" />
                  ) : (
                    <UserX className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-3xl bg-white/4 border border-white/8 flex items-center justify-center">
              <Users className="w-7 h-7 text-white/15" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white/40">
                No new notifications
              </p>
              <p className="text-xs text-white/20 mt-1">
                Friend requests will appear here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/4 border border-white/8 animate-pulse">
      <div className="w-12 h-12 rounded-2xl bg-white/8 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-32 rounded-full bg-white/8" />
        <div className="h-3 w-44 rounded-full bg-white/5" />
      </div>
      <div className="flex gap-2">
        <div className="w-9 h-9 rounded-xl bg-white/5" />
        <div className="w-9 h-9 rounded-xl bg-white/5" />
      </div>
    </div>
  );
}