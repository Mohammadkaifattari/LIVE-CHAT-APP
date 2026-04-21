"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Send, ChevronLeft, MoreVertical, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export default function PrivateChatPage() {
  const { id: friendId } = useParams();
  const { user: authUser, profile } = useAuth();
  const [friend, setFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch friend data
  useEffect(() => {
    const fetchFriend = async () => {
      if (!friendId) return;
      const snap = await getDoc(doc(db, "users", friendId as string));
      if (snap.exists()) {
        setFriend({ id: snap.id, ...snap.data() });
      } else {
        router.push("/dashboard/chat");
      }
    };
    fetchFriend();
  }, [friendId, router]);

  // Real-time messages
  useEffect(() => {
    if (!authUser || !friendId) return;

    const roomId = [authUser.uid, friendId].sort().join("_");
    
    // Fetch messages without orderBy to avoid index requirement
    const q = query(
      collection(db, "messages"),
      where("roomId", "==", roomId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Map and sort in the client to bypass index requirement
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      msgs.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeA - timeB;
      });

      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error("Chat Listener Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authUser, friendId]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // GSAP Animation for new messages
  useGSAP(() => {
    const messages = messagesContainerRef.current?.querySelectorAll(".message-animate");
    if (messages && messages.length > 0) {
      gsap.from(messages, {
        opacity: 0,
        y: 10,
        scale: 0.95,
        duration: 0.4,
        stagger: {
          each: 0.05,
          from: "start"
        },
        ease: "power2.out",
        overwrite: "auto"
      });
    }
  }, { scope: messagesContainerRef, dependencies: [messages.length] });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !authUser || !friendId) return;

    const roomId = [authUser.uid, friendId].sort().join("_");
    const text = inputMessage;
    setInputMessage("");

    try {
      await addDoc(collection(db, "messages"), {
        roomId,
        senderId: authUser.uid,
        text,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("error sending message", err);
    }
  };

  if (!friend) return null;

  return (
    <div className="flex flex-col h-full bg-background/50">
      {/* Chat Header */}
      <header className="p-4 border-b border-glass-border flex items-center justify-between glass-card !rounded-none z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/chat")} className="md:hidden">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="w-10 h-10 bg-premium-gradient rounded-xl flex items-center justify-center text-white font-bold">
            {friend.UserName?.[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{friend.UserName}</h3>
            <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Active Now
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="glass" className="p-2 aspect-square hidden sm:flex">
            <Phone className="w-4 h-4 text-foreground/40" />
          </Button>
          <Button variant="glass" className="p-2 aspect-square hidden sm:flex">
            <Video className="w-4 h-4 text-foreground/40" />
          </Button>
          <Button variant="glass" className="p-2 aspect-square">
            <MoreVertical className="w-4 h-4 text-foreground/40" />
          </Button>
        </div>
      </header>

      {/* Messages Feed */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
      >
        {loading ? (
          <div className="h-full flex items-center justify-center">
             <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div ref={messagesContainerRef} className="space-y-4">
            {messages.map((msg) => {
              const isMe = msg.senderId === authUser?.uid;
              return (
                <div 
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"} message-animate`}
                >
                  <div className={`
                    max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl shadow-sm text-sm
                    ${isMe 
                      ? "bg-premium-gradient text-white rounded-tr-none" 
                      : "glass-card !bg-glass-100 rounded-tl-none border-glass-border"}
                  `}>
                    <p className="leading-relaxed">{msg.text}</p>
                    <span className={`text-[10px] mt-1.5 block opacity-50 ${isMe ? "text-right" : "text-left"}`}>
                      {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 md:p-6 bg-transparent">
        <form 
          onSubmit={handleSendMessage}
          className="glass-card flex items-center gap-3 p-2 focus-within:border-primary/30 transition-all"
        >
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-sm placeholder:text-foreground/40"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <button 
            type="submit"
            className="w-10 h-10 bg-premium-gradient rounded-xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            disabled={!inputMessage.trim()}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
