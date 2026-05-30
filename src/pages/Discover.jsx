import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { swipeLeft, swipeRight, undoSwipe } from '../redux/slices/userSlice';
import { setMatchedModal } from '../redux/slices/uiSlice';
import { createNewChat } from '../redux/slices/chatSlice';
import { addNotification } from '../redux/slices/notificationSlice';
import { 
  X, 
  Heart, 
  RotateCcw, 
  Star, 
  MapPin, 
  CheckCircle2, 
  MessageSquare,
  Sparkles,
  Flame,
  Globe,
  Target,
  BookOpen,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import confetti from 'canvas-confetti';

const Discover = () => {
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.theme.mode);
  
  const discoveredUsers = useSelector((state) => state.user.discoveredUsers);
  const swipeIndex = useSelector((state) => state.user.currentSwipeIndex);
  const swipeHistory = useSelector((state) => state.user.swipeHistory);
  const isMatchedOpen = useSelector((state) => state.ui.isMatchedModalOpen);
  const matchedUser = useSelector((state) => state.ui.lastMatchedUser);
  const currentUser = useSelector((state) => state.auth.user);

  const activeProfile = discoveredUsers[swipeIndex];
  const nextProfile = discoveredUsers[swipeIndex + 1];

  const [expandedInfo, setExpandedInfo] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const motionX = useMotionValue(0);
  const motionY = useMotionValue(0);
  const rotate = useTransform(motionX, [-200, 200], [-15, 15]);
  const scale = useTransform(motionX, [-150, 0, 150], [0.95, 1, 0.95]);
  const stampLikeOpacity = useTransform(motionX, [0, 100], [0, 1]);
  const stampNopeOpacity = useTransform(motionX, [-100, 0], [1, 0]);
  const controls = useAnimation();

  useEffect(() => {
    setActiveImageIndex(0);
    setExpandedInfo(false);
  }, [swipeIndex]);

  const animateSwipe = async (direction) => {
    if (!activeProfile) return;
    if (direction === 'right') {
      await controls.start({ x: 400, opacity: 0, rotate: 20, transition: { duration: 0.3 } });
      handleSwipeRight();
    } else {
      await controls.start({ x: -400, opacity: 0, rotate: -20, transition: { duration: 0.3 } });
      handleSwipeLeft();
    }
    motionX.set(0);
    motionY.set(0);
  };

  const handleSwipeLeft = () => { dispatch(swipeLeft()); };

  const handleSwipeRight = () => {
    const willMatch = activeProfile.matchPercentage > 90 || Math.random() > 0.3;
    dispatch(swipeRight());
    if (willMatch) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      dispatch(setMatchedModal({ isOpen: true, user: activeProfile }));
      dispatch(createNewChat(activeProfile));
      dispatch(addNotification({
        type: 'match',
        userId: activeProfile.id,
        userName: activeProfile.name,
        text: `You and ${activeProfile.name} matched! Send a greeting.`
      }));
    }
  };

  const handleUndo = () => {
    if (swipeHistory.length > 0) dispatch(undoSwipe());
  };

  const handleDragEnd = (event, info) => {
    const threshold = 140;
    if (info.offset.x > threshold) animateSwipe('right');
    else if (info.offset.x < -threshold) animateSwipe('left');
    else controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } });
  };

  // Extra mock data for the detailed panel
  const languages = activeProfile ? ['English 🇬🇧', 'Bengali 🇮🇳'] : [];
  const relationshipGoals = activeProfile ? ['Dating 💕'] : [];
  const religion = activeProfile ? 'Spiritual 🙏' : '';

  return (
    <div className="flex-1 flex items-center justify-center relative min-h-[80vh] lg:min-h-[90vh] pt-24 pb-8 lg:pt-32 lg:pb-12 px-4">
      
      {/* Background blur */}
      {activeProfile && (
        <div className="absolute inset-0 z-0">
          <motion.img 
            key={activeProfile.images[activeImageIndex]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            src={activeProfile.images[activeImageIndex]}
            className="w-full h-full object-cover filter blur-[40px] scale-110 brightness-[0.35]"
            alt="background"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}

      {activeProfile ? (
        <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-stretch gap-6 w-full max-w-5xl">
          
          {/* LEFT: Photo Card with Swipe */}
          <div className="w-full max-w-[380px] lg:w-[380px] flex-shrink-0 flex flex-col items-center">
            <div className="w-full aspect-[3/4] relative mb-6 select-none">
              
              {/* Next card underneath */}
              {nextProfile && (
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-xl scale-[0.94] translate-y-3 opacity-70 border border-white/10">
                  <img src={nextProfile.images[0]} alt={nextProfile.name} className="w-full h-full object-cover brightness-[0.5]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                </div>
              )}

              {/* Active draggable card */}
              <motion.div
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                onDragEnd={handleDragEnd}
                style={{ x: motionX, y: motionY, rotate, scale, touchAction: 'none' }}
                animate={controls}
                className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing select-none z-20 bg-white border border-white/20"
              >
                <div className="relative w-full h-full overflow-hidden flex flex-col justify-between p-5">
                  <img 
                    src={activeProfile.images[activeImageIndex]} 
                    alt={activeProfile.name} 
                    className="absolute inset-0 w-full h-full object-cover brightness-[0.75] transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5 pointer-events-none" />

                  {/* Stamps */}
                  <motion.div style={{ opacity: stampLikeOpacity }} className="absolute top-14 left-6 border-4 border-emerald-400 text-emerald-400 font-black text-3xl px-4 py-1.5 rounded-2xl rotate-[-12deg] uppercase pointer-events-none z-30 backdrop-blur-sm bg-emerald-500/10">LIKE</motion.div>
                  <motion.div style={{ opacity: stampNopeOpacity }} className="absolute top-14 right-6 border-4 border-rose-400 text-rose-400 font-black text-3xl px-4 py-1.5 rounded-2xl rotate-[12deg] uppercase pointer-events-none z-30 backdrop-blur-sm bg-rose-500/10">NOPE</motion.div>

                  {/* Image indicators */}
                  <div className="relative z-10 flex gap-1.5 w-full justify-center">
                    {activeProfile.images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setActiveImageIndex(idx); }}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${idx === activeImageIndex ? 'bg-bumble-yellow shadow-sm shadow-bumble-yellow/50' : 'bg-white/30'}`}
                      />
                    ))}
                  </div>

                  {/* Click zones for image switching */}
                  <div className="absolute inset-x-0 top-1/4 bottom-1/3 flex z-10">
                    <div className="w-1/2 cursor-pointer" onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => Math.max(0, prev - 1)); }} />
                    <div className="w-1/2 cursor-pointer" onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => Math.min(activeProfile.images.length - 1, prev + 1)); }} />
                  </div>

                  {/* Bottom info on card */}
                  <div className="relative z-20 text-white mt-auto space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black bg-bumble-yellow text-bumble-charcoal px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
                        {activeProfile.matchPercentage}% Match
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-white/80 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                        <MapPin className="w-3 h-3" />
                        <span>{activeProfile.distance}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black tracking-tight">{activeProfile.name}, {activeProfile.age}</h2>
                      {activeProfile.verified && <CheckCircle2 className="w-5 h-5 text-blue-400 fill-blue-400/20" />}
                    </div>
                    <p className="text-white/60 text-xs font-medium">{activeProfile.work}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Swipe Action Buttons */}
            <div className="flex items-center justify-center gap-4 relative z-20">
              <button onClick={handleUndo} disabled={swipeHistory.length === 0}
                className={`p-3.5 rounded-full transition-all shadow-lg border-2 group ${swipeHistory.length === 0 ? 'opacity-30 cursor-not-allowed border-slate-200 bg-white' : 'bg-white border-slate-200 text-slate-400 hover:text-bumble-yellow hover:border-bumble-yellow hover:scale-110 active:scale-90 cursor-pointer'}`}>
                <RotateCcw className="w-5 h-5 group-hover:rotate-[-45deg] transition-transform" />
              </button>
              <button onClick={() => animateSwipe('left')} className="p-4.5 rounded-full shadow-xl transition-all border-2 hover:scale-110 active:scale-90 bg-white border-rose-200 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 cursor-pointer">
                <X className="w-6 h-6" strokeWidth={3} />
              </button>
              <button onClick={() => { confetti({ particleCount: 80, spread: 50 }); animateSwipe('right'); }}
                className="p-3.5 rounded-full shadow-lg transition-all border-2 hover:scale-110 active:scale-90 bg-white border-blue-200 text-blue-500 hover:bg-blue-500 hover:text-white hover:border-blue-500 cursor-pointer">
                <Star className="w-5 h-5 fill-current" />
              </button>
              <button onClick={() => animateSwipe('right')} className="p-4.5 rounded-full shadow-xl transition-all border-2 hover:scale-110 active:scale-90 bg-white border-emerald-200 text-emerald-500 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 cursor-pointer">
                <Heart className="w-6 h-6 fill-current" />
              </button>
            </div>
          </div>

          {/* RIGHT: Detailed Profile Info Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 bg-white rounded-[2rem] shadow-2xl overflow-y-auto max-h-[75vh] border border-slate-100 hidden lg:block"
          >
            <div className="p-8 space-y-7">

              {/* Name & Close */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-bumble-charcoal">{activeProfile.name} ({activeProfile.age})</h2>
                    {activeProfile.verified && <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-500/20" />}
                  </div>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {activeProfile.distance}
                  </p>
                </div>
                <button onClick={() => animateSwipe('left')} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Bio */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <p className="text-sm leading-relaxed text-bumble-charcoal flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-bumble-yellow mt-0.5 shrink-0" />
                  {activeProfile.bio}
                </p>
              </div>

              {/* Work & Education */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 tracking-wider mb-2">
                    <Briefcase className="w-3.5 h-3.5" /> Work
                  </div>
                  <p className="text-sm font-bold text-bumble-charcoal">{activeProfile.work}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 tracking-wider mb-2">
                    <GraduationCap className="w-3.5 h-3.5" /> Education
                  </div>
                  <p className="text-sm font-bold text-bumble-charcoal">{activeProfile.education}</p>
                </div>
              </div>

              {/* Interests */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {activeProfile.interests.map((interest, idx) => (
                    <span key={idx} className="text-xs px-4 py-2 rounded-full font-bold bg-bumble-yellow/10 border border-bumble-yellow/20 text-bumble-charcoal hover:bg-bumble-yellow/20 transition-colors">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Languages I Know
                </h4>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang, idx) => (
                    <span key={idx} className="text-xs px-4 py-2 rounded-full font-bold bg-blue-50 border border-blue-100 text-blue-700">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              {/* Relationship Goals */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> Relationship Goals
                </h4>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-4 py-2 rounded-full font-bold bg-rose-50 border border-rose-100 text-rose-600">
                    {activeProfile.relationship}
                  </span>
                </div>
              </div>

              {/* Religion */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Religion</h4>
                <span className="text-xs px-4 py-2 rounded-full font-bold bg-purple-50 border border-purple-100 text-purple-600">
                  {religion}
                </span>
              </div>

              {/* Prompts */}
              {activeProfile.prompts && activeProfile.prompts.map((p, idx) => (
                <div key={idx} className="bg-bumble-yellow/5 p-5 rounded-2xl border border-bumble-yellow/10">
                  <span className="text-[10px] bg-bumble-yellow/20 text-bumble-charcoal px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                    {p.question}
                  </span>
                  <p className="text-sm font-bold mt-3 italic leading-relaxed text-bumble-charcoal">"{p.answer}"</p>
                </div>
              ))}

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Zodiac', value: activeProfile.zodiac, emoji: '✨' },
                  { label: 'Height', value: activeProfile.height, emoji: '📏' },
                  { label: 'Exercise', value: activeProfile.exercise, emoji: '🏃' },
                  { label: 'Match', value: `${activeProfile.matchPercentage}%`, emoji: '💯' },
                ].map((attr, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center hover:bg-slate-100 transition-colors">
                    <span className="text-lg block mb-1">{attr.emoji}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{attr.label}</span>
                    <span className="text-xs font-black text-bumble-charcoal block mt-0.5">{attr.value}</span>
                  </div>
                ))}
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => animateSwipe('left')} className="flex-1 py-3.5 rounded-2xl text-xs uppercase tracking-widest font-black bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <X className="w-4 h-4" /> Pass
                </button>
                <button onClick={() => animateSwipe('right')} className="flex-1 py-3.5 rounded-2xl text-xs uppercase tracking-widest font-black bg-bumble-charcoal text-white hover:bg-black shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <Heart className="w-4 h-4 fill-current" /> Like
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        /* Empty State */
        <div className="relative z-10 max-w-md w-full p-10 rounded-[2.5rem] text-center bg-white border border-slate-200 shadow-xl">
          <div className="w-20 h-20 rounded-full bg-bumble-yellow/10 flex items-center justify-center border-2 border-bumble-yellow/20 mb-6 mx-auto">
            <Sparkles className="w-10 h-10 text-bumble-yellow" />
          </div>
          <h3 className="font-black text-2xl mb-2 text-bumble-charcoal">You've Swiped Everyone!</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">No new profiles in your area right now. Expand your filters or upgrade to Premium.</p>
          <button onClick={() => dispatch({ type: 'user/resetSwipes' })} className="px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-widest bg-bumble-charcoal text-white shadow-xl hover:bg-black transition-colors cursor-pointer">
            Reset Swipes
          </button>
        </div>
      )}

      {/* MATCH MODAL */}
      <AnimatePresence>
        {isMatchedOpen && matchedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-lg flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.85, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 40 }} transition={{ type: 'spring', damping: 25, stiffness: 350 }} className="bg-white max-w-md w-full p-10 rounded-[2.5rem] text-center border border-slate-100 shadow-2xl relative overflow-hidden">
              <div className="absolute top-[-30%] left-[-30%] w-96 h-96 rounded-full bg-gradient-to-tr from-bumble-yellow/30 to-rose-300/20 opacity-50 blur-[80px] pointer-events-none" />
              <div className="w-20 h-20 bg-bumble-yellow rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-bumble-yellow/30 rotate-12 relative z-10">
                <Heart className="w-10 h-10 text-bumble-charcoal fill-current animate-pulse" />
              </div>
              <h2 className="text-4xl font-black tracking-tight mb-3 text-bumble-charcoal relative z-10 font-serif italic">It's a Spark!</h2>
              <p className="text-slate-500 text-sm mb-10 relative z-10">You and <span className="text-bumble-charcoal font-bold">{matchedUser.name}</span> liked each other</p>
              <div className="flex justify-center items-center gap-0 mb-10 relative z-10">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-2xl relative z-10 -mr-6 ring-4 ring-bumble-yellow/20">
                  <img src={currentUser?.images[0]} alt={currentUser?.name} className="w-full h-full object-cover" />
                </div>
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-2xl relative z-10 ring-4 ring-bumble-yellow/20">
                  <img src={matchedUser.images[0]} alt={matchedUser.name} className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="space-y-3 relative z-10">
                <button onClick={() => { dispatch(setMatchedModal({ isOpen: false })); dispatch({ type: 'ui/setActiveTab', payload: 'chat' }); }} className="w-full py-4 rounded-2xl text-xs uppercase tracking-widest font-black bg-bumble-charcoal text-white shadow-xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <MessageSquare className="w-4 h-4 shrink-0" /> <span>Send Message</span>
                </button>
                <button onClick={() => dispatch(setMatchedModal({ isOpen: false }))} className="w-full py-4 rounded-2xl text-xs uppercase tracking-widest font-bold bg-slate-50 text-bumble-charcoal border border-slate-200 hover:bg-slate-100 active:scale-[0.98] transition-all cursor-pointer">
                  Keep Swiping
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Discover;
