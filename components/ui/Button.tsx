"use client";

import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "glass" | "danger";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  isLoading,
  ...props
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  const variants = {
    primary: "premium-button",
    secondary: "bg-secondary hover:bg-secondary-dark text-white rounded-xl py-3 px-6",
    glass: "glass-card hover:bg-glass-200 text-foreground py-3 px-6",
    danger: "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 rounded-xl py-3 px-6",
  };

  return (
    <button
      ref={btnRef}
      className={cn(
        "relative flex items-center justify-center transition-all duration-300 font-medium disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Processing...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};
