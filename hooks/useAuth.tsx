"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";

interface UserProfile {
  uid: string;
  email: string | null;
  userName: string;
  friends: string[];
  friendRequests: string[];
  sentRequests: string[];
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);

        unsubscribeProfile = onSnapshot(
          userRef,
          async (userDoc) => {
            if (userDoc.exists()) {
              const data = userDoc.data();
              setProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                userName: data.UserName || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
                friends: data.friends || [],
                friendRequests: data.friendRequest || [],
                sentRequests: data.sendrequest || [],
              });
            } else {
              // Google login ke baad doc abhi nahi bana — khud bana do
              await setDoc(userRef, {
                userId: firebaseUser.uid,
                email: firebaseUser.email,
                UserName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
                friends: [],
                friendRequest: [],
                sendrequest: [],
                createdAt: serverTimestamp(),
              });
            }
            setLoading(false);
          },
          (error) => {
            // Permissions error silently ignore karo — logout state mein hota hai
            if (error.code !== "permission-denied") {
              console.error("Profile listener error:", error);
            }
            setProfile(null);
            setLoading(false);
          }
        );
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);