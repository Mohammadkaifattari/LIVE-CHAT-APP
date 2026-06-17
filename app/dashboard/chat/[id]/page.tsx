"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Send, ChevronLeft, MoreVertical, Phone, Video, Sparkles } from "lucide-react";
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

  // ── Typing indicator state ──
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── AI suggestions state ──
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const aiDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const roomId =
    authUser && friendId
      ? [authUser.uid, friendId as string].sort().join("_")
      : null;

  // ── Fetch friend ──
  useEffect(() => {
    if (!friendId) return;
    getDoc(doc(db, "users", friendId as string)).then((snap) => {
      if (snap.exists()) setFriend({ id: snap.id, ...snap.data() });
      else router.push("/dashboard/chat");
    });
  }, [friendId, router]);

  // ── Real-time messages ──
  useEffect(() => {
    if (!authUser || !roomId) return;

    const q = query(
      collection(db, "chats", roomId, "messages")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .sort((a, b) => (a.timestamp?.seconds ?? 0) - (b.timestamp?.seconds ?? 0));

      setMessages(msgs);
      setLoading(false);
      // Mark friend's messages as seen
snapshot.docs.forEach(async (d) => {
  const data = d.data();
  if (data.senderId !== authUser.uid && data.seen === false) {
    await updateDoc(doc(db, "chats", roomId, "messages", d.id), { seen: true });
  }
});
    });

    return () => unsub();
  }, [authUser, roomId]);

  // ── Typing indicator listener (friend ka status) ──
  useEffect(() => {
    if (!roomId || !friendId) return;

    const typingDocRef = doc(db, "typing", roomId);

    const unsub = onSnapshot(typingDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setIsFriendTyping(data?.[friendId as string] === true);
      }
    });

    return () => unsub();
  }, [roomId, friendId]);

  // ── Set MY typing status ──
  const setTypingStatus = useCallback(
    async (isTyping: boolean) => {
      if (!roomId || !authUser) return;
      const ref = doc(db, "typing", roomId);
      try {
        await setDoc(ref, { [authUser.uid]: isTyping }, { merge: true });
      } catch {}
    },
    [roomId, authUser]
  );

  // ── Cleanup typing on unmount ──
  useEffect(() => {
    return () => {
      setTypingStatus(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
    };
  }, [setTypingStatus]);

  // ── Input change — typing indicator + AI debounce ──
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    // Typing indicator
    setTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTypingStatus(false), 2000);

    // AI suggestions debounce — 600ms pause ke baad
    // AI suggestions clear when typing
setAiSuggestions([]);
  };

 // ── Fetch AI suggestions ──
  const fetchAiSuggestions = useCallback(async () => {
    if (messages.length === 0) return;
    setAiLoading(true);

    const context = messages.slice(-5).map((m) => ({
      role: m.senderId === authUser?.uid ? "user" : "assistant",
      content: m.text,
    }));

    try {
      const res = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: context }),
      });
      const data = await res.json();
      setAiSuggestions(data.suggestions ?? []);
    } catch {
      setAiSuggestions([]);
    } finally {
      setAiLoading(false);
    }
  }, [messages, authUser]);
// ── AI suggestions — friend ka last message aane pe ──
useEffect(() => {
  if (messages.length === 0) return;
  const lastMsg = messages[messages.length - 1];
  if (lastMsg.senderId !== authUser?.uid) {
    fetchAiSuggestions();
  }
}, [messages.length]);



  // ── Scroll to bottom ──
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isFriendTyping]);

  // ── GSAP message animation ──
  useGSAP(
    () => {
      const els = messagesContainerRef.current?.querySelectorAll(".message-animate");
      if (els && els.length > 0) {
        gsap.from(els, {
          opacity: 0,
          y: 10,
          scale: 0.95,
          duration: 0.4,
          stagger: { each: 0.05, from: "start" },
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    },
    { scope: messagesContainerRef, dependencies: [messages.length] }
  );

  // ── Send message ──
  const handleSendMessage = async (e: React.FormEvent, text?: string) => {
    e.preventDefault();
    const msgText = text ?? inputMessage;
    if (!msgText.trim() || !authUser || !roomId) return;

    setInputMessage("");
    setAiSuggestions([]);
    setTypingStatus(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      await addDoc(collection(db, "chats", roomId, "messages"), {
  senderId: authUser.uid,
  text: msgText,
  seen: false,
  timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  if (!friend) return null;

  return (
    <div className="flex flex-col h-full bg-background/50 overflow-hidden">

      {/* ── Header ── */}
      <header className="sticky top-0 p-4 border-b border-glass-border flex items-center justify-between glass-card !rounded-none z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/chat")}
            className="md:hidden icon-btn p-1.5"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="relative">
            <div className="w-10 h-10 bg-premium-gradient rounded-xl flex items-center justify-center text-white font-bold">
              {friend.UserName?.[0]?.toUpperCase()}
            </div>
            <span className="status-dot online absolute -bottom-0.5 -right-0.5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{friend.UserName}</h3>
            <p className="text-[10px] text-foreground/40 font-mono">
              {isFriendTyping ? (
                <span className="text-primary animate-pulse">typing...</span>
              ) : (
                <span className="text-green-500 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse" />
                  Active Now
                </span>
              )}
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

      {/* ── Messages feed ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth"
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
                  <div
                    className={`
                      max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl shadow-sm text-sm
                      ${isMe
                        ? "bg-premium-gradient text-white rounded-tr-none"
                        : "glass-card !bg-glass-100 rounded-tl-none border-glass-border"
                      }
                    `}
                  >
                    <p className="leading-relaxed break-words">{msg.text}</p>
                    <span
  className={`text-[10px] mt-1.5 flex items-center gap-1 opacity-50 ${
    isMe ? "justify-end" : "justify-start"
  }`}
>
                      {msg.timestamp?.toDate
  ? new Date(msg.timestamp.toDate()).toLocaleTimeString(
      [],
      { hour: "2-digit", minute: "2-digit" }
    )
  : "..."}
{isMe && (
  <span className="ml-1 inline-block">
    {msg.seen ? (
      <span className="text-blue-300 text-[10px]">✓✓</span>
    ) : (
      <span className="opacity-40 text-[10px]">✓✓</span>
    )}
  </span>
)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* ── Typing indicator bubble ── */}
            {isFriendTyping && (
              <div className="flex justify-start message-animate">
                <div className="glass-card !bg-glass-100 rounded-2xl rounded-tl-none px-4 py-3 border-glass-border">
                  <div className="typing-indicator">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── AI suggestion chips ── */}
      {aiSuggestions.length > 0 && (
        <div className="px-4 pb-2 flex items-center gap-2 flex-wrap animate-fade-in-up">
          <Sparkles className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
          {aiSuggestions.map((s, i) => (
            <button
              key={i}
              onClick={(e) => handleSendMessage(e as any, s)}
              className="ai-chip"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Chat input ── */}
      <div className="p-4 bg-background/80 backdrop-blur-md border-t border-glass-border z-20">
        <form
          onSubmit={handleSendMessage}
          className="glass-card flex items-center gap-3 p-1.5 focus-within:border-primary/30 transition-all max-w-5xl mx-auto"
        >
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-sm placeholder:text-foreground/40"
            value={inputMessage}
            onChange={handleInputChange}
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