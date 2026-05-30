import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login, guestLogin } from "../redux/slices/authSlice";
import { Flame } from "lucide-react";
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
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col items-center justify-center bg-bumble-yellow p-4">
      {/* Huge background text label "Inakkam" */}
      <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0 overflow-hidden">
        <span className="text-[40vw] md:text-[32vw] lg:text-[24vw] font-black tracking-tighter text-bumble-charcoal opacity-10 leading-none whitespace-nowrap">
          Inakkam
        </span>
      </div>

      <AnimatePresence mode="wait">
        {phase === "splash" && (
          <motion.div
            key="splash"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 flex flex-col items-center justify-center"
          >
            <div className="w-24 h-24 rounded-3xl bg-bumble-charcoal flex items-center justify-center shadow-2xl shadow-black/20">
              <Flame className="w-12 h-12 text-bumble-yellow" />
            </div>
            <h1 className="text-4xl font-black text-bumble-charcoal tracking-tight mt-6">
              Inakkam
            </h1>
            <p className="text-sm font-bold text-bumble-charcoal/60 mt-1 tracking-wider uppercase">
              Infinite Match
            </p>
          </motion.div>
        )}

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
              className="relative w-full max-w-[280px] sm:max-w-xs h-[380px] mb-8 mt-6"
            >
              {/* BACK CARD */}
              <div className="absolute top-0 right-[-30px] w-[80%] h-[90%] rotate-[15deg] z-0 opacity-80">
                <div className="w-full h-full rounded-[2.5rem] shadow-xl overflow-hidden relative">
                  <img src={introSlides[(introStep + 1) % introSlides.length].image} className="w-full h-full object-cover filter brightness-[0.65]" />
                </div>
              </div>

              {/* FRONT CARD */}
              <div className="absolute top-4 left-[-15px] w-[90%] h-[95%] -rotate-[6deg] z-10">
                <div className="w-full h-full rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden relative border border-white/10">
                  <img src={introSlides[introStep].image} className="w-full h-full object-cover filter brightness-[0.85]" />
                  <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>
              </div>
            </motion.div>

            <h2 className="text-3xl font-black text-bumble-charcoal max-w-[320px] mb-8 min-h-[80px] text-center leading-tight drop-shadow-sm">
              {introSlides[introStep].title}
            </h2>

            <div className="flex gap-2.5 mb-10">
              {introSlides.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === introStep ? 'w-8 bg-bumble-charcoal' : 'w-2 bg-bumble-charcoal/20'}`} />
              ))}
            </div>

            <div className="flex items-center gap-4 w-full max-w-[320px]">
              <button onClick={() => setPhase("login")} className="flex-1 py-4 font-bold text-bumble-charcoal/60 hover:text-bumble-charcoal hover:bg-bumble-charcoal/5 rounded-2xl transition-colors cursor-pointer">
                Skip
              </button>
              <button 
                onClick={handleIntroNext}
                className="flex-1 py-4 font-black text-white bg-bumble-charcoal rounded-2xl shadow-xl shadow-black/15 hover:bg-black active:scale-95 transition-all cursor-pointer"
              >
                {introStep === introSlides.length - 1 ? "Let's Start" : "Next"}
              </button>
            </div>
          </motion.div>
        )}

        {phase === "login" && (
          <motion.div
            key="login"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 bg-white w-full max-w-sm sm:max-w-[420px] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl border border-white/40"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-bumble-yellow/20 flex items-center justify-center mx-auto mb-5 border-2 border-bumble-yellow/30">
                <Flame className="w-8 h-8 text-bumble-yellow" />
              </div>
              
              {/* Skip Button */}
              <button 
                onClick={() => {
                  dispatch(guestLogin());
                  navigate("/swipe");
                }}
                className="absolute top-6 right-6 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-bumble-charcoal transition-colors px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                Skip
              </button>

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
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 text-sm font-bold text-bumble-charcoal placeholder-slate-400 focus:border-bumble-yellow focus:bg-white focus:ring-4 focus:ring-bumble-yellow/10 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2 ml-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 text-sm font-bold text-bumble-charcoal placeholder-slate-400 focus:border-bumble-yellow focus:bg-white focus:ring-4 focus:ring-bumble-yellow/10 outline-none transition-all"
                />
              </div>

              {isSignUp && (
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2 ml-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 text-sm font-bold text-bumble-charcoal placeholder-slate-400 focus:border-bumble-yellow focus:bg-white focus:ring-4 focus:ring-bumble-yellow/10 outline-none transition-all"
                  />
                </div>
              )}

              <div className="text-right pb-2">
                {!isSignUp && (
                  <span className="text-xs text-slate-500 font-bold cursor-pointer hover:text-bumble-charcoal transition-colors underline underline-offset-4 decoration-slate-200 hover:decoration-bumble-charcoal">
                    Forgot password?
                  </span>
                )}
              </div>

              <button
                onClick={handleLogin}
                className="w-full py-4.5 rounded-2xl text-base font-black text-white bg-bumble-charcoal cursor-pointer hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/15"
              >
                {isSignUp ? "Sign Up" : "Sign In"}
              </button>
            </div>
            
            <div className="mt-8 text-center border-t border-slate-100 pt-6">
              <span className="text-slate-500 text-xs font-bold">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button onClick={() => setIsSignUp(!isSignUp)} className="text-bumble-charcoal font-black hover:text-black transition-colors cursor-pointer ml-1">
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;
