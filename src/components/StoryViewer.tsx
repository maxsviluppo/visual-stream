import React, { useState, useEffect, useRef } from "react";
import { VisualStreamPost, CreatorSettings } from "../types";
import { X, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StoryViewerProps {
  posts: VisualStreamPost[];
  initialIndex: number;
  onClose: () => void;
  onViewStory: (id: string) => void;
  settings: CreatorSettings;
}

export default function StoryViewer({ posts, initialIndex, onClose, onViewStory, settings }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const duration = 5000; // 5 seconds per story

  const activePost = posts[currentIndex];

  // Mark story as read whenever index changes
  useEffect(() => {
    if (activePost) {
      onViewStory(activePost.id);
    }
    setProgress(0);
    elapsedRef.current = 0;
    startTimeRef.current = Date.now();
  }, [currentIndex, activePost, onViewStory]);

  // Handle progress bar animation loop
  useEffect(() => {
    let animationFrameId: number;

    const updateProgress = () => {
      if (!isPaused) {
        const now = Date.now();
        const timePassed = elapsedRef.current + (now - startTimeRef.current);
        const currentProgress = Math.min((timePassed / duration) * 100, 100);
        setProgress(currentProgress);

        if (currentProgress >= 100) {
          handleNext();
        } else {
          animationFrameId = requestAnimationFrame(updateProgress);
        }
      }
    };

    if (!isPaused) {
      startTimeRef.current = Date.now();
      animationFrameId = requestAnimationFrame(updateProgress);
    } else {
      elapsedRef.current += Date.now() - startTimeRef.current;
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentIndex, isPaused]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      // Loop back to end or reset progress
      setProgress(0);
      elapsedRef.current = 0;
      startTimeRef.current = Date.now();
    }
  };

  const handleNext = () => {
    if (currentIndex < posts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose(); // Close story when last post completed
    }
  };

  const handlePressStart = () => {
    setIsPaused(true);
  };

  const handlePressEnd = () => {
    setIsPaused(false);
  };

  const handleCtaClick = async (e: React.MouseEvent, post: VisualStreamPost) => {
    e.stopPropagation(); // Don't trigger stories pause/skip
    
    // Register click in backend
    try {
      await fetch(`/api/posts/${post.id}/click`, { method: "POST" });
    } catch (err) {
      console.error("Error registering click:", err);
    }

    // Build WhatsApp URL
    const formattedPhone = settings.whatsappNumber.replace(/\D/g, "");
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(post.whatsappMessage || "")}`;
    window.open(waUrl, "_blank");
  };

  if (!activePost) return null;

  return (
    <AnimatePresence>
      <div 
        id="story-viewer-overlay"
        className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none md:p-4"
      >
        {/* Desktop close button on outer frame */}
        <button
          id="desktop-story-close"
          onClick={onClose}
          className="hidden md:flex absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors bg-zinc-900/40 hover:bg-zinc-900/80 p-3 rounded-full border border-zinc-800 backdrop-blur-md cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Stories Inner Card Frame (looks like mobile viewport on desktop) */}
        <div 
          className="w-full h-full max-w-lg md:h-[85vh] md:rounded-3xl overflow-hidden bg-[#0A0A0A] relative flex flex-col justify-between border border-white/10 shadow-2xl"
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
        >
          {/* Top Story Timeline Progress Bars */}
          <div className="absolute top-4 left-4 right-4 z-30 flex gap-1.5 px-1 py-1 bg-gradient-to-b from-black/80 to-transparent">
            {posts.map((post, idx) => {
              let fillWidth = 0;
              if (idx < currentIndex) fillWidth = 100;
              if (idx === currentIndex) fillWidth = progress;
              
              return (
                <div key={post.id} className="h-[3px] flex-1 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-75 ease-linear"
                    style={{ width: `${fillWidth}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Story Top Info Panel (User Avatar + Time) */}
          <div className="absolute top-8 left-4 right-4 z-30 flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 p-[2px] overflow-hidden">
                <img 
                  src={activePost.mediaUrl} 
                  alt={activePost.title} 
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white tracking-wide drop-shadow">{settings.streamTitle}</h4>
                <p className="text-[10px] text-white/60 drop-shadow-sm font-mono">
                  {new Date(activePost.createdAt).toLocaleDateString("it-IT", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>
            </div>

            {/* Close button on mobile */}
            <button 
              id="mobile-story-close"
              onClick={onClose}
              className="md:hidden text-white/80 hover:text-white p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Story Media */}
          <div className="w-full h-full absolute inset-0 z-10 flex items-center justify-center bg-black">
            {activePost.mediaType === "video" ? (
              <video
                src={activePost.mediaUrl}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={activePost.mediaUrl}
                alt={activePost.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Highly Visible Custom Text Overlay */}
            {activePost.overlayText && (
              <div 
                style={{
                  left: `${activePost.overlayX !== undefined ? activePost.overlayX : 50}%`,
                  top: `${activePost.overlayY !== undefined ? activePost.overlayY : 20}%`,
                }}
                className="absolute z-20 pointer-events-none text-left -translate-x-1/2 -translate-y-1/2 max-w-[85%]"
              >
                <span className="inline-block bg-zinc-950/85 backdrop-blur-sm border border-white/25 text-white font-black uppercase tracking-wider text-[11px] px-3 py-1.5 rounded-lg shadow-2xl drop-shadow-lg break-words">
                  {activePost.overlayText}
                </span>
              </div>
            )}

            {/* Visual bottom darkening shade for text readability */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/60 to-transparent z-10 pointer-events-none" />
          </div>

          {/* Interactive Tap Zones (Invisible overlay on left/right to navigate) */}
          <div className="absolute inset-0 z-20 flex pointer-events-none">
            {/* Left Tap */}
            <div 
              id="tap-left-story"
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="w-[30%] h-full pointer-events-auto cursor-pointer" 
            />
            {/* Middle Swipe/Pause */}
            <div className="w-[40%] h-full" />
            {/* Right Tap */}
            <div 
              id="tap-right-story"
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="w-[30%] h-full pointer-events-auto cursor-pointer" 
            />
          </div>

          {/* Story Details & CTA Panel */}
          <div className="relative z-30 p-6 mt-auto bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent pt-24 text-center md:rounded-b-3xl">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {activePost.tags && activePost.tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {activePost.tags.map(t => (
                    <span key={t} className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-white/5 text-emerald-400 border border-white/10">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <h3 className="text-2xl font-medium text-white tracking-wide">{activePost.title}</h3>
              
              {activePost.price && (
                <p className="text-2xl font-bold text-emerald-400 font-mono tracking-wide">{activePost.price}</p>
              )}
              
              <p className="text-xs text-white/75 max-w-sm mx-auto leading-relaxed line-clamp-3 font-light">
                {activePost.description}
              </p>

              {/* Expiring timer warning */}
              {activePost.expiresAt && (
                <div className="inline-flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                  Offerta Limitata
                </div>
              )}

              {/* Huge WhatsApp CTA Button - Immersive UI rounded-full styling */}
              <button
                id={`story-cta-${activePost.id}`}
                onClick={(e) => handleCtaClick(e, activePost)}
                className="w-full max-w-sm mt-4 py-4 px-6 rounded-full bg-emerald-500 text-black font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/15 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer pointer-events-auto"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{activePost.ctaText || "Ordina su WhatsApp"}</span>
              </button>
            </motion.div>
          </div>
        </div>

        {/* Desktop navigation side controls */}
        <div className="hidden md:flex absolute inset-x-12 z-20 justify-between pointer-events-none">
          <button
            id="desktop-story-prev"
            disabled={currentIndex === 0}
            onClick={handlePrev}
            className="pointer-events-auto p-3 rounded-full bg-zinc-900/40 hover:bg-zinc-900/80 text-white disabled:opacity-30 disabled:pointer-events-none transition-colors border border-zinc-800/50 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            id="desktop-story-next"
            onClick={handleNext}
            className="pointer-events-auto p-3 rounded-full bg-zinc-900/40 hover:bg-zinc-900/80 text-white transition-colors border border-zinc-800/50 cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </AnimatePresence>
  );
}
