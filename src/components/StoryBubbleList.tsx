import React from "react";
import { VisualStreamPost } from "../types";
import { Play } from "lucide-react";

interface StoryBubbleListProps {
  posts: VisualStreamPost[];
  onSelectStory: (index: number) => void;
  viewedStories: string[];
}

export default function StoryBubbleList({ posts, onSelectStory, viewedStories }: StoryBubbleListProps) {
  if (posts.length === 0) return null;

  return (
    <div className="w-full py-4 border-b border-white/10 bg-white/2 backdrop-blur-md overflow-x-auto scrollbar-none flex items-center gap-4 px-6">
      {/* Visual Indicator of Live Stream */}
      <div className="flex flex-col items-center flex-shrink-0 mr-1">
        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/15 flex items-center justify-center relative">
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold">Live</span>
        </div>
        <span className="text-[10px] text-white/40 mt-1 font-medium font-sans">Stato</span>
      </div>

      {/* Stories Loop */}
      {posts.map((post, idx) => {
        const isViewed = viewedStories.includes(post.id);
        
        return (
          <button
            key={post.id}
            id={`story-bubble-${post.id}`}
            onClick={() => onSelectStory(idx)}
            className="flex flex-col items-center flex-shrink-0 focus:outline-none group relative cursor-pointer"
          >
            {/* Circle Container with Instagram/WhatsApp Gradient Border */}
            <div
              className={`w-14 h-14 rounded-full p-[2px] transition-transform duration-300 group-hover:scale-105 ${
                isViewed
                  ? "bg-white/10"
                  : "bg-gradient-to-tr from-emerald-500 via-teal-400 to-green-500"
              }`}
            >
              <div className="w-full h-full rounded-full bg-[#0A0A0A] overflow-hidden relative flex items-center justify-center border-2 border-[#0A0A0A]">
                <img
                  src={post.mediaUrl}
                  alt={post.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-300"
                />
                
                {/* Micro video badge */}
                {post.mediaType === "video" && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Play className="w-3 h-3 text-white fill-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Title Subtext */}
            <span className="text-[10px] text-white/60 mt-1 max-w-[65px] truncate font-light tracking-wide group-hover:text-white transition-colors">
              {post.title.split(" ")[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
