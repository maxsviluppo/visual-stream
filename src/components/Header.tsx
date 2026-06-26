import React from "react";
import { CreatorSettings } from "../types";
import { Lock, Sparkles, AlertCircle } from "lucide-react";

interface HeaderProps {
  settings: CreatorSettings;
  onOpenCreator: () => void;
  activeCount: number;
}

export default function Header({ settings, onOpenCreator, activeCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-35 w-full bg-[#0A0A0A]/85 backdrop-blur-2xl border-b border-white/10 px-6 py-5 flex items-center justify-between">
      {/* Brand Logo with Serif Touch and Alive Pulsar */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <p className="text-[9px] uppercase tracking-[0.25em] text-fuchsia-400 font-bold">
            EXCLUSIVE SPA
          </p>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-fuchsia-500"></span>
          </span>
        </div>
        
        <div className="mt-1">
          <h1 className="text-xl font-light tracking-wide text-white/95 uppercase">
            {settings.streamTitle} <span className="font-serif italic text-fuchsia-400 lowercase text-sm">v.01</span>
          </h1>
        </div>
      </div>

      {/* Dynamic Header Badge/CTA */}
      <div className="flex items-center gap-3">
        <span className="hidden xs:inline-flex items-center gap-1.5 text-[9px] uppercase tracking-wider bg-white/5 border border-white/10 text-white/60 px-3 py-1.5 rounded-full font-medium">
          <Sparkles className="w-3 h-3 text-fuchsia-400" />
          {activeCount} {activeCount === 1 ? "novità" : "novità"} live
        </span>

        {/* Lock/Creator Switcher Button */}
        <button
          id="enter-creator-studio-header"
          onClick={onOpenCreator}
          className="p-2 px-3 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-fuchsia-400 border border-white/10 hover:border-fuchsia-500/20 transition-all cursor-pointer flex items-center gap-1.5"
          title="Area Creator Studio"
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:inline-block">Studio</span>
        </button>
      </div>
    </header>
  );
}
