import React, { useState, useEffect, useRef } from "react";
import { VisualStreamPost, CreatorSettings } from "./types";
import CreatorStudio from "./components/CreatorStudio";
import { getPostDefaultName } from "./utils";
import { 
  AlertCircle, RefreshCw, Sparkles, Lock, 
  Check, ChevronDown, ChevronUp, VolumeX, Volume2, Calendar, 
  Users, Phone, User, X, Power, LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const DEFAULT_SETTINGS: CreatorSettings = {
  whatsappNumber: "393331234567",
  streamTitle: "Visual Stream",
  streamSubtitle: "Le migliori scoperte e novità esclusive selezionate questa settimana in anteprima assoluta.",
  notificationEmail: "castromassimo@gmail.com"
};

export default function App() {
  const [posts, setPosts] = useState<VisualStreamPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // UI States
  const [isCreatorOpen, setIsCreatorOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [direction, setDirection] = useState<number>(0); // -1 for next/downwards scroll, 1 for previous/upwards scroll

  // Booking Modal States
  const [bookingPost, setBookingPost] = useState<VisualStreamPost | null>(null);
  const [bookingDate, setBookingDate] = useState<string>("");
  const [bookingName, setBookingName] = useState<string>("");
  const [bookingGuests, setBookingGuests] = useState<number>(1);
  const [bookingPhone, setBookingPhone] = useState<string>("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string>("");

  // References to video players
  const containerRef = useRef<HTMLDivElement>(null);

  // Settings State - Load from LocalStorage or default
  const [settings, setSettings] = useState<CreatorSettings>(() => {
    const saved = localStorage.getItem("visual_stream_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved settings", e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Fetch active unexpired posts from the server
  const fetchPosts = async () => {
    setLoading(true);
    setError("");
    try {
      // Parallelly fetch settings from server
      const settingsRes = await fetch("/api/settings");
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
        localStorage.setItem("visual_stream_settings", JSON.stringify(settingsData));
      }

      const res = await fetch("/api/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        setError("Impossibile caricare il flusso. Riprova più tardi.");
      }
    } catch (err) {
      console.error(err);
      setError("Errore di connessione con il server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Track last wheel trigger time to prevent ultra-fast scrolling
  const lastWheelTime = useRef<number>(0);

  // Wheel scroll handler (trackpad/scrollwheel)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (isCreatorOpen || bookingPost) return; // Ignore if overlay/modals are open
    
    const now = Date.now();
    if (now - lastWheelTime.current < 600) return; // 600ms debounce

    if (e.deltaY > 20) {
      // Scroll Down -> Next Post
      if (activeSlideIndex < posts.length - 1) {
        setDirection(-1);
        setActiveSlideIndex(prev => prev + 1);
        lastWheelTime.current = now;
      }
    } else if (e.deltaY < -20) {
      // Scroll Up -> Previous Post
      if (activeSlideIndex > 0) {
        setDirection(1);
        setActiveSlideIndex(prev => prev - 1);
        lastWheelTime.current = now;
      }
    }
  };

  // Keyboard navigation handler (ArrowUp/ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCreatorOpen || bookingPost) return;
      
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        if (activeSlideIndex < posts.length - 1) {
          setDirection(-1);
          setActiveSlideIndex(prev => prev + 1);
        }
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        if (activeSlideIndex > 0) {
          setDirection(1);
          setActiveSlideIndex(prev => prev - 1);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSlideIndex, posts.length, isCreatorOpen, bookingPost]);

  // Handle Video Autoplay after slide transition finishes
  useEffect(() => {
    const videos = document.querySelectorAll("video");
    videos.forEach((video) => {
      video.play().catch(err => console.log("Autoplay blocked by browser policy:", err));
    });
  }, [activeSlideIndex, posts]);

  // Save Settings handler
  const handleSaveSettings = async (newSettings: CreatorSettings) => {
    setSettings(newSettings);
    localStorage.setItem("visual_stream_settings", JSON.stringify(newSettings));
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings)
      });
    } catch (e) {
      console.error("Failed to save settings on server:", e);
    }
  };

  // Open booking modal
  const openBookingModal = (e: React.MouseEvent, post: VisualStreamPost) => {
    e.stopPropagation(); // Avoid double click triggers
    setBookingPost(post);
    setBookingDate("");
    setBookingName("");
    setBookingGuests(1);
    setBookingPhone("");
    setBookingSuccess(false);
    setBookingError("");
  };

  // Close booking modal
  const closeBookingModal = () => {
    setBookingPost(null);
  };

  // Submit booking reservation to server (which auto-emails)
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingPost) return;
    if (!bookingDate || !bookingName || !bookingPhone) {
      setBookingError("Tutti i campi sono obbligatori.");
      return;
    }

    setIsSubmittingBooking(true);
    setBookingError("");
    try {
      // Send CTA click count as well
      try {
        await fetch(`/api/posts/${bookingPost.id}/click`, { method: "POST" });
      } catch (err) {
        console.error("Error registering click:", err);
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: bookingPost.id,
          date: bookingDate,
          name: bookingName,
          guests: bookingGuests,
          phone: bookingPhone
        })
      });

      if (res.ok) {
        setBookingSuccess(true);
      } else {
        const data = await res.json();
        setBookingError(data.error || "Errore nella prenotazione. Riprova.");
      }
    } catch (err) {
      console.error(err);
      setBookingError("Errore di connessione. Controlla la rete.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-black text-[#F5F5F5] font-sans overflow-hidden select-none relative flex flex-col items-center justify-center">
      
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-fuchsia-950/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-950/20 rounded-full blur-[100px] pointer-events-none" />

      {/* FIXED IMMERSIVE HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 w-full max-w-xl mx-auto px-6 py-5 flex items-center justify-between pointer-events-none bg-gradient-to-b from-black/90 via-black/40 to-transparent">
        <div className="pointer-events-auto flex items-center gap-3">
          {/* Admin Studio button to unlock Creator Portal - NOW ON THE TOP LEFT BEFORE THE LOGOTITLE */}
          <button
            id="open-studio-immersive"
            onClick={() => setIsCreatorOpen(true)}
            className="p-2 rounded-full bg-fuchsia-500 hover:bg-fuchsia-400 text-black border border-fuchsia-500/20 transition-all cursor-pointer shadow-lg shadow-fuchsia-500/10 flex items-center justify-center shrink-0"
            title="Area Creator Studio"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-fuchsia-400 font-bold">
                EXCLUSIVE SPA
              </p>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-fuchsia-500"></span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Mute toggle for videos */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white/80 transition-all cursor-pointer"
            title={isMuted ? "Attiva audio" : "Disattiva audio"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-fuchsia-400" />}
          </button>

          {/* Close App Button - NOW ON THE TOP RIGHT */}
          <button
            id="close-app-button"
            onClick={() => setIsClosed(true)}
            className="p-2.5 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white border border-rose-500/20 transition-all cursor-pointer shadow-lg shadow-rose-500/10 flex items-center justify-center"
            title="Chiudi App"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* CORE MOBILE CONTAINER FRAME */}
      <div className="w-full max-w-xl h-full bg-[#030303] flex flex-col relative z-10 border-x border-white/5 shadow-2xl">
        
        {isClosed ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 bg-zinc-950 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 animate-pulse">
              <Power className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-light tracking-widest text-white uppercase">Vetrina Chiusa</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Hai chiuso la sessione della vetrina. Puoi riaprirla in qualsiasi momento cliccando sul pulsante qui sotto.
              </p>
            </div>
            <button
              id="reopen-app-button"
              onClick={() => setIsClosed(false)}
              className="py-3.5 px-6 rounded-full bg-fuchsia-500 hover:bg-fuchsia-400 text-black text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-fuchsia-500/15"
            >
              Riapri Vetrina
            </button>
          </div>
        ) : loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-10 h-10 text-fuchsia-500 animate-spin" />
            <p className="text-xs text-white/55 font-medium tracking-widest uppercase">Caricamento vetrina...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-rose-500" />
            <p className="text-sm text-white/70 max-w-xs">{error}</p>
            <button
              id="refresh-feed-err"
              onClick={fetchPosts}
              className="py-2.5 px-6 bg-white/5 border border-white/15 hover:bg-white/10 text-xs rounded-full font-bold uppercase tracking-wider transition-colors"
            >
              Riprova
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-fuchsia-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-light tracking-wide text-white uppercase">Arrivano a breve</h3>
              <p className="text-xs text-white/50 max-w-xs mx-auto leading-relaxed">
                Stiamo preparando i nuovi fantastici contenuti. Torna a trovarci presto!
              </p>

            </div>
            <button
              id="empty-state-open-studio"
              onClick={() => setIsCreatorOpen(true)}
              className="py-3.5 px-6 rounded-full bg-fuchsia-500 hover:bg-fuchsia-400 text-black text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-fuchsia-500/15"
            >
              Apri Studio & Aggiungi Post
            </button>
          </div>
        ) : (
          /* VERTICAL SWIPE SELECTION CONTAINER POWERED BY FRAMER MOTION */
          <div 
            onWheel={handleWheel}
            className="flex-1 relative overflow-hidden h-full w-full select-none overscroll-contain touch-none"
          >
            <AnimatePresence initial={false} custom={direction}>
              {posts[activeSlideIndex] && (
                <motion.div 
                  key={posts[activeSlideIndex].id}
                  custom={direction}
                  variants={{
                    enter: (dir: number) => ({
                      y: dir === -1 ? "100%" : "-100%",
                      opacity: 0,
                    }),
                    center: {
                      y: 0,
                      opacity: 1,
                    },
                    exit: (dir: number) => ({
                      y: dir === -1 ? "-100%" : "100%",
                      opacity: 0,
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    y: { type: "spring", stiffness: 300, damping: 32 },
                    opacity: { duration: 0.25 }
                  }}
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.4}
                  onDragEnd={(event, info) => {
                    const swipeThreshold = 50;
                    if (info.offset.y < -swipeThreshold) {
                      // Drag up -> Next post
                      if (activeSlideIndex < posts.length - 1) {
                        setDirection(-1);
                        setActiveSlideIndex(prev => prev + 1);
                      }
                    } else if (info.offset.y > swipeThreshold) {
                      // Drag down -> Previous post
                      if (activeSlideIndex > 0) {
                        setDirection(1);
                        setActiveSlideIndex(prev => prev - 1);
                      }
                    }
                  }}
                  onTap={(e) => openBookingModal(e as any, posts[activeSlideIndex])}
                  className="absolute inset-0 w-full h-full flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing"
                >
                  {/* FULLSCREEN BACKGROUND 9:16 PORTRAIT MEDIA */}
                  <div className="absolute inset-0 z-0 bg-[#090909]">
                    {posts[activeSlideIndex].mediaType === "video" ? (
                      <video
                        src={posts[activeSlideIndex].mediaUrl}
                        className="w-full h-full object-cover"
                        loop
                        muted={isMuted}
                        playsInline
                        autoPlay
                      />
                    ) : (
                      <img
                        src={posts[activeSlideIndex].mediaUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    {/* Seamless Dark Shadow Overlays */}
                    <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/90 via-black/40 to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-0 bg-black/10 z-10 pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-t from-black/70 to-transparent z-10 pointer-events-none" />
                  </div>

                  {/* Empty Spacer */}
                  <div className="h-28" />

                  {/* BOTTOM FLOATING META & ACTION OVERLAYS */}
                  <div className="relative z-20 px-6 pb-4 mt-auto space-y-3">
                    
                    {/* Index Indicator Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[9px] uppercase font-bold tracking-widest px-3 py-1 bg-black/50 backdrop-blur-md text-fuchsia-400 border border-fuchsia-500/20 rounded-full">
                          {activeSlideIndex + 1} di {posts.length}
                        </span>
                      </div>
                    </div>

                    {/* Booking Prompt Information bar */}
                    <div className="pointer-events-auto w-[85%] mx-auto" onClick={(e) => e.stopPropagation()}>
                      {/* Text reservation button (no icon) */}
                      <div className="relative w-full">
                        <div className="absolute inset-0 rounded-full bg-fuchsia-500/25 blur-md animate-pulse"></div>
                        <button
                          onClick={(e) => openBookingModal(e, posts[activeSlideIndex])}
                          className="relative w-full py-2.5 rounded-full bg-fuchsia-500 text-black text-[10px] font-extrabold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xl flex items-center justify-center"
                          title="Prenota ora"
                        >
                          Prenota Ora
                        </button>
                      </div>
                    </div>

                    {/* Subtle scrolling help prompt (only if there is another slide) */}
                    {activeSlideIndex < posts.length - 1 && (
                      <div className="flex justify-center pt-2">
                        <div className="flex flex-col items-center gap-1 animate-bounce opacity-40">
                          <span className="text-[8px] uppercase tracking-[0.2em] font-medium font-mono text-white/60">Trascina o scorri verso l'alto</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

            {/* Desktop Navigation Helper Buttons - subtle chevrons */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-30 pointer-events-none hidden lg:flex">
              {activeSlideIndex > 0 && (
                <button
                  onClick={() => {
                    setDirection(1);
                    setActiveSlideIndex(prev => prev - 1);
                  }}
                  className="pointer-events-auto p-2 rounded-full bg-black/40 hover:bg-black/70 border border-white/10 text-white hover:scale-105 transition-all shadow-md cursor-pointer flex items-center justify-center"
                  title="Video precedente"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              )}
              {activeSlideIndex < posts.length - 1 && (
                <button
                  onClick={() => {
                    setDirection(-1);
                    setActiveSlideIndex(prev => prev + 1);
                  }}
                  className="pointer-events-auto p-2 rounded-full bg-black/40 hover:bg-black/70 border border-white/10 text-white hover:scale-105 transition-all shadow-md cursor-pointer flex items-center justify-center"
                  title="Prossimo video"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODALE VELOCE PRENOTAZIONE (GORGEOUS OVERLAY MODAL FOR SPEEDY BOOKING) */}
      {bookingPost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center px-4 sm:px-0">
          
          {/* Modal content container */}
          <div className="w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-t-[32px] overflow-hidden p-6 pb-8 space-y-6 animate-slide-up relative">
            
            {/* Close Button */}
            <button
              onClick={closeBookingModal}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header info */}
            <div className="text-center space-y-1.5 pt-2">
              <div className="w-12 h-12 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 mx-auto mb-2">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Mi prenoto per</h3>
              <p className="text-xs text-white/60 truncate max-w-xs mx-auto font-medium text-fuchsia-400">
                {getPostDefaultName(bookingPost, posts)}
              </p>
            </div>

            {bookingSuccess ? (
              /* Booking Success State */
              <div className="text-center py-6 space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/40 flex items-center justify-center mx-auto text-fuchsia-400">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">Richiesta Inviata!</h4>
                  <p className="text-xs text-white/60 leading-relaxed max-w-xs mx-auto">
                    La tua richiesta di prenotazione è stata registrata con successo! L'organizzatore ti contatterà al più presto.
                  </p>
                </div>
                <button
                  onClick={closeBookingModal}
                  className="w-full py-3 bg-white hover:bg-zinc-200 text-black rounded-full font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
                >
                  Chiudi Vetrina
                </button>
              </div>
            ) : (
              /* Booking Form State */
              <form onSubmit={handleBookingSubmit} className="space-y-4 text-left">
                
                {bookingError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Booking Date field (Calendario modale per la data) */}
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-widest font-bold text-white/50 block">Scegli Data</label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-fuchsia-500 transition-colors cursor-pointer"
                    />
                    <div className="absolute left-4 top-3.5 text-white/40">
                      <Calendar className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Client Name Field */}
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-widest font-bold text-white/50 block">Nome Completo</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="es. Massimo Castro"
                      value={bookingName}
                      onChange={(e) => setBookingName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-fuchsia-500 transition-colors"
                    />
                    <div className="absolute left-4 top-3.5 text-white/40">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Guests counter & Cellphone Grid */}
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Number of People field (1 as default) */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-widest font-bold text-white/50 block">N. Persone</label>
                    <div className="relative flex items-center bg-zinc-900 border border-white/10 rounded-xl overflow-hidden h-[46px]">
                      <button
                        type="button"
                        onClick={() => setBookingGuests(Math.max(1, bookingGuests - 1))}
                        className="w-12 h-full hover:bg-white/5 text-white/80 active:scale-95 transition-all text-sm font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center text-xs font-bold font-mono text-white">
                        {bookingGuests}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBookingGuests(bookingGuests + 1)}
                        className="w-12 h-full hover:bg-white/5 text-white/80 active:scale-95 transition-all text-sm font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Cellphone number field */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-widest font-bold text-white/50 block">Telefono Cellulare</label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="es. 333 1234567"
                        value={bookingPhone}
                        onChange={(e) => setBookingPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-fuchsia-500 transition-colors font-mono"
                      />
                      <div className="absolute left-3.5 top-3.5 text-white/40">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="w-full py-4 bg-fuchsia-500 hover:bg-fuchsia-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-full transition-all active:scale-[0.98] disabled:opacity-55 cursor-pointer shadow-lg shadow-fuchsia-500/25 mt-2 flex items-center justify-center gap-2"
                >
                  {isSubmittingBooking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Inoltro in corso...</span>
                    </>
                  ) : (
                    <span>Conferma Prenotazione</span>
                  )}
                </button>

              </form>
            )}

          </div>
        </div>
      )}

      {/* FULLSCREEN CREATOR STUDIO BACK-OFFICE (MANAGEMENT PANEL) */}
      {isCreatorOpen && (
        <CreatorStudio
          onClose={() => setIsCreatorOpen(false)}
          posts={posts}
          onRefreshPosts={fetchPosts}
          settings={settings}
          onSaveSettings={handleSaveSettings}
        />
      )}

      {/* Live active users pill */}
      <div className="fixed bottom-6 right-6 z-30 hidden lg:flex pointer-events-none">
        <div className="flex items-center gap-2 bg-black/65 px-4 py-2 rounded-full border border-white/10 pointer-events-auto backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500"></span>
          </span>
          <span className="text-[10px] font-mono font-bold tracking-widest text-fuchsia-400">LIVE</span>
        </div>
      </div>

    </div>
  );
}
