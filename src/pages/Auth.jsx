import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login, guestLogin } from "../redux/slices/authSlice";
import { Flame, ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
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
  const dispatch = useDispatch();

  const [phase, setPhase] = useState("splash"); // splash, intro, login
  const [introStep, setIntroStep] = useState(0);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPw, setShowPw] = useState(false);

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
    dispatch(login({ username: "sree" }));
    navigate("/onboarding");
  };

  return (
    <div style={{ backgroundColor: '#D51659' }} className="min-h-screen w-full relative overflow-hidden flex flex-col items-center justify-center p-4">
      
      {/* Animated glowing orbs on the red background */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)", top: "-10%", left: "-10%" }}
        animate={{ scale: [1, 1.3, 1], x: [0, 40, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,0,0,0.1) 0%, transparent 60%)", bottom: "-10%", right: "-5%" }}
        animate={{ scale: [1, 1.2, 1], y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 60%)", top: "50%", right: "20%" }}
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      {/* Huge background text label "Inakkam" */}
      <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0 overflow-hidden">
        <span className="text-[40vw] md:text-[32vw] lg:text-[24vw] font-black tracking-tighter text-black opacity-10 leading-none whitespace-nowrap">
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
                className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center shadow-2xl shadow-black/20 relative z-10"
              >
                <Flame className="w-12 h-12 text-[#D51659]" />
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
            className="relative z-10 w-full flex flex-col items-center justify-center h-full"
          >
            <motion.div 
              key={introStep}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-[280px] sm:max-w-xs h-[380px] mb-8 mt-6"
            >
              {/* BACK CARD - glass border */}
              <div className="absolute top-0 right-[-30px] w-[80%] h-[90%] rotate-[15deg] z-0 opacity-80">
                <div className="w-full h-full rounded-[2.5rem] shadow-xl overflow-hidden relative border border-white/10">
                  <img src={introSlides[(introStep + 1) % introSlides.length].image} className="w-full h-full object-cover filter brightness-[0.65]" alt="" />
                </div>
              </div>

              {/* FRONT CARD - enhanced shadow and border */}
              <div className="absolute top-4 left-[-15px] w-[90%] h-[95%] -rotate-[6deg] z-10">
                <div className="w-full h-full rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden relative border-2 border-white/15">
                  <img src={introSlides[introStep].image} className="w-full h-full object-cover filter brightness-[0.85]" alt="" />
                  <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
                  
                  {/* Card info overlay */}
                  <div className="absolute bottom-5 left-5 right-5 z-20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold text-white backdrop-blur-md"
                        style={{ background: "rgba(213,22,89,0.5)" }}>
                        {introSlides[introStep].tag}
                      </span>
                      <span className="text-lg">{introSlides[introStep].emoji}</span>
                    </div>
                    <h3 className="font-black text-white text-lg drop-shadow-lg">
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
              className="text-3xl font-black text-white max-w-[320px] mb-8 min-h-[80px] text-center leading-tight"
              style={{ textShadow: "0 2px 15px rgba(0,0,0,0.15)" }}
            >
              {introSlides[introStep].title}
            </motion.h2>

            {/* Progress dots */}
            <div className="flex gap-2.5 mb-10">
              {introSlides.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ width: i === introStep ? 32 : 8 }}
                  className="h-1.5 rounded-full transition-colors duration-300"
                  style={{ background: i === introStep ? "white" : "rgba(0,0,0,0.2)" }}
                />
              ))}
            </div>

            <div className="flex items-center gap-4 w-full max-w-[320px]">
              <button onClick={() => setPhase("login")} className="flex-1 py-4 font-bold text-black/50 hover:text-black hover:bg-black/5 rounded-2xl transition-colors cursor-pointer">
                Skip
              </button>
              <button 
                onClick={handleIntroNext}
                className="flex-1 py-4 font-black text-white rounded-2xl shadow-xl shadow-black/20 hover:shadow-black/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
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
            className="relative z-10 w-full max-w-sm sm:max-w-[420px] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-white/20"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1) inset",
            }}
          >
            {/* Decorative glow dot */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(213,22,89,0.2) 0%, transparent 70%)" }}
            />

            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 250, delay: 0.1 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-pink-500/15"
                style={{ background: "linear-gradient(135deg, #D51659 0%, #b51350 100%)" }}
              >
                <Flame className="w-8 h-8 text-white" />
              </motion.div>
              
              <h3 className="text-3xl font-black text-bumble-charcoal tracking-tight">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h3>
              <p className="text-sm text-slate-500 font-bold mt-2">
                {isSignUp ? "Join Inakkam today" : "Sign in to your Inakkam account"}
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2 ml-1">
                  Email or Phone Number
                </label>
                <input
                  type="text"
                  placeholder="you@example.com"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 text-sm font-bold text-bumble-charcoal placeholder-slate-400 focus:border-[#D51659] focus:bg-white focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all"
                />
              </div>
              <div className="relative">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2 ml-1">
                  Password
                </label>
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 text-sm font-bold text-bumble-charcoal placeholder-slate-400 focus:border-[#D51659] focus:bg-white focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all pr-12"
                />
                <button
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-[38px] text-slate-400 hover:text-bumble-charcoal transition-colors cursor-pointer"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {isSignUp && (
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2 ml-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 text-sm font-bold text-bumble-charcoal placeholder-slate-400 focus:border-[#D51659] focus:bg-white focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all"
                  />
                </div>
              )}

              <div className="text-right pb-2">
                {!isSignUp && (
                  <span className="text-xs text-slate-500 font-bold cursor-pointer hover:text-[#D51659] transition-colors underline underline-offset-4 decoration-slate-200 hover:decoration-[#D51659]">
                    Forgot password?
                  </span>
                )}
              </div>

              <button
                onClick={handleLogin}
                className="w-full py-4.5 rounded-2xl text-base font-black text-white cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#D51659]/20 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #D51659 0%, #b51350 100%)" }}
              >
                <Sparkles className="w-4 h-4" />
                {isSignUp ? "Sign Up" : "Sign In"}
              </button>


            </div>
            
            <div className="mt-8 text-center border-t border-slate-100 pt-6">
              <span className="text-slate-500 text-xs font-bold">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button onClick={() => setIsSignUp(!isSignUp)} className="text-[#D51659] font-black hover:text-[#b51350] transition-colors cursor-pointer ml-1">
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </span>
            </div>
            
            <div className="mt-4 text-center">
              <button 
                onClick={() => {
                  dispatch(guestLogin());
                  navigate("/swipe");
                }}
                className="text-[11px] font-black uppercase tracking-wider text-slate-400 hover:text-bumble-charcoal transition-colors px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer"
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
