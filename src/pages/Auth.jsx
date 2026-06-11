import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login, guestLogin } from "../redux/slices/authSlice";
import { Flame, ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import loaderLogo from "../assets/loaderinakkam.png";
import { motion, AnimatePresence } from "framer-motion";

const introSlides = [
  {
    title: "Find Your Spark: Where Connections Ignite.",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600",
    name: "Lissa Moni", age: 22, emoji: "😍", tag: "Travel ✈️"
  },
  {
    title: "Connecting Hearts, One Swipe at a Time",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600",
    name: "Jenny Lopez", age: 24, emoji: "🥰", tag: "Yoga 🧘"
  },
  {
    title: "Discover, Connect, Love: Your Journey Starts Here",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600",
    name: "Mika Singh", age: 24, emoji: "😎", tag: "Sports 🏀"
  },
  {
    title: "It's a match",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600",
    name: "Ashife", age: 23, emoji: "✨", tag: "Dancing 💃"
  }
];

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [phase, setPhase] = useState(() => {
    // If state explicitly requests skipping splash (e.g., from guest clicking a feature)
    if (location.state?.skipSplash) return 'login';
    return 'splash';
  });
  const [introStep, setIntroStep] = useState(0);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (phase === "splash") {
      const timer = setTimeout(() => {
        setPhase("intro");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleIntroNext = () => {
    if (introStep < introSlides.length - 1) {
      setIntroStep(introStep + 1);
    } else {
      setPhase("login");
    }
  };

  const handleLogin = () => {
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }
    if (isSignUp && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    dispatch(login({
      name: formData.name || formData.email.split('@')[0] || 'User',
      email: formData.email,
      age: 25,
      images: [],
      isOnboarded: !isSignUp,
    }));
    if (isSignUp) {
      navigate("/onboarding");
    } else {
      navigate("/swipe");
    }
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #1a0a15 25%, #15061a 50%, #0d0515 75%, #0A0A0A 100%)' }} className="fixed inset-0 w-full h-[100dvh] overflow-hidden flex flex-col items-center justify-center">

      {/* Animated glowing orbs matching logo gradient */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(213,22,89,0.2) 0%, transparent 60%)", top: "-10%", left: "-10%" }}
        animate={{ scale: [1, 1.3, 1], x: [0, 40, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(180,77,220,0.18) 0%, transparent 60%)", bottom: "-10%", right: "-5%" }}
        animate={{ scale: [1, 1.2, 1], y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(213,22,89,0.12) 0%, transparent 60%)", top: "50%", right: "20%" }}
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
      <motion.div
        className="absolute w-[250px] h-[250px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(150,40,200,0.1) 0%, transparent 60%)", top: "20%", left: "30%" }}
        animate={{ scale: [1, 1.15, 1], x: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 6 }}
      />

      {/* Huge background text label "Inakkam" */}
      <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0 overflow-hidden">
        <span className="text-[40vw] md:text-[32vw] lg:text-[24vw] font-black tracking-tighter text-white opacity-[0.04] leading-none whitespace-nowrap">
          Inakkam
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* ═══════ SPLASH ═══════ */}
        {phase === "splash" && (
          <motion.div
            key="splash"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.08, filter: "blur(8px)" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex flex-col items-center justify-center"
          >
            {/* Spinning ring behind logo */}
            <div className="relative flex items-center justify-center">
              <motion.div
                className="absolute w-32 h-32 rounded-full border-2 border-dashed border-white/15"
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute w-[140px] h-[140px] rounded-full border border-white/5"
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-28 h-auto relative z-10"
              >
                <img src={loaderLogo} alt="Inakkam" className="w-full h-auto drop-shadow-xl" />
              </motion.div>
            </div>

            <motion.h1
              className="text-4xl font-black text-white tracking-tight mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.2)" }}
            >
              Inakkam
            </motion.h1>
            <motion.p
              className="text-sm font-bold text-white/60 mt-1 tracking-[0.25em] uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Infinite Match
            </motion.p>

            {/* Shimmer loading bar */}
            <motion.div
              className="mt-8 w-28 h-1 rounded-full overflow-hidden bg-black/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <motion.div
                className="h-full rounded-full bg-white/70"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        )}

        {/* ═══════ INTRO ═══════ */}
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="relative z-10 w-full flex flex-col items-center justify-center gap-4 py-4 px-4 overflow-x-hidden"
            style={{ height: '100dvh', maxHeight: '100vh' }}
          >
            <motion.div
              key={introStep}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-[260px] sm:max-w-[300px] shrink-0" style={{ height: '52vh', maxHeight: '440px', minHeight: '300px' }}
            >
              {/* LEFT CARD (Card 3) */}
              <div className="absolute top-[10%] left-[-45%] w-[85%] h-[80%] -rotate-[8deg] z-0 opacity-60">
                <div className="w-full h-full rounded-[2rem] sm:rounded-[2.5rem] shadow-xl overflow-hidden relative border border-white/5">
                  <img src={introSlides[(introStep + 2) % introSlides.length].image} className="w-full h-full object-cover filter brightness-[0.45]" alt="" />
                </div>
              </div>

              {/* RIGHT CARD (Card 2) */}
              <div className="absolute top-[10%] right-[-45%] w-[85%] h-[80%] rotate-[8deg] z-10 opacity-60">
                <div className="w-full h-full rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-white/10">
                  <img src={introSlides[(introStep + 1) % introSlides.length].image} className="w-full h-full object-cover filter brightness-[0.45]" alt="" />
                </div>
              </div>

              {/* CENTER FRONT CARD (Card 1) */}
              <div className="absolute top-0 left-[2.5%] w-[95%] h-[100%] rotate-0 z-20">
                <div className="w-full h-full rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.6)] overflow-hidden relative border-2 border-white/15">
                  <img src={introSlides[introStep].image} className="w-full h-full object-cover filter brightness-[0.85]" alt="" />
                  <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

                  {/* Card info overlay */}
                  <div className="absolute bottom-4 sm:bottom-5 left-4 sm:left-5 right-4 sm:right-5 z-30">
                    <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                      <span className="px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold text-white backdrop-blur-md"
                        style={{ background: "rgba(213,22,89,0.5)" }}>
                        {introSlides[introStep].tag}
                      </span>
                      <span className="text-base sm:text-lg">{introSlides[introStep].emoji}</span>
                    </div>
                    <h3 className="font-black text-white text-base sm:text-lg drop-shadow-lg">
                      {introSlides[introStep].name}, {introSlides[introStep].age}
                    </h3>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.h2
              key={`t-${introStep}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl sm:text-2xl font-black text-white max-w-[280px] text-center leading-tight mt-4 shrink-0"
              style={{ textShadow: "0 2px 15px rgba(0,0,0,0.15)" }}
            >
              {introSlides[introStep].title}
            </motion.h2>

            {/* Progress dots */}
            <div className="flex gap-2 mt-3 shrink-0">
              {introSlides.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ width: i === introStep ? 32 : 8 }}
                  className="h-1.5 rounded-full transition-colors duration-300"
                  style={{ background: i === introStep ? "white" : "rgba(255,255,255,0.2)" }}
                />
              ))}
            </div>

            <div className="flex items-center gap-4 w-full max-w-[320px] mt-4 shrink-0">
              <button onClick={() => setPhase("login")} className="flex-1 py-3.5 font-bold text-white/60 hover:text-white hover:bg-white/10 rounded-2xl transition-colors cursor-pointer">
                Skip
              </button>
              <button
                onClick={handleIntroNext}
                className="flex-1 py-3.5 font-black text-white rounded-2xl shadow-xl shadow-black/20 hover:shadow-black/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}
              >
                {introStep === introSlides.length - 1 ? "Let's Start" : "Next"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══════ LOGIN ═══════ */}
        {phase === "login" && (
          <motion.div
            key="login"
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative z-10 w-full max-w-sm sm:max-w-[420px] rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 ${isSignUp ? 'p-5' : 'p-5 sm:p-8'} overflow-y-auto mx-4`}
            style={{
              background: "rgba(15,8,20,0.85)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset",
              maxHeight: 'calc(100vh - 40px)',
            }}
          >
            {/* Decorative glow dot */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(213,22,89,0.2) 0%, transparent 70%)" }}
            />

            <div className={`text-center ${isSignUp ? 'mb-4' : 'mb-6'}`}>
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 250, delay: 0.1 }}
                className={`${isSignUp ? 'w-12' : 'w-20'} h-auto mx-auto ${isSignUp ? 'mb-3' : 'mb-5'}`}
              >
                <img src={loaderLogo} alt="Inakkam" className="w-full h-auto drop-shadow-lg" />
              </motion.div>

              <h3 className={`${isSignUp ? 'text-2xl' : 'text-3xl'} font-black text-white tracking-tight`}>
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h3>
              <p className={`text-sm text-slate-500 font-bold ${isSignUp ? 'mt-1' : 'mt-2'}`}>
                {isSignUp ? "Join Inakkam today" : "Sign in to your Inakkam account"}
              </p>
            </div>

            <div className={isSignUp ? "space-y-3" : "space-y-4"}>
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold text-center">
                  {error}
                </div>
              )}
              {isSignUp && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border-2 border-white/10 text-sm font-bold text-white placeholder-white/40 focus:border-[#D51659] focus:bg-white/10 focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all"
                  />
                </motion.div>
              )}
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">
                  Email or Phone Number
                </label>
                <input
                  type="text"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full ${isSignUp ? 'px-4 py-3 rounded-xl' : 'px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl'} bg-white/5 border-2 border-white/10 text-sm font-bold text-white placeholder-white/40 focus:border-[#D51659] focus:bg-white/10 focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all`}
                />
              </div>
              <div className="relative">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">
                  Password
                </label>
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full ${isSignUp ? 'px-4 py-3 rounded-xl' : 'px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl'} bg-white/5 border-2 border-white/10 text-sm font-bold text-white placeholder-white/40 focus:border-[#D51659] focus:bg-white/10 focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all pr-12`}
                />
                <button
                  onClick={() => setShowPw(!showPw)}
                  className={`absolute right-4 ${isSignUp ? 'top-[34px]' : 'top-[34px] sm:top-[38px]'} text-slate-400 hover:text-white transition-colors cursor-pointer`}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {isSignUp && (
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border-2 border-white/10 text-sm font-bold text-white placeholder-white/40 focus:border-[#D51659] focus:bg-white/10 focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all"
                  />
                </div>
              )}

              {!isSignUp && (
                <div className="text-right pb-2">
                  <span className="text-xs text-slate-500 font-bold cursor-pointer hover:text-[#D51659] transition-colors underline underline-offset-4 decoration-slate-200 hover:decoration-[#D51659]">
                    Forgot password?
                  </span>
                </div>
              )}

              <button
                onClick={handleLogin}
                className={`w-full ${isSignUp ? 'py-3.5 mt-1' : 'py-3.5 sm:py-4 mt-2'} rounded-xl sm:rounded-2xl text-base font-black text-white cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#D51659]/20 flex items-center justify-center gap-2`}
                style={{ background: "linear-gradient(135deg, #D51659 0%, #b51350 100%)" }}
              >
                <Sparkles className="w-4 h-4" />
                {isSignUp ? "Sign Up" : "Sign In"}
              </button>


            </div>

            <div className={`${isSignUp ? 'mt-4' : 'mt-5 sm:mt-6'} text-center border-t border-white/10 ${isSignUp ? 'pt-4' : 'pt-4 sm:pt-5'}`}>
              <span className="text-slate-500 text-xs font-bold">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button onClick={() => setIsSignUp(!isSignUp)} className="text-[#D51659] font-black hover:text-[#b51350] transition-colors cursor-pointer ml-1">
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </span>
            </div>

            <div className={`${isSignUp ? 'mt-3' : 'mt-3 sm:mt-4'} text-center`}>
              <button
                onClick={() => {
                  dispatch(guestLogin());
                  navigate("/swipe");
                }}
                className="text-[11px] font-black uppercase tracking-wider text-white/40 hover:text-white transition-colors px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer border border-white/10"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;
