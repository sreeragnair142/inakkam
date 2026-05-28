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
  Info, 
  ChevronDown, 
  MessageSquare,
  Sparkles,
  Flame,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import confetti from 'canvas-confetti';

const Discover = () => {
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.theme.mode);
  
  // Redux States
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

  // Motion Values for Top Card
  const motionX = useMotionValue(0);
  const motionY = useMotionValue(0);
  
  // Transform drag values to tilt/scale/stamps opacity
  const rotate = useTransform(motionX, [-200, 200], [-15, 15]);
  const scale = useTransform(motionX, [-150, 0, 150], [0.95, 1, 0.95]);
  const stampLikeOpacity = useTransform(motionX, [0, 100], [0, 1]);
  const stampNopeOpacity = useTransform(motionX, [-100, 0], [1, 0]);

  const controls = useAnimation();

  // Reset active image/details when changing cards
  useEffect(() => {
    setActiveImageIndex(0);
    setExpandedInfo(false);
  }, [swipeIndex]);

  // Swipe handlers
  const animateSwipe = async (direction) => {
    if (!activeProfile) return;
    
    if (direction === 'right') {
      await controls.start({ x: 400, opacity: 0, rotate: 20, transition: { duration: 0.3 } });
      handleSwipeRight();
    } else {
      await controls.start({ x: -400, opacity: 0, rotate: -20, transition: { duration: 0.3 } });
      handleSwipeLeft();
    }
    // Reset positions for next card
    motionX.set(0);
    motionY.set(0);
  };

  const handleSwipeLeft = () => {
    dispatch(swipeLeft());
  };

  const handleSwipeRight = () => {
    // Check if it will be a match (using userSlice rules)
    const willMatch = activeProfile.matchPercentage > 90 || Math.random() > 0.3;
    
    dispatch(swipeRight());
    
    if (willMatch) {
      // Trigger canvas-confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
      
      // Dispatch match modal
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
    if (swipeHistory.length > 0) {
      dispatch(undoSwipe());
    }
  };

  // Drag End triggers
  const handleDragEnd = (event, info) => {
    const threshold = 140;
    if (info.offset.x > threshold) {
      animateSwipe('right');
    } else if (info.offset.x < -threshold) {
      animateSwipe('left');
    } else {
      controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } });
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative min-h-[70vh] lg:min-h-[85vh] py-6 lg:py-8 pb-4">
      
      {/* FULL WIDTH DYNAMIC BACKGROUND IMAGE */}
      {activeProfile && (
        <div className="absolute inset-0 z-0">
          <motion.img 
            key={activeProfile.images[activeImageIndex]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            src={activeProfile.images[activeImageIndex]}
            className="w-full h-full object-cover filter blur-[40px] scale-110 brightness-[0.4]"
            alt="background"
          />
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        </div>
      )}

      {/* Cards stack viewport */}
      <div className="w-full max-w-[500px] aspect-[3/4.2] relative mb-10 select-none px-4 z-10">
        
        {activeProfile ? (
          <>
            {/* NEXT CARD (Underneath) */}
            {nextProfile && (
              <div 
                className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-xl flex flex-col justify-end p-6 select-none scale-[0.94] translate-y-4 opacity-80 transition-all duration-500 border border-white/20"
              >
                <img 
                  src={nextProfile.images[0]} 
                  alt={nextProfile.name} 
                  className="absolute inset-0 w-full h-full object-cover filter brightness-[0.6]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="relative z-10 text-white">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-2xl">{nextProfile.name}, {nextProfile.age}</h3>
                    {nextProfile.verified && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
                  </div>
                  <p className="text-white/60 text-xs mt-1">{nextProfile.work}</p>
                </div>
              </div>
            )}

            {/* ACTIVE TOP CARD (Draggable) */}
            <motion.div
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              onDragEnd={handleDragEnd}
              style={{ x: motionX, y: motionY, rotate, scale, touchAction: 'none' }}
              animate={controls}
              className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col cursor-grab active:cursor-grabbing select-none z-20 bg-white border border-white/30"
            >
              {/* Profile Image & Image indicators */}
              <div className="relative w-full h-full overflow-hidden flex flex-col justify-between p-6">
                
                {/* Background Image Carousel */}
                <img 
                  src={activeProfile.images[activeImageIndex]} 
                  alt={activeProfile.name} 
                  className="absolute inset-0 w-full h-full object-cover filter brightness-[0.78] transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/10 pointer-events-none" />

                {/* LIKE / NOPE Drag Stamps */}
                <motion.div 
                  style={{ opacity: stampLikeOpacity }}
                  className="absolute top-16 left-8 border-4 border-emerald-400 text-emerald-400 font-black text-4xl px-5 py-2 rounded-2xl rotate-[-12deg] tracking-widest uppercase pointer-events-none z-30 backdrop-blur-sm bg-emerald-500/10"
                >
                  LIKE
                </motion.div>
                <motion.div 
                  style={{ opacity: stampNopeOpacity }}
                  className="absolute top-16 right-8 border-4 border-rose-400 text-rose-400 font-black text-4xl px-5 py-2 rounded-2xl rotate-[12deg] tracking-widest uppercase pointer-events-none z-30 backdrop-blur-sm bg-rose-500/10"
                >
                  NOPE
                </motion.div>

                {/* Carousel indicators */}
                <div className="relative z-10 flex gap-1.5 w-full justify-center">
                  {activeProfile.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex(idx);
                      }}
                      className={`h-1 flex-1 rounded-full transition-all duration-300
                        ${idx === activeImageIndex ? 'bg-bumble-yellow shadow-sm shadow-bumble-yellow/50' : 'bg-white/30'}`}
                    />
                  ))}
                </div>

                {/* Left/Right image switcher click zones */}
                <div className="absolute inset-x-0 top-1/4 bottom-1/3 flex z-10">
                  <div 
                    className="w-1/2 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(prev => Math.max(0, prev - 1));
                    }}
                  />
                  <div 
                    className="w-1/2 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(prev => Math.min(activeProfile.images.length - 1, prev + 1));
                    }}
                  />
                </div>

                {/* Card brief info (pinned on bottom) */}
                <div className="relative z-20 text-white mt-auto space-y-3">
                  
                  {/* Badge & Distance row */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black bg-bumble-yellow text-bumble-charcoal px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
                      {activeProfile.matchPercentage}% Match
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-white/80 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{activeProfile.distance}</span>
                    </div>
                  </div>

                  {/* Name, Age, Verified badge */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-3xl font-black tracking-tight">{activeProfile.name}, {activeProfile.age}</h2>
                      {activeProfile.verified && <CheckCircle2 className="w-6 h-6 text-blue-400 fill-blue-400/20" />}
                    </div>
                    <p className="text-white/60 text-sm mt-1 font-medium">{activeProfile.work} • {activeProfile.education}</p>
                  </div>

                  {/* Interests preview chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {activeProfile.interests.slice(0, 4).map((interest, idx) => (
                      <span 
                        key={idx}
                        className="text-[10px] px-3 py-1.5 rounded-full font-bold bg-white/10 backdrop-blur-sm border border-white/15 text-white/90"
                      >
                        {interest}
                      </span>
                    ))}
                    {activeProfile.interests.length > 4 && (
                      <span className="text-[10px] px-3 py-1.5 rounded-full font-bold bg-white/10 backdrop-blur-sm border border-white/15 text-white/60">
                        +{activeProfile.interests.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Expand Info Trigger */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedInfo(!expandedInfo);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-xs font-bold backdrop-blur-md transition-all"
                  >
                    <Info className="w-4 h-4" />
                    <span>{expandedInfo ? 'Collapse Details' : 'View Full Details'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expandedInfo ? 'rotate-180' : ''}`} />
                  </button>

                </div>

              </div>

              {/* Collapsible Info Drawer (Details scrolling) */}
              <AnimatePresence>
                {expandedInfo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white border-t border-slate-100 overflow-y-auto max-h-[55%] z-30"
                  >
                    <div className="p-6 space-y-6">
                    
                      {/* Bio */}
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">About Me</h4>
                        <p className="text-sm leading-relaxed text-bumble-charcoal">{activeProfile.bio}</p>
                      </div>

                      {/* Prompts answers */}
                      {activeProfile.prompts && activeProfile.prompts.map((p, idx) => (
                        <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <span className="text-[10px] bg-bumble-yellow/20 text-bumble-charcoal px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                            {p.question}
                          </span>
                          <p className="text-sm font-bold mt-3 italic leading-relaxed text-bumble-charcoal">
                            "{p.answer}"
                          </p>
                        </div>
                      ))}

                      {/* Attributes Details grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Zodiac', value: activeProfile.zodiac, emoji: '✨' },
                          { label: 'Height', value: activeProfile.height, emoji: '📏' },
                          { label: 'Goal', value: activeProfile.relationship, emoji: '❤️' },
                          { label: 'Exercise', value: activeProfile.exercise, emoji: '🏃' },
                        ].map((attr, idx) => (
                          <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                            <span className="text-lg block mb-1">{attr.emoji}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{attr.label}</span>
                            <span className="text-xs font-black text-bumble-charcoal block mt-0.5">{attr.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Full Interests list */}
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">All Interests</h4>
                        <div className="flex flex-wrap gap-2">
                          {activeProfile.interests.map((interest, idx) => (
                            <span 
                              key={idx}
                              className="text-xs px-3.5 py-2 rounded-xl font-bold bg-slate-50 border border-slate-200 text-bumble-charcoal hover:bg-bumble-yellow/10 hover:border-bumble-yellow/30 transition-colors"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          </>
        ) : (
          /* Empty Card State */
          <div className="absolute inset-0 rounded-[2rem] flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-200 shadow-xl">
            <div className="w-20 h-20 rounded-full bg-bumble-yellow/10 flex items-center justify-center border-2 border-bumble-yellow/20 mb-6">
              <Sparkles className="w-10 h-10 text-bumble-yellow" />
            </div>
            <h3 className="font-black text-2xl mb-2 text-bumble-charcoal">You've Swiped Everyone!</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-xs">
              No new profiles in your area right now. Expand your filters or upgrade to Premium.
            </p>
            <button
              onClick={() => dispatch({ type: 'user/resetSwipes' })}
              className="px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-widest bg-bumble-charcoal text-white shadow-xl hover:bg-black transition-colors cursor-pointer"
            >
              Reset Swipes
            </button>
          </div>
        )}

      </div>

      {/* Swipe Floating Action Buttons */}
      {activeProfile && (
        <div className="flex items-center justify-center gap-5 relative z-20">
          
          {/* Rewind */}
          <button
            onClick={handleUndo}
            disabled={swipeHistory.length === 0}
            className={`p-4 rounded-full transition-all duration-300 shadow-lg border-2 group
              ${swipeHistory.length === 0
                ? 'opacity-30 cursor-not-allowed border-slate-200 bg-white'
                : 'bg-white border-slate-200 text-slate-400 hover:text-bumble-yellow hover:border-bumble-yellow hover:scale-110 active:scale-90 hover:shadow-bumble-yellow/20 cursor-pointer'
              }`}
          >
            <RotateCcw className="w-5 h-5 group-hover:rotate-[-45deg] transition-transform" />
          </button>

          {/* Dislike */}
          <button
            onClick={() => animateSwipe('left')}
            className="p-5 rounded-full shadow-xl transition-all duration-300 border-2 hover:scale-110 active:scale-90 bg-white border-rose-200 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:shadow-rose-500/30 cursor-pointer"
          >
            <X className="w-7 h-7" strokeWidth={3} />
          </button>

          {/* Super Like */}
          <button
            onClick={() => {
              confetti({ particleCount: 80, spread: 50 });
              animateSwipe('right');
            }}
            className="p-4 rounded-full shadow-lg transition-all duration-300 border-2 hover:scale-110 active:scale-90 bg-white border-blue-200 text-blue-500 hover:bg-blue-500 hover:text-white hover:border-blue-500 hover:shadow-blue-500/30 cursor-pointer"
          >
            <Star className="w-5 h-5 fill-current" />
          </button>

          {/* Like */}
          <button
            onClick={() => animateSwipe('right')}
            className="p-5 rounded-full shadow-xl transition-all duration-300 border-2 hover:scale-110 active:scale-90 bg-white border-emerald-200 text-emerald-500 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:shadow-emerald-500/30 cursor-pointer"
          >
            <Heart className="w-7 h-7 fill-current" />
          </button>

        </div>
      )}

      {/* IT'S A MATCH! FULL MODAL OVERLAY */}
      <AnimatePresence>
        {isMatchedOpen && matchedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-lg flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.85, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white max-w-md w-full p-10 rounded-[2.5rem] text-center border border-slate-100 shadow-2xl relative overflow-hidden"
            >
              {/* Sparkles background effect */}
              <div className="absolute top-[-30%] left-[-30%] w-96 h-96 rounded-full bg-gradient-to-tr from-bumble-yellow/30 to-rose-300/20 opacity-50 blur-[80px] pointer-events-none" />
              <div className="absolute bottom-[-20%] right-[-20%] w-64 h-64 rounded-full bg-gradient-to-bl from-emerald-200/20 to-blue-200/20 opacity-40 blur-[60px] pointer-events-none" />
              
              <div className="w-20 h-20 bg-bumble-yellow rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-bumble-yellow/30 rotate-12 relative z-10">
                <Heart className="w-10 h-10 text-bumble-charcoal fill-current animate-pulse" />
              </div>

              <h2 className="text-4xl font-black tracking-tight mb-3 text-bumble-charcoal relative z-10 font-serif italic">It's a Spark!</h2>
              <p className="text-slate-500 text-sm mb-10 relative z-10">
                You and <span className="text-bumble-charcoal font-bold">{matchedUser.name}</span> liked each other
              </p>

              {/* Profiles overlapping visual circles */}
              <div className="flex justify-center items-center gap-0 mb-10 relative z-10">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-2xl relative z-10 -mr-6 hover:scale-105 transition-transform duration-300 ring-4 ring-bumble-yellow/20">
                  <img src={currentUser?.images[0]} alt={currentUser?.name} className="w-full h-full object-cover" />
                </div>
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-2xl relative z-10 hover:scale-105 transition-transform duration-300 ring-4 ring-bumble-yellow/20">
                  <img src={matchedUser.images[0]} alt={matchedUser.name} className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3 relative z-10">
                <button
                  onClick={() => {
                    dispatch(setMatchedModal({ isOpen: false }));
                    dispatch({ type: 'ui/setActiveTab', payload: 'chat' });
                  }}
                  className="w-full py-4 rounded-2xl text-xs uppercase tracking-widest font-black bg-bumble-charcoal text-white shadow-xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>Send Message</span>
                </button>

                <button
                  onClick={() => dispatch(setMatchedModal({ isOpen: false }))}
                  className="w-full py-4 rounded-2xl text-xs uppercase tracking-widest font-bold bg-slate-50 text-bumble-charcoal border border-slate-200 hover:bg-slate-100 active:scale-[0.98] transition-all cursor-pointer"
                >
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
