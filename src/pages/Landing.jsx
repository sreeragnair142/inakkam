import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from "react-redux";
import { login, logout } from "../redux/slices/authSlice";
import { setTheme } from "../redux/slices/themeSlice";
import { markAsRead } from "../redux/slices/notificationSlice";
import {
  Flame,
  Sparkles,
  Heart,
  Shield,
  MessageCircle,
  Star,
  ArrowRight,
  CheckCircle2,
  Bell,
  LogOut,
  Settings,
  User,
  ChevronDown,
  Palette,
  Eye,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Landing = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);
  const notifications = useSelector((state) => state.notification.items);
  const unreadNotifCount = useSelector(
    (state) => state.notification.unreadCount,
  );

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testIndex, setTestIndex] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Settings local state
  const themeMode = useSelector((state) => state.theme.mode);
  const [privacyToggles, setPrivacyToggles] = useState({
    incognito: false,
    hideAge: false,
    hideLocation: false,
    showOnlineStatus: true,
  });
  const [notificationToggles, setNotificationToggles] = useState({
    matches: true,
    messages: true,
    likes: false,
    spotlight: true,
  });
  const [distanceValue, setDistanceValue] = useState(25);

  const testimonials = [
    {
      quote: "We are both naturally positive, happy-go-getters, but when you put us together, it feels like there is nothing we can't accomplish.",
      name: "Leslie & Thomas",
      meta: "Married in 2025",
      image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600"
    },
    {
      quote: "I never thought I'd find someone who matches my energy perfectly. Inakkam made it effortless and fun.",
      name: "Sarah & David",
      meta: "Engaged in 2024",
      image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=600"
    },
    {
      quote: "From our first date at the coffee shop to moving in together, every step felt right.",
      name: "Michael & James",
      meta: "Met in 2023",
      image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&q=80&w=600"
    }
  ];

  const profiles = [
    {
      name: "Danna",
      age: 28,
      image:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600",
    },
    {
      name: "Josh",
      age: 34,
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600",
    },
    {
      name: "Maya",
      age: 25,
      image:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600",
    },
    {
      name: "Tiana",
      age: 30,
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600",
    },
    {
      name: "Marcus",
      age: 27,
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % profiles.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [profiles.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTestIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const navItems = [
    { id: "swipe", label: "Discover", path: "/swipe" },
    { id: "chat", label: "Conversations", path: "/chat" },
    {
      id: "membership",
      label: "Go Premium",
      path: "/membership",
      premium: true,
    },
    { id: "profile", label: "My Profile", path: "/profile" },
  ];

  const handleNavClick = (path) => {
    navigate(path);
  };

  const handleActionClick = (targetPath = "/swipe") => {
    if (isAuthenticated) {
      navigate(targetPath);
    } else {
      navigate("/auth");
    }
  };

  const getCardStyle = (offset) => {
    if (offset === -1) {
      return {
        x: -170,
        y: -10,
        rotate: -6,
        scale: 0.92,
        zIndex: 10,
        opacity: 1
      };
    }

    if (offset === 0) {
      return {
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        zIndex: 30,
        opacity: 1
      };
    }

    if (offset === 1) {
      return {
        x: 170,
        y: -10,
        rotate: 6,
        scale: 0.92,
        zIndex: 10,
        opacity: 1
      };
    }

    return {
      x: offset < 0 ? -350 : 350,
      y: 0,
      rotate: offset < 0 ? -10 : 10,
      scale: 0.8,
      zIndex: 1,
      opacity: 0
    };
  };
  return (
    <div className="min-h-screen bg-white text-bumble-charcoal overflow-x-hidden relative font-sans">
      {/* SECTION 1: Yellow Hero Canvas (Matching Screenshot 1) */}
      <section className="bg-bumble-yellow px-6 pb-24 relative overflow-hidden flex flex-col min-h-screen justify-between">
        {/* Shifting radial glow */}
        <div className="absolute -inset-px bg-gradient-to-b from-white/10 via-transparent to-black/5 opacity-40 pointer-events-none" />

        {/* Header (Matching Navigation in Screenshots) */}
        <header className="max-w-7xl mx-auto w-full py-6 flex items-center justify-between relative z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bumble-charcoal flex items-center justify-center shadow-lg shadow-black/10">
              <Flame className="w-5 h-5 text-bumble-yellow animate-pulse" />
            </div>
            <span className="font-black text-2xl tracking-tight text-bumble-charcoal animate-pulse">
              Inakkam
            </span>
          </div>

          {/* Desktop Middle Pills */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-full shadow-sm border border-black/5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.path)}
                  className="px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer text-bumble-charcoal hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <span>{item.label}</span>
                  {item.premium && (
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-bumble-yellow/15 text-bumble-charcoal uppercase tracking-wider scale-90">
                      Pro
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-full shadow-sm border border-black/5">
              {["Date", "BFF", "Stories", "Safety", "Support"].map(
                (pill, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate("/auth")}
                    className={`px-6 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer
                    ${idx === 0
                        ? "bg-bumble-yellow/10 text-bumble-charcoal"
                        : "text-bumble-charcoal hover:bg-slate-100"
                      }`}
                  >
                    {pill}
                  </button>
                ),
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3 relative z-50">
                {/* Likes counter badge */}
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-bumble-red/10 text-bumble-red border border-bumble-red/5">
                  <Heart className="w-3.5 h-3.5 fill-current animate-pulse" />
                  <span>{user?.likesCount || 14} Likes</span>
                </div>

                {/* Notification bell widget */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2.5 rounded-full border border-black/5 bg-white text-bumble-charcoal hover:bg-slate-50 transition-colors flex items-center justify-center relative cursor-pointer"
                  >
                    <Bell className="w-4.5 h-4.5" />
                    {unreadNotifCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-bumble-red text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-bounce">
                        {unreadNotifCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Panel */}
                  <AnimatePresence>
                    {showNotifications && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowNotifications(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 15, scale: 0.95 }}
                          className="absolute right-0 mt-3.5 w-80 sm:w-96 rounded-2xl shadow-2xl border z-50 overflow-hidden bg-white border-slate-100 text-bumble-charcoal"
                        >
                          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
                              Notifications
                            </h3>
                            {unreadNotifCount > 0 && (
                              <span className="text-[10px] bg-bumble-yellow/15 text-bumble-charcoal font-bold px-2 py-0.5 rounded-full">
                                {unreadNotifCount} unread
                              </span>
                            )}
                          </div>
                          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                            {notifications.length === 0 ? (
                              <div className="p-6 text-center text-slate-400 text-xs">
                                No notifications yet! Get swiping!
                              </div>
                            ) : (
                              notifications.map((notif) => (
                                <div
                                  key={notif.id}
                                  onClick={() => {
                                    dispatch(markAsRead(notif.id));
                                  }}
                                  className={`p-3.5 transition-colors cursor-pointer flex gap-3 text-xs
                                    ${!notif.read
                                      ? "bg-bumble-yellow/5 hover:bg-bumble-yellow/10"
                                      : "hover:bg-slate-50"
                                    }`}
                                >
                                  <div className="flex-1 text-left">
                                    <p className="font-medium text-bumble-charcoal leading-relaxed">
                                      {notif.text}
                                    </p>
                                    <span className="text-[10px] text-slate-400 block mt-1">
                                      {notif.time}
                                    </span>
                                  </div>
                                  {!notif.read && (
                                    <span className="w-2 h-2 rounded-full bg-bumble-yellow self-center shrink-0" />
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile dropdown */}
                <div className="relative">
                  <div
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 p-1 pr-3 rounded-full border border-black/5 bg-white hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
                  >
                    <img
                      src={
                        user?.images?.[0] ||
                        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600"
                      }
                      alt={user?.name || "Alex"}
                      className="w-8 h-8 rounded-full object-cover border border-white"
                    />
                    <span className="text-xs font-black hidden sm:inline-block text-bumble-charcoal">
                      {user?.name || "Alex"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>

                  {/* Profile Menu Dropdown */}
                  <AnimatePresence>
                    {showProfileMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowProfileMenu(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 mt-2.5 w-56 rounded-2xl shadow-xl border bg-white border-slate-100 z-50 p-2 text-left"
                        >
                          <div className="p-3 border-b border-slate-100 flex flex-col">
                            <span className="font-bold text-xs text-bumble-charcoal flex items-center gap-1">
                              {user?.name || "Alex"}, {user?.age || 26}
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-current" />
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-wider">
                              {user?.membership || "Free Tier"}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              navigate("/profile");
                              setShowProfileMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-50 hover:text-bumble-charcoal transition-colors cursor-pointer mt-1"
                          >
                            <User className="w-4 h-4 text-slate-400" />
                            <span>My Profile</span>
                          </button>

                          <button
                            onClick={() => {
                              setShowSettingsModal(true);
                              setShowProfileMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-50 hover:text-bumble-charcoal transition-colors cursor-pointer"
                          >
                            <Settings className="w-4 h-4 text-slate-400" />
                            <span>Account Settings</span>
                          </button>

                          <button
                            onClick={() => {
                              dispatch(logout());
                              setShowProfileMenu(false);
                              toast.success("Logged out successfully!");
                              navigate("/auth");
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl text-bumble-red hover:bg-rose-50 transition-colors cursor-pointer mt-1 border-t border-slate-100 pt-3"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Log Out</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate("/auth")}
                  className="p-2 rounded-full bg-white text-bumble-charcoal border border-black/5 hover:bg-slate-50 transition-colors hidden sm:flex items-center gap-1 cursor-pointer text-xs font-bold"
                >
                  <GlobeIcon className="w-4 h-4" />
                  <span>EN</span>
                </button>
                <button
                  onClick={() => dispatch(login({ username: "sree" }))}
                  className="text-xs sm:text-sm font-bold bg-bumble-charcoal text-white hover:bg-black px-6 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all duration-300 shadow-md shadow-black/15 cursor-pointer"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </header>

        {/* Hero Content View (Matching Screenshot 1 with Giant Bumble text and Tilted Cards) */}
        <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col justify-center items-center relative z-10 pt-8 pb-12">
          {/* Huge background text label "Bumble" (Matching Screenshot 2) */}
          <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0">
            <span className="text-[40vw] md:text-[32vw] lg:text-[24vw] font-black tracking-tighter text-bumble-charcoal opacity-15 leading-none whitespace-nowrap">
              Inakkam
            </span>
          </div>

          {/* 3D Floating Tilted Profile Cards (Matching Screenshot 2 from Bumble.com with Y-rotation) */}
          <div className="relative w-full max-w-7xl h-[620px] flex justify-center items-center z-10 select-none [perspective:2200px] overflow-visible scale-[0.82] sm:scale-100">
            {" "}
            {profiles.map((profile, idx) => {
              let offset = idx - currentIndex;
              // Wrap around for circular list
              const half = profiles.length / 2;
              if (offset < -half) {
                offset += profiles.length;
              } else if (offset > half) {
                offset -= profiles.length;
              }

              const style = getCardStyle(offset);

              return (
                <motion.div
                  key={profile.name}
                  animate={style}
                  transition={{ duration: 0.75, ease: [0.25, 1, 0.5, 1] }}
                  className="absolute rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.28)] w-[260px] h-[470px] shrink-0 overflow-hidden cursor-pointer"
                  style={{
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden",
                  }}
                  onClick={() => {
                    if (offset === -1) {
                      navigate(isAuthenticated ? "/swipe" : "/auth");
                    } else {
                      setCurrentIndex((idx + 1) % profiles.length);
                    }
                  }}
                >
                  <div className="relative w-full h-full">
                    <img
                      src={profile.image}
                      alt={profile.name}
                      className="w-full h-full object-cover object-center rounded-[2.5rem] pointer-events-none scale-[1.02]"
                    />
                    {/* Shadow overlay at bottom for text readability */}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none rounded-b-[2rem]" />

                    {/* Text overlay directly on the image bottom */}
                    <div className="absolute bottom-6 left-6 text-white text-left z-10 pointer-events-none">
                      <span className="font-black text-xl tracking-tight block">
                        {profile.name}, {profile.age}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Down arrow link indicator */}
        <div className="flex justify-center z-10 w-full">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-bumble-charcoal cursor-pointer hover:bg-white/10"
            onClick={() => {
              document
                .getElementById("closer-to-love")
                .scrollIntoView({ behavior: "smooth" });
            }}
          >
            <ArrowRight className="w-4 h-4 rotate-90" />
          </motion.div>
        </div>
      </section>

      {/* SECTION 2 — PREMIUM LOVE EXPERIENCE */}
      <section
        id="closer-to-love"
        className="relative py-32 px-6 overflow-hidden bg-[#f5f5f3]"
      >
        {/* Background Glow */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-bumble-yellow/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-200/30 blur-[120px] rounded-full" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center relative z-10">

          {/* LEFT CONTENT */}
          <div className="space-y-8">

            {/* Small badge */}
            <div className="inline-flex items-center gap-2 bg-white shadow-md border border-black/5 px-5 py-2 rounded-full">
              <div className="w-2 h-2 rounded-full bg-bumble-yellow animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-bumble-charcoal">
                Genuine Connections
              </span>
            </div>

            {/* Heading */}
            <div className="space-y-5">
              <h2 className="text-5xl sm:text-7xl leading-[0.95] tracking-tight font-serif italic font-normal text-bumble-charcoal">
                Dating that
                <br />
                feels more
                <span className="ml-4">
                  human.
                </span>
              </h2>

              <p className="text-lg leading-relaxed text-slate-500 max-w-xl font-medium">
                Meet people who match your energy, lifestyle, and vibe.
                Inakkam helps meaningful conversations happen naturally —
                without the awkwardness.
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="bg-white px-6 py-4 rounded-3xl shadow-lg border border-black/5">
                <h4 className="text-3xl font-black text-bumble-charcoal">50M+</h4>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Active Matches
                </p>
              </div>

              <div className="bg-white px-6 py-4 rounded-3xl shadow-lg border border-black/5">
                <h4 className="text-3xl font-black text-bumble-charcoal">190+</h4>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Countries
                </p>
              </div>

              <div className="bg-white px-6 py-4 rounded-3xl shadow-lg border border-black/5">
                <h4 className="text-3xl font-black text-bumble-charcoal">24/7</h4>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Real Conversations
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={() => handleActionClick("/swipe")}
                className="px-9 py-4 rounded-full bg-bumble-charcoal text-white font-bold text-sm hover:scale-105 transition-all shadow-2xl"
              >
                Start Matching
              </button>

              <button
                className="px-9 py-4 rounded-full bg-white text-bumble-charcoal font-bold text-sm border border-black/10 hover:bg-black hover:text-white transition-all"
              >
                Explore Features
              </button>
            </div>
          </div>

          {/* RIGHT PREMIUM CARD STACK */}
          <div className="relative flex justify-center items-center min-h-[720px]">

            {/* BACK CARD */}
            <div className="absolute right-12 top-16 rotate-[10deg] w-[250px] h-[520px] rounded-[3rem] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.2)]">
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800"
                className="w-full h-full object-cover"
              />
            </div>

            {/* MIDDLE CARD */}
            <div className="absolute left-10 top-10 -rotate-[8deg] w-[260px] h-[540px] rounded-[3rem] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.22)]">
              <img
                src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800"
                className="w-full h-full object-cover"
              />
            </div>

            {/* MAIN CARD */}
            <div className="relative z-20 w-[320px] h-[620px] rounded-[3.5rem] bg-white p-3 shadow-[0_50px_120px_rgba(0,0,0,0.25)] border border-black/5">

              <div className="relative w-full h-full rounded-[3rem] overflow-hidden">

                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=900"
                  alt=""
                  className="w-full h-full object-cover"
                />

                {/* overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                {/* floating badges */}
                <div className="absolute top-6 left-6 flex flex-col gap-3">
                  <span className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-black text-bumble-charcoal shadow">
                    ✨ Verified Profile
                  </span>

                  <span className="bg-bumble-yellow px-4 py-2 rounded-full text-xs font-black text-bumble-charcoal shadow-lg">
                    98% Match
                  </span>
                </div>

                {/* bottom content */}
                <div className="absolute bottom-7 left-7 right-7 text-white">

                  <div className="flex items-center gap-2">
                    <h3 className="text-4xl font-black">
                      Maya, 25
                    </h3>

                    <div className="w-4 h-4 rounded-full bg-green-400 border-2 border-white" />
                  </div>

                  <p className="mt-2 text-sm text-white/80 font-medium leading-relaxed">
                    Designer • Traveler • Coffee lover ☕
                  </p>

                  {/* interests */}
                  <div className="flex flex-wrap gap-2 mt-5">
                    {["Outdoors", "Running", "Dog Mom"].map((tag) => (
                      <span
                        key={tag}
                        className="px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/10 text-xs font-bold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* SECTION 3: Member Circle Redesign */}
      <section className="py-32 bg-white relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute right-0 top-0 w-1/2 h-full bg-bumble-light-gray rounded-l-[4rem] md:rounded-l-[8rem] -z-10" />
        <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-bumble-yellow/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 lg:gap-24 items-center text-left">
          {/* Image composition side */}
          <div className="relative">
            {/* Main Image */}
            <div className="relative z-10 w-full max-w-[400px] mx-auto md:mr-auto rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800"
                alt="Community Member"
                className="w-full aspect-[4/5] object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            
            {/* Floating element 1: Stats */}
            <motion.div 
              animate={{ y: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -right-4 md:-right-12 top-16 bg-white p-4 rounded-3xl shadow-xl border border-slate-100 z-20 hidden sm:flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-bumble-yellow rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-bumble-charcoal fill-current" />
              </div>
              <div>
                <span className="block font-black text-xl text-bumble-charcoal">1M+</span>
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Members</span>
              </div>
            </motion.div>

            {/* Floating element 2: Member Seal */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
              className="absolute -left-6 -bottom-8 w-32 h-32 rounded-full bg-bumble-charcoal text-white shadow-2xl flex items-center justify-center z-20 border-4 border-white"
            >
              <div className="w-[85%] h-[85%] border border-dashed border-white/40 rounded-full flex flex-col items-center justify-center">
                <Flame className="w-6 h-6 text-bumble-yellow mb-1" />
                <span className="text-[8px] font-black uppercase tracking-widest text-center leading-tight">
                  Inakkam<br/>Circle
                </span>
              </div>
            </motion.div>
          </div>

          {/* Text Content side */}
          <div className="space-y-8 z-10">
            <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm shadow-sm border border-slate-200 px-4 py-2 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bumble-yellow opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-bumble-yellow"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-bumble-charcoal">
                Community Driven
              </span>
            </div>

            <h2 className="text-4xl sm:text-6xl font-serif italic font-normal text-bumble-charcoal tracking-tight leading-[1.1]">
              Help shape the <br />
              <span className="mt-2 block">
                future of dating
              </span>
            </h2>

            <p className="text-slate-500 text-lg leading-relaxed max-w-lg font-medium">
              Join the elite Inakkam Member Circle. Share ideas directly with our product team through exclusive chats, discussions, and beta tests to create a space you truly love.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => handleActionClick("/swipe")}
                className="px-8 py-4 bg-bumble-charcoal text-white hover:bg-black rounded-full font-bold text-xs uppercase tracking-widest cursor-pointer transition-all hover:scale-105 shadow-xl flex items-center gap-2"
              >
                <span>Join the Circle</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                className="px-8 py-4 bg-white text-bumble-charcoal border border-slate-200 hover:bg-slate-50 rounded-full font-bold text-xs uppercase tracking-widest cursor-pointer transition-colors"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Dual Modes Redesign */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Card 1: Inakkam Date (Dark Theme) */}
          <div className="group relative bg-bumble-yellow text-bumble-charcoal rounded-[3rem] p-12 flex flex-col justify-between overflow-hidden h-[600px] border border-black/5 shadow-2xl transition-all duration-500 hover:-translate-y-2">
            {/* Background glowing orb */}
            <div className="absolute top-[-20%] left-[-20%] w-[300px] h-[300px] bg-white/40 blur-[80px] rounded-full group-hover:bg-white/60 transition-colors duration-500" />
            
            {/* Graphic Layer */}
            <div className="relative z-10 w-full max-w-[240px] mx-auto mt-4 transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-4">
              <div className="bg-white/40 backdrop-blur-md rounded-3xl p-3 shadow-2xl border border-white/50">
                <div className="relative rounded-2xl overflow-hidden aspect-[3/4]">
                  <div className="absolute top-4 left-4 z-20 text-[9px] bg-bumble-charcoal text-white font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                    ID Verified
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=500"
                    alt="Date Preview"
                    className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700 ease-out"
                  />
                  {/* Glass overlay text */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
                    <span className="font-extrabold text-white text-lg block">
                      Tiana, 30
                    </span>
                    <span className="text-xs text-white/80 mt-1 block">
                      Looking for connection
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Layer */}
            <div className="relative z-10 mt-8">
              <h3 className="text-4xl font-serif italic font-semibold text-bumble-charcoal mb-3">
                Inakkam Date
              </h3>
              <p className="text-bumble-charcoal/80 text-sm leading-relaxed max-w-sm mb-6 font-medium">
                Whether you're new to dating or ready to try again, Inakkam Date
                is built to bring you closer to love safely and meaningfully.
              </p>
              <button
                onClick={() => handleActionClick("/swipe")}
                className="inline-flex items-center gap-2 bg-bumble-charcoal text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors"
              >
                <span>Find your person</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Inakkam BFF (Light Theme) */}
          <div className="group relative bg-[#FFEBA2] text-bumble-charcoal rounded-[3rem] p-12 flex flex-col justify-between overflow-hidden h-[600px] border border-black/5 shadow-2xl transition-all duration-500 hover:-translate-y-2">
            {/* Background glowing orb */}
            <div className="absolute bottom-[-20%] right-[-20%] w-[300px] h-[300px] bg-white/60 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-700" />
            
            {/* Graphic Layer */}
            <div className="relative z-10 w-full max-w-[240px] mx-auto mt-4 transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-4">
              <div className="bg-white rounded-3xl p-3 shadow-2xl border border-black/5">
                <div className="relative rounded-2xl overflow-hidden aspect-[3/4]">
                  <div className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-bumble-yellow flex items-center justify-center shadow-lg border border-white/50">
                    <Heart className="w-5 h-5 text-bumble-charcoal fill-current animate-bounce" />
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=500"
                    alt="BFF Preview"
                    className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700 ease-out"
                  />
                   {/* Glass overlay text */}
                   <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
                    <span className="font-extrabold text-white text-lg block">
                      Book club
                    </span>
                    <span className="text-xs text-white/80 mt-1 block">
                      Events • Chat
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Layer */}
            <div className="relative z-10 mt-8">
              <h3 className="text-4xl font-serif italic font-semibold text-bumble-charcoal mb-3">
                Inakkam BFF
              </h3>
              <p className="text-bumble-charcoal/80 text-sm leading-relaxed max-w-sm mb-6 font-medium">
                Whether you've moved to a new city or just want to expand your
                circle, BFF makes it easy to meet like-minded friends who match
                your vibe.
              </p>
              <button
                onClick={() => handleActionClick("/swipe")}
                className="inline-flex items-center gap-2 bg-bumble-charcoal text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors"
              >
                <span>Find your people</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 5: Testimonials Slider */}
      <section className="py-20 px-10 bg-bumble-light-gray max-w-6xl mx-auto rounded-[2.5rem] mb-24 relative overflow-hidden border border-black/5">
        <AnimatePresence mode="wait">
          <motion.div
            key={testIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex flex-col md:flex-row items-center gap-16 text-left"
          >
            {/* Quote details */}
            <div className="flex-1 space-y-6 z-10">
              <span className="text-7xl font-serif text-bumble-yellow block mb-[-25px] leading-none">
                “
              </span>
              <p className="text-2xl sm:text-4.5xl font-black text-bumble-charcoal leading-tight min-h-[160px]">
                {testimonials[testIndex].quote}
              </p>
              <div>
                <h4 className="font-extrabold text-base text-bumble-charcoal">
                  {testimonials[testIndex].name}
                </h4>
                <span className="text-xs text-slate-500 font-semibold block mt-0.5">
                  {testimonials[testIndex].meta}
                </span>
              </div>
              <button
                onClick={() => handleActionClick("/home")}
                className="px-8 py-3.5 bg-bumble-charcoal hover:bg-black text-white rounded-full font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-sm mt-4"
              >
                Read more stories
              </button>
            </div>

            {/* Grayscale Visual Couple Card */}
            <div className="flex-1 max-w-sm w-full select-none relative">
              <img
                src={testimonials[testIndex].image}
                alt={testimonials[testIndex].name}
                className="w-full aspect-[3/3.8] object-cover rounded-3xl shadow-2xl filter grayscale border border-black/5"
              />
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation Dots */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-20">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setTestIndex(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                testIndex === idx ? "bg-bumble-yellow w-8" : "bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>



      {/* Footer */}
      <footer className="border-t border-slate-100 bg-bumble-light-gray py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-bumble-charcoal flex items-center justify-center shadow-md shadow-black/10">
              <Flame className="w-4.5 h-4.5 text-bumble-yellow" />
            </div>
            <span className="font-black text-lg tracking-tight text-bumble-charcoal">
              Inakkam
            </span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500 font-semibold">
            <span className="hover:text-slate-800 cursor-pointer">Support</span>
            <span className="hover:text-slate-800 cursor-pointer">
              Safety Tips
            </span>
            <span className="hover:text-slate-800 cursor-pointer">
              Community Rules
            </span>
            <span className="hover:text-slate-800 cursor-pointer">Careers</span>
          </div>
          <div className="text-slate-400 text-xs font-medium">
            &copy; {new Date().getFullYear()} Bumble Inc. All rights reserved.
            Antigravity UI.
          </div>
        </div>
      </footer>

      {/* Settings Popup Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
              onClick={() => setShowSettingsModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[101] bg-white rounded-[2rem] shadow-2xl border border-slate-100 w-full sm:w-[640px] max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-bumble-yellow flex items-center justify-center">
                    <Settings className="w-5 h-5 text-bumble-charcoal" />
                  </div>
                  <div>
                    <h2 className="font-black text-lg text-bumble-charcoal">Account Settings</h2>
                    <p className="text-xs text-slate-400 font-medium">Manage your preferences</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-bumble-charcoal transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto flex-1 px-8 py-6 space-y-8">

                {/* Theme */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-bumble-yellow" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-bumble-charcoal">Aesthetic Theme</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {['light', 'dark', 'gradient-blend'].map((mode) => {
                      const isSelected = themeMode === mode;
                      return (
                        <button
                          key={mode}
                          onClick={() => dispatch(setTheme(mode))}
                          className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer
                            ${isSelected
                              ? 'bg-bumble-charcoal text-white border-transparent shadow-md'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                        >
                          <span>{mode.replace('-', ' ')}</span>
                          {isSelected && <Check className="w-4 h-4 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Privacy */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-bumble-charcoal" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-bumble-charcoal">Discovery & Privacy</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Maximum Match Distance</span>
                      <span className="text-bumble-yellow font-extrabold">{distanceValue} miles</span>
                    </div>
                    <input
                      type="range" min="5" max="100" value={distanceValue}
                      onChange={(e) => setDistanceValue(parseInt(e.target.value))}
                      className="w-full accent-bumble-yellow cursor-pointer h-1.5 bg-slate-200 rounded-full"
                    />
                  </div>
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    {[
                      { key: 'incognito', label: 'Incognito Mode', desc: 'Only show your profile to connections you swiped right on first.' },
                      { key: 'hideAge', label: 'Hide My Age', desc: 'Remove your age badge from discover cards.' },
                      { key: 'hideLocation', label: 'Hide Location', desc: 'Hide distance proximity indicators from matches.' },
                      { key: 'showOnlineStatus', label: 'Active Status Ring', desc: 'Display a green dot when you are currently online.' },
                    ].map((toggle) => (
                      <div key={toggle.key} className="flex justify-between items-center gap-4">
                        <div className="text-left max-w-md">
                          <span className="text-sm font-bold block text-bumble-charcoal">{toggle.label}</span>
                          <span className="text-xs text-slate-500 block mt-0.5">{toggle.desc}</span>
                        </div>
                        <button
                          onClick={() => setPrivacyToggles(prev => ({ ...prev, [toggle.key]: !prev[toggle.key] }))}
                          className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 relative shrink-0 cursor-pointer
                            ${privacyToggles[toggle.key] ? 'bg-bumble-yellow' : 'bg-slate-300'}`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 transform
                            ${privacyToggles[toggle.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notifications */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-bumble-red" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-bumble-charcoal">Communication Alerts</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: 'matches', label: 'New Spark Match Alert', desc: 'Receive real-time push alerts when you get a new match.' },
                      { key: 'messages', label: 'Inbound Chat Messages', desc: 'Get notified when a connection sends you a message.' },
                      { key: 'likes', label: 'Likes Dashboard Count', desc: 'Notify me when someone likes my profile.' },
                      { key: 'spotlight', label: 'Spotlight Trends', desc: 'Get updates when your profile is trending locally.' },
                    ].map((toggle) => (
                      <div key={toggle.key} className="flex justify-between items-center gap-4">
                        <div className="text-left max-w-md">
                          <span className="text-sm font-bold block text-bumble-charcoal">{toggle.label}</span>
                          <span className="text-xs text-slate-500 block mt-0.5">{toggle.desc}</span>
                        </div>
                        <button
                          onClick={() => setNotificationToggles(prev => ({ ...prev, [toggle.key]: !prev[toggle.key] }))}
                          className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 relative shrink-0 cursor-pointer
                            ${notificationToggles[toggle.key] ? 'bg-bumble-yellow' : 'bg-slate-300'}`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 transform
                            ${notificationToggles[toggle.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-rose-600" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-rose-500">Security & Account</h3>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-rose-200 p-4 rounded-2xl bg-rose-50/50">
                    <div className="text-left">
                      <span className="text-sm font-bold block text-bumble-charcoal">Temporarily Deactivate</span>
                      <span className="text-xs text-slate-500 block mt-0.5">Pause your profile from discover feeds.</span>
                    </div>
                    <button className="px-4 py-2 rounded-xl text-xs font-bold border border-rose-300 text-rose-500 hover:bg-rose-50/80 transition-colors shrink-0 cursor-pointer">
                      Pause Swipes
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-rose-300 p-4 rounded-2xl bg-rose-50">
                    <div className="text-left">
                      <span className="text-sm font-bold block text-rose-600">Delete Inakkam Account</span>
                      <span className="text-xs text-slate-500 block mt-0.5">Permanently remove all data, matches, and history.</span>
                    </div>
                    <button className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm">
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Permanently</span>
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

/* Reusable Icons inside file */
const GlobeIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253"
    />
  </svg>
);

export default Landing;
