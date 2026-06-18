"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  query,
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
import { Send, ChevronLeft, MoreVertical, Phone, Video, Sparkles, ImagePlus, X, Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useSidebar } from "@/context/SidebarContext";

const EMOJI_LIST = ["❤️", "😂", "😮", "😢", "👍", "🔥"];
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

export default function PrivateChatPage() {
  const { id: friendId } = useParams();
  const { user: authUser } = useAuth();
  const { setDrawerOpen } = useSidebar();

  const [friend, setFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const roomId =
    authUser && friendId
      ? [authUser.uid, friendId as string].sort().join("_")
      : null;

  // ── Presence ──
  useEffect(() => {
    if (!friendId) return;
    const unsub = onSnapshot(doc(db, "presence", friendId as string), (snap) => {
      setIsOnline(snap.data()?.online === true);
    });
    return () => unsub();
  }, [friendId]);

  // ── Fetch friend data ──
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
    const q = query(collection(db, "chats", roomId, "messages"));
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .sort((a, b) => (a.timestamp?.seconds ?? 0) - (b.timestamp?.seconds ?? 0));
      setMessages(msgs);
      setLoading(false);
      snapshot.docs.forEach(async (d) => {
        const data = d.data();
        if (data.senderId !== authUser.uid && data.seen === false) {
          await updateDoc(doc(db, "chats", roomId, "messages", d.id), { seen: true });
        }
      });
    });
    return () => unsub();
  }, [authUser, roomId]);

  // ── Typing listener ──
  useEffect(() => {
    if (!roomId || !friendId) return;
    const unsub = onSnapshot(doc(db, "typing", roomId), (snap) => {
      if (snap.exists()) setIsFriendTyping(snap.data()?.[friendId as string] === true);
    });
    return () => unsub();
  }, [roomId, friendId]);

  // ── Set typing ──
  const setTypingStatus = useCallback(async (isTyping: boolean) => {
    if (!roomId || !authUser) return;
    try {
      await setDoc(doc(db, "typing", roomId), { [authUser.uid]: isTyping }, { merge: true });
    } catch {}
  }, [roomId, authUser]);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      setTypingStatus(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
    };
  }, [setTypingStatus]);

  // ── AI suggestions ──
  const fetchAiSuggestions = useCallback(async () => {
    if (messages.length === 0) return;
    const context = messages.slice(-5).map((m) => ({
      role: m.senderId === authUser?.uid ? "user" : "assistant",
      content: m.text ?? "[image]",
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
    }
  }, [messages, authUser]);

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.senderId !== authUser?.uid) {
      const timer = setTimeout(() => fetchAiSuggestions(), 0);
      return () => clearTimeout(timer);
    }
  }, [messages.length, fetchAiSuggestions]);

  // ── Scroll ──
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isFriendTyping]);

  // ── GSAP ──
  useGSAP(
    () => {
      const els = messagesContainerRef.current?.querySelectorAll(".message-animate");
      if (els?.length) {
        gsap.from(els, { opacity: 0, y: 10, scale: 0.95, duration: 0.4, stagger: { each: 0.05 }, ease: "power2.out", overwrite: "auto" });
      }
    },
    { scope: messagesContainerRef, dependencies: [messages.length] }
  );

  // ── Image select ──
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Upload to Cloudinary ──
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data.secure_url;
  };

  // ── Send message ──
  const handleSendMessage = async (e: React.FormEvent, text?: string) => {
    e.preventDefault();
    if (!authUser || !roomId) return;

    if (imageFile) {
      setUploading(true);
      try {
        const imageUrl = await uploadImage(imageFile);
        await addDoc(collection(db, "chats", roomId, "messages"), {
          senderId: authUser.uid,
          text: "",
          imageUrl,
          seen: false,
          reactions: {},
          timestamp: serverTimestamp(),
        });
        setImageFile(null);
        setImagePreview(null);
      } catch (err) {
        console.error("Image upload error:", err);
      } finally {
        setUploading(false);
      }
      return;
    }

    const msgText = text ?? inputMessage;
    if (!msgText.trim()) return;
    setInputMessage("");
    setAiSuggestions([]);
    setTypingStatus(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    try {
      await addDoc(collection(db, "chats", roomId, "messages"), {
        senderId: authUser.uid,
        text: msgText,
        seen: false,
        reactions: {},
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  // ── Reaction ──
  const handleReaction = async (msgId: string, emoji: string) => {
    if (!authUser || !roomId) return;
    const msgRef = doc(db, "chats", roomId, "messages", msgId);
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;
    const reactions = { ...(msg.reactions ?? {}) };
    if (reactions[authUser.uid] === emoji) {
      delete reactions[authUser.uid];
    } else {
      reactions[authUser.uid] = emoji;
    }
    await updateDoc(msgRef, { reactions });
    setHoveredMsg(null);
  };

  // ── Input change ──
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    setTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTypingStatus(false), 2000);
    setAiSuggestions([]);
  };

  if (!friend) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background/50 overflow-hidden">

      {/* Header */}
      <header className="sticky top-0 p-4 border-b border-glass-border flex items-center justify-between glass-card !rounded-none z-30">
        <div className="flex items-center gap-3">

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden icon-btn p-1.5"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Back button */}
          <button
            onClick={() => router.push("/dashboard/chat")}
            className="icon-btn p-1.5"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Avatar */}
          <div className="relative">
            <div className="w-10 h-10 bg-premium-gradient rounded-xl flex items-center justify-center text-white font-bold">
              {friend.UserName?.[0]?.toUpperCase()}
            </div>
            <span className={`status-dot ${isOnline ? "online" : "offline"} absolute -bottom-0.5 -right-0.5`} />
          </div>

          {/* Name & status */}
          <div>
            <h3 className="font-semibold text-lg">{friend.UserName}</h3>
            <p className="text-[10px] text-foreground/40 font-mono">
              {isFriendTyping ? (
                <span className="text-primary animate-pulse">typing...</span>
              ) : isOnline ? (
                <span className="text-green-500 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse" />
                  Active Now
                </span>
              ) : (
                <span className="text-white/30 uppercase tracking-widest">Offline</span>
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

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div ref={messagesContainerRef} className="space-y-4">
            {messages.map((msg) => {
              const isMe = msg.senderId === authUser?.uid;
              const reactions = msg.reactions ?? {};
              const reactionSummary: Record<string, number> = {};
              Object.values(reactions).forEach((e: any) => {
                reactionSummary[e] = (reactionSummary[e] ?? 0) + 1;
              });
              const myReaction = reactions[authUser?.uid ?? ""];

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"} message-animate`}
                  onMouseEnter={() => setHoveredMsg(msg.id)}
                  onMouseLeave={() => setHoveredMsg(null)}
                  onTouchStart={() => setHoveredMsg(hoveredMsg === msg.id ? null : msg.id)}
                >
                  <div className="relative group max-w-[85%] md:max-w-[70%]">

                    {/* Emoji picker */}
                    {hoveredMsg === msg.id && (
                      <div className={`absolute ${isMe ? "right-0" : "left-0"} -top-10 z-[100] flex items-center gap-1 px-2 py-1.5 rounded-full bg-[#1a1a2e] border border-white/10 shadow-xl`}>
                        {EMOJI_LIST.map((emoji) => (
                          <button
                            key={emoji}
                            onTouchStart={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, emoji); }}
                            className={`text-base hover:scale-125 transition-transform ${myReaction === emoji ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`w-full rounded-2xl shadow-sm text-sm overflow-hidden ${
                      isMe
                        ? "bg-premium-gradient text-white rounded-tr-none"
                        : "glass-card !bg-glass-100 rounded-tl-none border-glass-border"
                    }`}>
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="shared"
                          className="max-w-[240px] max-h-[300px] object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(msg.imageUrl, "_blank")}
                        />
                      )}
                      {msg.text && (
                        <div className="px-4 py-3">
                          <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      )}
                      <div className={`px-4 pb-2 text-[10px] flex items-center gap-1 opacity-50 ${isMe ? "justify-end" : "justify-start"}`}>
                        {msg.timestamp?.toDate
                          ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "..."}
                        {isMe && (
                          <span className="ml-1">
                            {msg.seen
                              ? <span className="text-blue-300 text-[10px]">✓✓</span>
                              : <span className="opacity-40 text-[10px]">✓✓</span>
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Reaction pills */}
                    {Object.keys(reactionSummary).length > 0 && (
                      <div className={`flex gap-1 mt-1 flex-wrap ${isMe ? "justify-end" : "justify-start"}`}>
                        {Object.entries(reactionSummary).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onTouchStart={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, emoji); }}
                            className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                              myReaction === emoji
                                ? "bg-violet-500/20 border-violet-500/40 text-white"
                                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                            }`}
                          >
                            {emoji} {count > 1 ? count : ""}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing bubble */}
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

      {/* AI chips */}
      {aiSuggestions.length > 0 && (
        <div className="px-4 pb-2 flex items-center gap-2 flex-wrap animate-fade-in-up">
          <Sparkles className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
          {aiSuggestions.map((s, i) => (
            <button key={i} onClick={(e) => handleSendMessage(e as any, s)} className="ai-chip">{s}</button>
          ))}
        </div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className="px-4 pb-2 flex items-center gap-3">
          <div className="relative">
            <img src={imagePreview} alt="preview" className="h-16 w-16 object-cover rounded-xl border border-white/10" />
            <button
              onClick={() => { setImagePreview(null); setImageFile(null); }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
          <span className="text-xs text-white/40">Ready to send</span>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-background/80 backdrop-blur-md border-t border-glass-border z-20">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />
        <form
          onSubmit={handleSendMessage}
          className="glass-card flex items-center gap-3 p-1.5 focus-within:border-primary/30 transition-all max-w-5xl mx-auto"
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/5 transition-all flex-shrink-0"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-sm placeholder:text-foreground/40"
            value={inputMessage}
            onChange={handleInputChange}
            disabled={!!imageFile}
          />
          <button
            type="submit"
            disabled={(!inputMessage.trim() && !imageFile) || uploading}
            className="w-10 h-10 bg-premium-gradient rounded-xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}