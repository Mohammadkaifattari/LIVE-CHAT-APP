"use client";

import React from "react";
import { GlassCard } from "./ui/GlassCard";
import { Button } from "./ui/Button";
import { UserPlus, Check, X, MessageSquare } from "lucide-react";

interface UserCardProps {
  name: string;
  email: string;
  isFriend: boolean;
  isSent: boolean;
  hasRequest: boolean;
  onAdd: () => void;
  onAccept: () => void;
  onReject: () => void;
  onMessage: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  name,
  email,
  isFriend,
  isSent,
  hasRequest,
  onAdd,
  onAccept,
  onReject,
  onMessage,
}) => {
  const initial = name?.[0]?.toUpperCase() || "?";
  
  return (
    <GlassCard className="flex flex-col gap-4 hover:border-primary/30 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-premium-gradient flex items-center justify-center text-white font-bold text-lg shadow-lg">
          {initial}
        </div>
        <div className="flex flex-col overflow-hidden">
          <h3 className="font-semibold text-lg truncate">{name}</h3>
          <p className="text-sm text-foreground/40 truncate">{email}</p>
        </div>
      </div>
      
      <div className="flex gap-2 mt-auto">
        {isFriend ? (
          <Button 
            className="w-full gap-2" 
            onClick={onMessage}
          >
            <MessageSquare className="w-4 h-4" />
            Message
          </Button>
        ) : isSent ? (
          <Button 
            variant="glass" 
            className="w-full gap-2 cursor-default opacity-70" 
            disabled
          >
            Requested
          </Button>
        ) : hasRequest ? (
          <>
            <Button 
              variant="primary" 
              className="flex-1 gap-2" 
              onClick={onAccept}
            >
              <Check className="w-4 h-4" />
              Accept
            </Button>
            <Button 
              variant="danger" 
              className="p-3 aspect-square" 
              onClick={onReject}
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <Button 
            variant="glass" 
            className="w-full gap-2 group-hover:bg-primary group-hover:text-white group-hover:border-transparent transition-all" 
            onClick={onAdd}
          >
            <UserPlus className="w-4 h-4" />
            Add Friend
          </Button>
        )}
      </div>
    </GlassCard>
  );
};
