"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { UserCard } from "@/components/UserCard";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import gsap from "gsap";

export default function DashboardPage() {
  const { profile, user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "friends" | "requests">("all");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) {
      setLoading(false);
      return;
    }

    // Real-time listener for all users
    const q = query(collection(db, "users"), where("userId", "!=", authUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to users", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authUser]);

  // Social Actions
  const handleAddFriend = async (targetId: string) => {
    if (!authUser) return;
    try {
      await updateDoc(doc(db, "users", targetId), { friendRequest: arrayUnion(authUser.uid) });
      await updateDoc(doc(db, "users", authUser.uid), { sendrequest: arrayUnion(targetId) });
    } catch (err) {
      console.error("Add friend error", err);
    }
  };

  const handleAcceptFriend = async (targetId: string) => {
    if (!authUser) return;
    try {
      await updateDoc(doc(db, "users", authUser.uid), { 
        friends: arrayUnion(targetId), 
        friendRequest: arrayRemove(targetId) 
      });
      await updateDoc(doc(db, "users", targetId), { 
        friends: arrayUnion(authUser.uid), 
        sendrequest: arrayRemove(authUser.uid) 
      });
    } catch (err) {
      console.error("Accept error", err);
    }
  };

  const handleRejectFriend = async (targetId: string) => {
    if (!authUser) return;
    try {
      await updateDoc(doc(db, "users", authUser.uid), { friendRequest: arrayRemove(targetId) });
      await updateDoc(doc(db, "users", targetId), { sendrequest: arrayRemove(authUser.uid) });
    } catch (err) {
      console.error("Reject error", err);
    }
  };

  const filteredUsers = allUsers.filter(u => {
    const nameMatch = (u.UserName || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "all") return nameMatch;
    if (activeTab === "friends") return profile?.friends.includes(u.userId) && nameMatch;
    if (activeTab === "requests") return profile?.friendRequests.includes(u.userId) && nameMatch;
    return false;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold font-outfit tracking-tight">Social Network</h1>
          <p className="text-foreground/40 font-medium">Connect and grow your premium circle</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
          <Input 
            className="pl-11" 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="flex p-1.5 bg-glass-100 rounded-2xl w-fit border border-glass-border">
        {(["all", "friends", "requests"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 capitalize ${
              activeTab === tab 
                ? "bg-premium-gradient text-white shadow-lg active-tab" 
                : "text-foreground/40 hover:text-foreground hover:bg-glass-100"
            }`}
          >
            {tab === "requests" ? `Requests (${profile?.friendRequests.length || 0})` : tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-foreground/40 font-medium font-mono animate-pulse">Synchronizing Network...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <UserCard
                key={user.userId}
                name={user.UserName}
                email={user.email}
                isFriend={profile?.friends.includes(user.userId) || false}
                isSent={profile?.sentRequests.includes(user.userId) || false}
                hasRequest={profile?.friendRequests.includes(user.userId) || false}
                onAdd={() => handleAddFriend(user.userId)}
                onAccept={() => handleAcceptFriend(user.userId)}
                onReject={() => handleRejectFriend(user.userId)}
                onMessage={() => alert("Message flow in next task!")}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center glass-card border-dashed">
              <p className="text-lg font-medium text-foreground/40">No users found in this section</p>
              <p className="text-sm text-foreground/20 mt-1">Try a different search or invite some friends!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
