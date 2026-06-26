import React, { useState, useEffect } from "react";
import { VisualStreamPost, CreatorSettings } from "../types";
import { ShoppingBag, Share2, Check, Clock, Eye } from "lucide-react";

interface PostCardProps {
  post: VisualStreamPost;
  settings: CreatorSettings;
  key?: string;
}

export default function PostCard({ post, settings }: PostCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isCloseToExpiring, setIsCloseToExpiring] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Expiration countdown effect
  useEffect(() => {
    if (!post.expiresAt) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(post.expiresAt!).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft("Iniziativa Terminata");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      // Mark as close to expiring if less than 24 hours remain
      if (difference < 1000 * 60 * 60 * 24) {
        setIsCloseToExpiring(true);
      }

      let timeString = "";
      if (days > 0) {
        timeString += `${days}g `;
      }
      timeString += `${hours.toString().padStart(2, "0")}o:${minutes.toString().padStart(2, "0")}m:${seconds.toString().padStart(2, "0")}s`;
      setTimeLeft(timeString);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [post.expiresAt]);

  const handleCtaClick = async () => {
    if (isExpired) return;

    // Track click
    try {
      await fetch(`/api/posts/${post.id}/click`, { method: "POST" });
    } catch (err) {
      console.error("Error registering click:", err);
    }

    // Build WA URL
    const formattedPhone = settings.whatsappNumber.replace(/\D/g, "");
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(post.whatsappMessage || "")}`;
    window.open(waUrl, "_blank");
  };

  const handleShareClick = () => {
    const textToCopy = `Guarda questo fantastico articolo su *${settings.streamTitle}*:
🛍️ *${post.title}* ${post.price ? `(${post.price})` : ''}
💬 ${post.description}
Scopri di più qui: ${window.location.origin}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      id={`post-card-${post.id}`}
      className={`relative w-full rounded-[28px] border backdrop-blur-md overflow-hidden transition-all duration-300 ${
        isExpired
          ? "border-white/5 bg-white/2 opacity-50"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:shadow-2xl hover:shadow-emerald-500/10"
      }`}
    >
      {/* Expiration Timer Banner */}
      {post.expiresAt && (
        <div
          className={`absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider font-mono shadow-md backdrop-blur-md border ${
            isExpired
              ? "bg-black/90 text-white/30 border-white/5"
              : isCloseToExpiring
              ? "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse"
              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{timeLeft}</span>
        </div>
      )}

      {/* Share / Copy Button */}
      <button
        id={`share-btn-${post.id}`}
        onClick={handleShareClick}
        className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/70 border border-white/10 text-white/70 hover:text-white hover:bg-black/90 transition-colors shadow-md backdrop-blur-sm cursor-pointer"
        title="Copia link promozionale"
      >
        {copied ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : (
          <Share2 className="w-4 h-4" />
        )}
      </button>

      {/* Media Content - Full Width Container */}
      <div className="w-full aspect-[4/3] bg-[#111] relative overflow-hidden group">
        {post.mediaType === "video" ? (
          <video
            src={post.mediaUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <img
            src={post.mediaUrl}
            alt={post.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        )}
        
        {/* Highly Visible Custom Text Overlay */}
        {post.overlayText && (
          <div 
            style={{
              left: `${post.overlayX !== undefined ? post.overlayX : 50}%`,
              top: `${post.overlayY !== undefined ? post.overlayY : 20}%`,
            }}
            className="absolute z-20 pointer-events-none text-left -translate-x-1/2 -translate-y-1/2 max-w-[85%]"
          >
            <span className="inline-block bg-zinc-950/85 backdrop-blur-sm border border-white/25 text-white font-black uppercase tracking-wider text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg shadow-2xl drop-shadow-lg break-words">
              {post.overlayText}
            </span>
          </div>
        )}
        
        {/* Subtle Dark Bottom Gradient Mask */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Post Info & Detail Container */}
      <div className="p-6 space-y-5">
        {/* Tags, Views & Price Line */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {post.tags &&
              post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] uppercase font-mono tracking-widest px-2.5 py-1 rounded-full bg-white/5 text-emerald-400 border border-white/10"
                >
                  {tag}
                </span>
              ))}
          </div>
          {post.price && (
            <span className="text-xl font-bold font-mono text-emerald-400 tracking-tight">
              {post.price}
            </span>
          )}
        </div>

        {/* Title and Description */}
        <div className="space-y-2">
          <h3 className="text-xl font-medium text-white tracking-wide leading-snug">
            {post.title}
          </h3>
          <p className="text-xs text-white/60 leading-relaxed font-light">
            {post.description}
          </p>
        </div>

        {/* CTA Button - Rounded Full Premium Immersive look */}
        <button
          id={`cta-btn-${post.id}`}
          onClick={handleCtaClick}
          disabled={isExpired}
          className={`w-full py-4 px-6 rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all cursor-pointer ${
            isExpired
              ? "bg-white/5 text-white/25 border border-white/10 cursor-not-allowed"
              : "bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold shadow-lg shadow-emerald-500/10 hover:scale-[1.02] active:scale-95"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{isExpired ? "Iniziativa Conclusa" : (post.ctaText || "Ordina su WhatsApp")}</span>
        </button>
      </div>
    </div>
  );
}
