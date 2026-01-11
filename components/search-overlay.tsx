"use client";

import { useEffect, useState, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTransitionRouter } from "next-view-transitions";
import { motion } from "framer-motion";

interface SearchOverlayProps {
  onClose?: () => void;
  defaultValue?: string;
  className?: string;
}

export function SearchOverlay({
  onClose,
  defaultValue = "",
  className,
}: SearchOverlayProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useTransitionRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultValue && defaultValue !== query) {
      setQuery(defaultValue);
    }
  }, [defaultValue]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        if (onClose) onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className={`
        /* Mobile: Posicionamento normal no fluxo */
        relative w-full z-50 overflow-hidden 
        /* Desktop: Posicionamento fixo/absoluto no topo com recuo */
        sm:absolute sm:top-0 sm:left-0 sm:pl-[72px] 
        pointer-events-none 
        ${className || ""}
      `}
    >
      <motion.div
        ref={containerRef}
        className="w-full pointer-events-auto"
        initial={{ y: "-100%" }}
        animate={{ y: 0 }}
        exit={{ y: "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        <div className="relative flex items-center bg-card/80 backdrop-blur-md border-b h-16 sm:h-20 w-full px-6">
          <div className="text-muted-foreground">
            <Search className="h-5 w-5" />
          </div>
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (query.trim()) {
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                } else {
                  router.push("/search");
                }
              }
            }}
            className="flex-1 h-full border-0 focus-visible:ring-0 text-lg px-4 bg-transparent!"
            placeholder="Search for a movie..."
            autoComplete="off"
          />
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
