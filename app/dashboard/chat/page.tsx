"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Search, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ChatListPage() {
  const { profile, user: authUser } = useAuth();
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authUser || !profile?.friends.length) {
      setLoading(false);
      return;
    }

    const fetchFriends = async () => {
      try {
        const q = query(collection(db, "users"), where("userId", "in", profile.friends));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFriendsList(data);
      } catch (err) {
        console.error("Error fetching friends", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [authUser, profile?.friends]);

  const filteredFriends = friendsList.filter(f => 
    (f.UserName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full">
      {/* Sidebar - Conversation List */}
      <div className="w-full md:w-80 border-r border-glass-border flex flex-col glass-card !rounded-none">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-outfit">Messages</h2>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <Input 
              className="pl-9 h-10 text-sm" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {loading ? (
            <div className="p-10 text-center animate-pulse">
              <p className="text-sm font-medium text-foreground/40">Loading chats...</p>
            </div>
          ) : filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <Link
                key={friend.userId}
                href={`/dashboard/chat/${friend.userId}`}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-glass-100 transition-all group"
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-premium-gradient rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                    {friend.UserName?.[0].toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">{friend.UserName}</span>
                    <span className="text-[10px] text-foreground/40">12:30 PM</span>
                  </div>
                  <p className="text-xs text-foreground/40 truncate group-hover:text-foreground/60 transition-colors">
                    Tap to start a conversation
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-10 text-center">
              <p className="text-sm text-foreground/40">No conversations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area - Empty State */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-background/50">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          <div className="w-24 h-24 bg-glass-100 rounded-[2.5rem] flex items-center justify-center text-primary/20 border border-glass-border">
            <MessageCircle className="w-12 h-12" />
          </div>
          <div>
            <h3 className="text-2xl font-bold font-outfit mb-2">Select a conversation</h3>
            <p className="text-foreground/40 leading-relaxed">
              Choose a friend from the list to start a high-end, real-time messaging experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
