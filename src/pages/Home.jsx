import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { mockStories, mockUsers } from '../data/mockData';
import { setActiveTab } from '../redux/slices/uiSlice';
import { selectUser } from '../redux/slices/userSlice';
import { 
  Flame, 
  MapPin, 
  CheckCircle2, 
  TrendingUp, 
  Heart, 
  Sparkles, 
  Compass, 
  CheckSquare,
  ArrowRight,
  ShieldCheck,
  Star,
  Users,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import coupleImg from '../assets/couple.jpg';
import landscapeLogo from '../assets/landscapelogo.png';

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const themeMode = useSelector((state) => state.theme.mode);

  const getContainerClass = () => {
    return 'bg-white text-bumble-charcoal border border-slate-100 shadow-sm';
  };

  const getCardClass = () => {
    return 'bg-white border-slate-100 shadow-sm';
  };

  const handleProfileClick = (userId) => {
    dispatch(selectUser(userId));
    dispatch(setActiveTab('profile'));
    navigate('/profile');
  };

  return (
    <div className="w-full text-left min-h-screen flex flex-col">
      
      {/* 1. 100% FULL-WIDTH HERO SECTION */}
      <section className="relative w-full h-[550px] md:h-[620px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={coupleImg} 
            alt="Awesome Dating Couple" 
            className="w-full h-full object-cover"
          />
          {/* Subtle dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Hero Content Panel */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white space-y-6">


          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-4xl sm:text-6.5xl font-black tracking-tight leading-none text-white drop-shadow-md"
          >
            Hello, <span className="text-bumble-yellow">Alex</span>!<br className="hidden sm:block"/>
            Ready for your next spark?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm sm:text-base text-slate-100 max-w-xl mx-auto font-medium drop-shadow"
          >
            Your profile is trending locally. We've matched you with active singles who share your vibe. Scroll down to review your match dashboard!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <button
              onClick={() => {
                dispatch(setActiveTab('swipe'));
                navigate('/swipe');
              }}
              className="px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest bg-bumble-yellow text-bumble-charcoal hover:bg-[#E5B519] shadow-lg shadow-bumble-yellow/15 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              Start Swiping Now
            </button>
            <button
              onClick={() => {
                dispatch(setActiveTab('membership'));
                navigate('/membership');
              }}
              className="px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest bg-white/20 hover:bg-white/35 text-white border border-white/25 backdrop-blur-md shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              View Gold Upgrades
            </button>
          </motion.div>
        </div>

      </section>

      {/* BOXED WRAPPER FOR SCROLL-DOWN SECTIONS */}
      <div className="max-w-7xl mx-auto w-full px-6 md:px-8 space-y-16 pt-0 pb-16">

        {/* 2. "WE EXIST TO BRING PEOPLE CLOSER TO LOVE" — Bumble Website Style Section */}
        <section className="w-full flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left text column */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1 space-y-6 text-left"
          >
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-bumble-charcoal">
              We exist to bring people closer to love.
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-lg font-medium">
              We want our members to find meaningful and authentic relationships that ignite confidence and joy. Meet local singles with premium discovery tags suited to your lifestyle.
            </p>
            <button 
              onClick={() => {
                dispatch(setActiveTab('swipe'));
                navigate('/swipe');
              }}
              className="px-8 py-3.5 rounded-full font-bold text-sm bg-bumble-charcoal text-white hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
            >
              Start Discovering
            </button>
          </motion.div>

          {/* Right card with vertical interest labels (Bumble Website Style) */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex-grow flex justify-center items-center select-none relative max-w-md w-full"
          >
            {/* Decorative background card (peeking behind) */}
            <div className="absolute top-6 right-[-25px] w-36 bg-white p-2.5 pb-4 rounded-2xl border border-black/5 shadow-xl overflow-hidden rotate-3 z-0">
              <img
                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=400"
                alt="Dog friend"
                className="w-full aspect-[3/4] object-cover rounded-xl"
              />
              <span className="block text-[10px] font-black mt-2 text-bumble-charcoal px-0.5">Charlie 🐕</span>
            </div>

            {/* Another decorative peeking card */}
            <div className="absolute bottom-10 right-[-15px] w-32 bg-white p-2.5 pb-4 rounded-2xl border border-black/5 shadow-xl overflow-hidden -rotate-2 z-0">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"
                alt="Friend"
                className="w-full aspect-[3/4] object-cover rounded-xl"
              />
              <span className="block text-[10px] font-black mt-2 text-bumble-charcoal px-0.5">Tiana, 30</span>
            </div>

            {/* Main profile card */}
            <div className="bg-white p-4.5 rounded-[2.5rem] border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.08)] w-80 relative overflow-hidden z-10">
              <img
                src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600"
                alt="Discover Card"
                className="w-full aspect-[3/4.2] object-cover rounded-3xl"
              />
              {/* Overlaid details */}
              <div className="absolute bottom-8 left-8 text-white z-10 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xl">Maya, 25</span>
                  <CheckCircle2 className="w-5 h-5 text-blue-400 fill-current" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 to-transparent pointer-events-none rounded-b-[2.5rem]" />

              {/* VERTICAL INTEREST LABELS (Exactly like Bumble.com) */}
              <span className="absolute top-10 right-6 bg-bumble-yellow text-bumble-charcoal font-black text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest origin-top-right rotate-90 shadow-lg border border-white/10">
                Outdoors
              </span>
              <span className="absolute top-36 right-6 bg-bumble-yellow text-bumble-charcoal font-black text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest origin-top-right rotate-90 shadow-lg border border-white/10">
                Running
              </span>
              <span className="absolute top-60 right-6 bg-bumble-yellow text-bumble-charcoal font-black text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest origin-top-right rotate-90 shadow-lg border border-white/10">
                Dog Parent
              </span>
            </div>
          </motion.div>

        </section>

        {/* 4. SHARE YOUR IDEAS — MEMBER CIRCLE SECTION */}
        <section className="w-full bg-bumble-light-gray rounded-[2.5rem] p-10 md:p-14">
          <div className="flex flex-col md:flex-row items-center gap-16 text-left">
            
            {/* Square Picture with Member Circle Seal */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex-1 relative max-w-sm w-full select-none"
            >
              <img 
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600" 
                alt="Circle Couple"
                className="w-full aspect-[4/3.8] object-cover rounded-[2.5rem] border border-black/5 shadow-xl"
              />
              {/* MEMBER CIRCLE SEAL */}
              <div className="absolute bottom-[-20px] left-[-20px] w-28 h-28 rounded-full bg-[#E5B519] border-4 border-white shadow-2xl flex items-center justify-center rotate-[-12deg] select-none p-1.5">
                <div className="w-full h-full border-2 border-dashed border-white/30 rounded-full flex flex-col items-center justify-center text-center">
                  <span className="text-[7.5px] font-black uppercase tracking-widest text-bumble-charcoal">★ Member ★</span>
                  <div className="w-8 h-[2px] bg-bumble-charcoal my-1 rounded" />
                  <span className="text-[7.5px] font-black uppercase tracking-widest text-bumble-charcoal">Circle</span>
                </div>
              </div>
            </motion.div>

            {/* Slogan Details */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex-1 space-y-6"
            >
              <h2 className="text-4xl sm:text-5xl font-black text-bumble-charcoal tracking-tight leading-none">
                Share your ideas
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed max-w-md font-medium">
                Help shape the future of Bumble by joining our Member Circle. This select community of members shares ideas directly with our team through chats, discussions, and product tests.
              </p>
              <button 
                onClick={() => {
                  dispatch(setActiveTab('membership'));
                  navigate('/membership');
                }}
                className="px-8 py-3 bg-bumble-charcoal text-white hover:bg-black rounded-full font-bold text-xs uppercase tracking-widest cursor-pointer transition-colors shadow"
              >
                Sign up
              </button>
            </motion.div>

          </div>
        </section>

        {/* 5. DUAL DATE/BFF CARDS */}
        <section className="w-full">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Card 1: HoneyGlow Date */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-bumble-yellow rounded-[2.5rem] p-10 flex flex-col justify-between text-left h-[520px] border border-black/5 shadow-lg relative overflow-hidden"
            >
              {/* Phone graphic visualization placeholder */}
              <div className="bg-white rounded-2xl p-4 shadow-xl border border-black/5 flex-grow mb-6 overflow-hidden relative max-w-xs mx-auto w-full">
                <div className="absolute top-6 right-6 text-[9px] bg-blue-500 text-white font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  ID Verified
                </div>
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=500"
                  alt="Date Preview"
                  className="w-full h-44 object-cover rounded-xl mb-3"
                />
                <span className="font-extrabold text-sm block text-bumble-charcoal">Tiana, 30</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Looking for connection</span>
              </div>
              <div>
                <h3 className="text-3xl font-black text-bumble-charcoal mb-2">Bumble Date</h3>
                <p className="text-bumble-charcoal/80 text-xs leading-relaxed max-w-sm mb-5 font-semibold">
                  Whether you're new to dating or ready to try again, Bumble Date is built to bring you closer to love safely and meaningfully.
                </p>
                <button 
                  onClick={() => {
                    dispatch(setActiveTab('swipe'));
                    navigate('/swipe');
                  }}
                  className="text-xs text-bumble-charcoal font-black underline cursor-pointer flex items-center gap-1.5"
                >
                  <span>Find your person</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            {/* Card 2: HoneyGlow BFF */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-[#FFEBA2] rounded-[2.5rem] p-10 flex flex-col justify-between text-left h-[520px] border border-black/5 shadow-lg relative overflow-hidden"
            >
              {/* Phone graphic visualization placeholder */}
              <div className="bg-white rounded-2xl p-4 shadow-xl border border-black/5 flex-grow mb-6 overflow-hidden relative max-w-xs mx-auto w-full">
                <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-bumble-yellow flex items-center justify-center shadow">
                  <Heart className="w-5 h-5 text-bumble-charcoal fill-current animate-pulse" />
                </div>
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=500"
                  alt="BFF Preview"
                  className="w-full h-44 object-cover rounded-xl mb-3"
                />
                <span className="font-extrabold text-sm block text-bumble-charcoal">Book club</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Events • Chat</span>
              </div>
              <div>
                <h3 className="text-3xl font-black text-bumble-charcoal mb-2">BFF</h3>
                <p className="text-bumble-charcoal/80 text-xs leading-relaxed max-w-sm mb-5 font-semibold">
                  Whether you've moved to a new city or just want to expand your circle, BFF makes it easy to meet like-minded friends who match your vibe.
                </p>
                <button 
                  onClick={() => navigate('/auth')}
                  className="text-xs text-bumble-charcoal font-black underline cursor-pointer flex items-center gap-1.5"
                >
                  <span>Find your people</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

          </div>
        </section>

        {/* 6. SUCCESS STORY QUOTE */}
        <section className="w-full bg-bumble-light-gray rounded-[2.5rem] p-10 md:p-14 flex flex-col md:flex-row items-center gap-16 text-left relative overflow-hidden border border-black/5">
          
          {/* Quote details */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex-1 space-y-6 z-10"
          >
            <span className="text-7xl font-serif text-bumble-yellow block mb-[-25px] leading-none">"</span>
            <p className="text-2xl sm:text-4xl font-black text-bumble-charcoal leading-tight">
              We are both naturally positive, happy-go-getters, but when you put us together, it feels like there is nothing we can't accomplish.
            </p>
            <div>
              <h4 className="font-extrabold text-base text-bumble-charcoal">Leslie & Thomas</h4>
              <span className="text-xs text-slate-500 font-semibold block mt-0.5">Married in 2025</span>
            </div>
            <button 
              onClick={() => navigate('/auth')}
              className="px-8 py-3.5 bg-bumble-charcoal hover:bg-black text-white rounded-full font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
            >
              Read more stories
            </button>
          </motion.div>

          {/* Grayscale Visual Couple Card */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex-1 max-w-sm w-full select-none"
          >
            <img
              src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600"
              alt="Success Couple"
              className="w-full aspect-[3/3.8] object-cover rounded-3xl shadow-2xl filter grayscale border border-black/5"
            />
          </motion.div>

        </section>

        {/* 7. PREMIUM PLAN BANNER */}
        <section className="w-full">
          <div className="bg-[#FFEBA2] rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 border border-black/5 shadow-lg relative overflow-hidden text-left">
            {/* Glow backdrop blob */}
            <div className="absolute top-[-30%] right-[-10%] w-80 h-80 rounded-full bg-white/20 blur-[60px] pointer-events-none" />
            
            <div className="space-y-4 max-w-xl relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bumble-charcoal text-white text-[10px] font-bold uppercase tracking-widest">
                <Star className="w-3.5 h-3.5 text-bumble-yellow fill-current" />
                <span>HoneyGlow Elite Lounge</span>
              </div>
              <h2 className="text-3xl sm:text-4.5xl font-black text-bumble-charcoal leading-none">
                Double your match rates today!
              </h2>
              <p className="text-bumble-charcoal/80 text-xs font-semibold leading-relaxed">
                Unlock the special premium package to view who liked your profile first, access filters, activate spotlights, and access advanced custom spark prompt cards.
              </p>
            </div>

            <button
              onClick={() => {
                dispatch(setActiveTab('membership'));
                navigate('/membership');
              }}
              className="px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest bg-bumble-yellow hover:bg-[#E5B519] text-bumble-charcoal shadow-xl hover:scale-105 active:scale-95 transition-all shrink-0 z-10 cursor-pointer border border-bumble-yellow/10"
            >
              Upgrade to Premium Pro
            </button>
          </div>
        </section>

      </div>

      {/* 8. FULL-WIDTH FOOTER (Outside the max-w wrapper) */}
      <footer className="w-full bg-white border-t border-slate-100 relative z-10 text-left mt-auto">
        <div className="w-full px-8 md:px-16 lg:px-24 pt-16 pb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            
            {/* Logo & Slogan Column */}
            <div className="col-span-2 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <img src={landscapeLogo} alt="Inakkam" className="h-10 w-auto filter invert" />
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm font-semibold">
                Find authentic, meaningful connections that spark confidence and joy. Built with premium light details, editable matchmaking profiles, and real-time chat.
              </p>
              <div className="flex gap-3 text-slate-400 pt-2">
                <Users className="w-4 h-4 hover:text-bumble-charcoal cursor-pointer transition-colors" />
                <Heart className="w-4 h-4 hover:text-bumble-charcoal cursor-pointer transition-colors" />
                <MessageSquare className="w-4 h-4 hover:text-bumble-charcoal cursor-pointer transition-colors" />
              </div>
            </div>

            {/* Useful Navigation links */}
            <div className="space-y-3">
              <h4 className="font-black text-xs uppercase tracking-wider text-bumble-charcoal">Features</h4>
              <div className="flex flex-col gap-2.5 text-xs text-slate-500 font-semibold text-left">
                <span onClick={() => { dispatch(setActiveTab('swipe')); navigate('/swipe'); }} className="hover:text-bumble-yellow cursor-pointer transition-colors">Discover matches</span>
                <span onClick={() => { dispatch(setActiveTab('chat')); navigate('/chat'); }} className="hover:text-bumble-yellow cursor-pointer transition-colors">Chat Inbox</span>
                <span onClick={() => { dispatch(setActiveTab('membership')); navigate('/membership'); }} className="hover:text-bumble-yellow cursor-pointer transition-colors">Premium Deals</span>
                <span onClick={() => { dispatch(setActiveTab('profile')); navigate('/profile'); }} className="hover:text-bumble-yellow cursor-pointer transition-colors">My Profile Details</span>
              </div>
            </div>

            {/* Legal / safety links */}
            <div className="space-y-3">
              <h4 className="font-black text-xs uppercase tracking-wider text-bumble-charcoal">Trust & Safety</h4>
              <div className="flex flex-col gap-2.5 text-xs text-slate-500 font-semibold text-left">
                <span className="hover:text-bumble-yellow cursor-pointer transition-colors">Safety Center</span>
                <span className="hover:text-bumble-yellow cursor-pointer transition-colors">Community Rules</span>
                <span className="hover:text-bumble-yellow cursor-pointer transition-colors">Privacy Agreement</span>
                <span className="hover:text-bumble-yellow cursor-pointer transition-colors">Cookie Options</span>
              </div>
            </div>

          </div>

          {/* Bottom copyright details */}
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-semibold">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-bumble-yellow" />
              <span>Encrypted Connections Verified</span>
            </div>
            <span>&copy; {new Date().getFullYear()} Bumble HoneyGlow Inc. All rights reserved.</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
