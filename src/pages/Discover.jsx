import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { setMatchedModal } from '../redux/slices/uiSlice';
import { fetchDiscoverUsers, apiSwipe } from '../redux/slices/userSlice';
import { createNewChat } from '../redux/slices/chatSlice';
import { addNotification } from '../redux/slices/notificationSlice';
import {
  X,
  Heart,
  MapPin,
  MessageSquare,
  Sparkles,
  Flame,
  Gift,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import confetti from 'canvas-confetti';

const MobileCard = ({ profile, active, onSwipe, swipeDirection, onClick }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-150, 150], [-20, 20]);
  const opacityLike = useTransform(x, [0, 80], [0, 1]);
  const opacityNope = useTransform(x, [-80, 0], [1, 0]);

  const handleDragEnd = (event, info) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      onSwipe('like');
    } else if (info.offset.x < -threshold) {
      onSwipe('pass');
    }
  };

  const ringStrokeOffset = 100 - (profile.matchPercentage || 0);

  return (
    <motion.div
      style={{ x, rotate }}
      drag={active ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.02 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{
        x: swipeDirection === 'right' ? 800 : swipeDirection === 'left' ? -800 : 0,
        rotate: swipeDirection === 'right' ? 30 : swipeDirection === 'left' ? -30 : 0,
        opacity: 0,
        transition: { duration: 0.35 }
      }}
      onClick={onClick}
      className="absolute inset-0 w-full h-full rounded-[2rem] overflow-hidden border border-slate-200 shadow-2xl bg-[#FCFAF2] cursor-grab active:cursor-grabbing select-none z-10"
    >
      <img src={profile.images?.[0] || 'https://via.placeholder.com/400x500'} alt={profile.name} className="w-full h-full object-cover pointer-events-none select-none" />
      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />

      {/* Verified Agent / Host Badge Overlay */}
      {(profile.isEliteAgent || profile.isStaff || profile.role === 'staff') && (
        <div className="absolute top-4 left-4 bg-gradient-to-r from-[#D51659] to-[#b44ddc] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 z-20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Verified Host</span>
        </div>
      )}

      {/* Swipe Indicators */}
      <motion.div
        style={{ opacity: opacityLike }}
        className="absolute top-8 left-8 border-4 border-green-500 text-green-500 font-extrabold text-2xl uppercase tracking-widest px-4 py-2 rounded-xl rotate-[-12deg] pointer-events-none z-30"
      >
        LIKE
      </motion.div>
      <motion.div
        style={{ opacity: opacityNope }}
        className="absolute top-8 right-8 border-4 border-rose-500 text-rose-500 font-extrabold text-2xl uppercase tracking-widest px-4 py-2 rounded-xl rotate-[12deg] pointer-events-none z-30"
      >
        NOPE
      </motion.div>

      {/* Info Container */}
      <div className="absolute inset-x-0 bottom-10 px-5 flex justify-between items-end pointer-events-none select-none">
        <h3 className="text-white font-black text-xl drop-shadow-md pb-1 truncate max-w-[60%]">
          {profile.name}, {profile.age}
        </h3>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="w-12 h-12 rounded-full flex items-center justify-center relative bg-black/10 backdrop-blur-sm border border-white/10">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="50%" cy="50%" r="42%" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" fill="none" />
              <circle cx="50%" cy="50%" r="42%" stroke="white" strokeWidth="2.5" fill="none" strokeDasharray="100" strokeDashoffset={ringStrokeOffset} strokeLinecap="round" />
            </svg>
            <span className="text-white text-[11px] font-black">{profile.matchPercentage}%</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20 text-white shadow-lg">
            <MapPin className="w-3 h-3 text-white/80" />
            <span className="text-[10px] font-bold tracking-wider uppercase">{profile.distance}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Discover = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const reduxDiscoveredUsers = useSelector((state) => state.user.discoveredUsers);

  const [localUsers, setLocalUsers] = useState([]);
  const [swipeDirection, setSwipeDirection] = useState(null);

  // Reset swipe direction when the top card changes
  useEffect(() => {
    setSwipeDirection(null);
  }, [localUsers.length > 0 ? (localUsers[0].id || localUsers[0]._id) : null]);

  useEffect(() => {
    // Fetch users when the discover page mounts
    dispatch(fetchDiscoverUsers(1));
  }, [dispatch]);

  useEffect(() => {
    // Only update local state when redux array changes
    if (reduxDiscoveredUsers) {
      setLocalUsers(reduxDiscoveredUsers);
    }
  }, [reduxDiscoveredUsers]);

  const handleAction = (e, actionType, profile) => {
    if (e && e.stopPropagation) e.stopPropagation();

    if (actionType === 'message') {
      dispatch(createNewChat(profile));
      navigate('/chat');
      return;
    }

    // Animate removal and update state
    setLocalUsers(prev => prev.filter(u => (u.id || u._id) !== (profile.id || profile._id)));

    // Hit backend API
    const swipeAction = actionType === 'like' || actionType === 'gift' ? 'right' : 'left';
    dispatch(apiSwipe({ userId: profile._id || profile.id, action: swipeAction }));

    if (actionType === 'like') {
      // Add to Explore page (Favourites)
      dispatch({ type: 'user/addLikedProfile', payload: profile });

      // Show Match Modal
      dispatch(setMatchedModal({ isOpen: true, user: profile }));
      dispatch({ type: 'ui/setLastMatchedUser', payload: profile });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D51659', '#FFD700', '#FF69B4']
      });
    } else if (actionType === 'gift') {
      // Just add to favorites if they send a gift too
      dispatch({ type: 'user/addLikedProfile', payload: profile });
    }
  };

  const handleMobileSwipe = (actionType) => {
    if (localUsers.length === 0) return;
    const topProfile = localUsers[0];

    if (actionType === 'message') {
      handleAction(null, 'message', topProfile);
      return;
    }

    const direction = actionType === 'like' || actionType === 'gift' ? 'right' : 'left';
    setSwipeDirection(direction);

    // Remove user from state, triggering exit animation
    handleAction(null, actionType, topProfile);
  };

  const isMatchedOpen = useSelector((state) => state.ui.isMatchedModalOpen);
  const matchedUser = useSelector((state) => state.ui.lastMatchedUser);
  const currentUser = useSelector((state) => state.auth.user);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const getImageUrl = (u) => {
    if (!u) return null;
    if (u.images && typeof u.images[0] === 'string') return u.images[0];
    if (u.photos && u.photos[0]) return typeof u.photos[0] === 'string' ? u.photos[0] : u.photos[0].url;
    return null;
  };

  return (
    <div className="flex-1 flex items-start justify-center relative h-[calc(100vh-115px)] sm:h-auto min-h-[0px] pt-14 pb-3 sm:pt-28 sm:pb-16 lg:pt-36 lg:pb-20 px-2 sm:px-4 overflow-hidden">



      {localUsers && localUsers.length > 0 ? (
        <>
          {/* Desktop/Tablet Grid View */}
          <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-x-8 md:gap-y-12 w-full max-w-7xl mx-auto px-4 z-10 relative">
            <AnimatePresence>
              {localUsers.map((profile) => (
                <motion.div
                  key={profile.id || profile._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full aspect-[3/4] rounded-[2rem] overflow-visible group mt-4"
                >
                  {/* Card Inner */}
                  <div
                    onClick={() => setSelectedProfile(profile)}
                    className="w-full h-full rounded-[2rem] overflow-hidden relative border border-slate-200 shadow-2xl bg-[#FCFAF2] cursor-pointer"
                  >
                    <img src={profile.images?.[0] || 'https://via.placeholder.com/400x500'} alt={profile.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />

                    {/* Verified Agent / Host Badge Overlay */}
                    {(profile.isEliteAgent || profile.isStaff || profile.role === 'staff') && (
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-[#D51659] to-[#b44ddc] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 z-20">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Verified Host</span>
                      </div>
                    )}

                    {/* Premium clean gradient only at the bottom for text readability */}
                    <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />

                    {/* Info Container */}
                    <div className="absolute inset-x-0 bottom-10 px-5 flex justify-between items-end">
                      {/* Left: Name and Age */}
                      <h3 className="text-white font-black text-xl drop-shadow-md pb-1 truncate max-w-[60%]">
                        {profile.name}, {profile.age}
                      </h3>

                      {/* Right: Ring and Location */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {/* Ring */}
                        <div className="w-12 h-12 rounded-full flex items-center justify-center relative bg-black/10 backdrop-blur-sm border border-white/15">
                          <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="50%" cy="50%" r="42%" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" fill="none" />
                            <circle cx="50%" cy="50%" r="42%" stroke="white" strokeWidth="2.5" fill="none" strokeDasharray="100" strokeDashoffset={100 - profile.matchPercentage} strokeLinecap="round" />
                          </svg>
                          <span className="text-white text-[11px] font-black">{profile.matchPercentage}%</span>
                        </div>
                        {/* Location Pill */}
                        <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20 text-white shadow-lg">
                          <MapPin className="w-3 h-3 text-white/80" />
                          <span className="text-[10px] font-bold tracking-wider uppercase">{profile.distance}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Overlapping Action Buttons */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20">
                    <button onClick={(e) => handleAction(e, 'pass', profile)} className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                      <X className="w-5 h-5 text-yellow-500" strokeWidth={2.5} />
                    </button>
                    <button onClick={(e) => handleAction(e, 'like', profile)} className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                      <Heart className="w-5 h-5 text-rose-500 fill-current" />
                    </button>
                    <button onClick={(e) => handleAction(e, 'message', profile)} className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                      <MessageSquare className="w-5 h-5 text-purple-500 fill-current" />
                    </button>
                    <button onClick={(e) => handleAction(e, 'gift', profile)} className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                      <Gift className="w-5 h-5 text-yellow-400 fill-current" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Mobile Tinder-Style Swiping Stack */}
          <div className="block sm:hidden w-full h-full max-w-md px-1 mx-auto z-10 relative flex flex-col justify-between select-none">
            <div className="relative w-full flex-grow rounded-[2rem] overflow-visible">
              <AnimatePresence>
                {localUsers[1] && (
                  <div
                    key={localUsers[1].id || localUsers[1]._id}
                    className="absolute inset-0 w-full h-full rounded-[2rem] overflow-hidden border border-slate-200/80 shadow-md bg-[#FCFAF2] scale-95 translate-y-3 opacity-60 origin-bottom transition-all duration-300 pointer-events-none"
                  >
                    <img src={localUsers[1].images?.[0] || 'https://via.placeholder.com/400x500'} alt={localUsers[1].name} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                  </div>
                )}

                {localUsers[0] && (
                  <MobileCard
                    key={localUsers[0].id || localUsers[0]._id}
                    profile={localUsers[0]}
                    active={true}
                    swipeDirection={swipeDirection}
                    onSwipe={handleMobileSwipe}
                    onClick={() => setSelectedProfile(localUsers[0])}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Control action buttons - keep EXACT icons and colors */}
            {localUsers[0] && (
              <div className="flex items-center justify-center gap-3.5 py-4 z-20 shrink-0">
                <button onClick={() => handleMobileSwipe('pass')} className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                  <X className="w-5 h-5 text-yellow-500" strokeWidth={2.5} />
                </button>
                <button onClick={() => handleMobileSwipe('like')} className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                  <Heart className="w-5 h-5 text-rose-500 fill-current" />
                </button>
                <button onClick={() => handleMobileSwipe('message')} className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                  <MessageSquare className="w-5 h-5 text-purple-500 fill-current" />
                </button>
                <button onClick={() => handleMobileSwipe('gift')} className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                  <Gift className="w-5 h-5 text-yellow-400 fill-current" />
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="relative z-10 max-w-md w-full p-10 rounded-[2.5rem] text-center bg-[#FCFAF2] border border-slate-200 shadow-xl">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200 mb-6 mx-auto">
            <Sparkles className="w-10 h-10 text-[#2D2D2D]/50" />
          </div>
          <h3 className="font-black text-2xl mb-2 text-[#2D2D2D]">You've Seen Everyone!</h3>
          <p className="text-[#2D2D2D]/60 text-sm leading-relaxed mb-8">No new profiles in your area right now. Expand your filters or wait for more people to join.</p>
          <button onClick={() => window.location.reload()} className="px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-widest bg-white text-[#2D2D2D] border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
            Refresh
          </button>
        </div>
      )}

      {/* DETAILED PROFILE MODAL */}
      <AnimatePresence>
        {selectedProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-24 pb-6 sm:px-6 bg-black/60 backdrop-blur-md" onClick={() => setSelectedProfile(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-[#FCFAF2] border border-slate-200 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[80vh]"
            >
              {/* Close Button */}
              <button onClick={() => setSelectedProfile(null)} className="absolute top-4 right-4 z-30 p-2.5 bg-white/80 hover:bg-white text-[#2D2D2D] rounded-full transition-colors cursor-pointer backdrop-blur-md border border-slate-200">
                <X className="w-5 h-5" />
              </button>

              {/* Left: Image */}
              <div className="w-full md:w-[400px] shrink-0 relative h-[45vh] md:h-auto">
                <img src={selectedProfile.images[0]} alt={selectedProfile.name} className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

                {/* Action buttons at the bottom of the image */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
                  <button onClick={(e) => { handleAction(e, 'pass', selectedProfile); setSelectedProfile(null); }} className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-lg border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                    <X className="w-5 h-5 text-yellow-500" strokeWidth={2.5} />
                  </button>
                  <button onClick={(e) => { handleAction(e, 'like', selectedProfile); setSelectedProfile(null); }} className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-lg border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                    <Heart className="w-5 h-5 text-rose-500 fill-current" />
                  </button>
                  <button onClick={(e) => { handleAction(e, 'message', selectedProfile); setSelectedProfile(null); }} className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-lg border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                    <MessageSquare className="w-5 h-5 text-purple-500 fill-current" />
                  </button>
                  <button onClick={(e) => { handleAction(e, 'gift', selectedProfile); setSelectedProfile(null); }} className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-lg border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                    <Gift className="w-5 h-5 text-yellow-400 fill-current" />
                  </button>
                </div>
              </div>

              {/* Right: Info Scrollable Area */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto no-scrollbar">
                {/* Header */}
                <div className="flex justify-between items-start mb-6 border-b border-slate-200 pb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black text-[#2D2D2D] tracking-tight">{selectedProfile.name} ({selectedProfile.age})</h2>
                    {selectedProfile.verified && <CheckCircle2 className="w-6 h-6 text-blue-500 fill-blue-500/20 mt-1" />}
                  </div>
                  <div className="flex items-center gap-1.5 text-purple-600 font-bold text-xs bg-purple-100 px-3 py-1.5 rounded-full border border-purple-200 shrink-0 mt-1">
                    <MapPin className="w-3.5 h-3.5" /> {selectedProfile.distance}
                  </div>
                </div>

                {/* Interests */}
                {selectedProfile.interests && selectedProfile.interests.length > 0 && (
                  <div className="mb-6 border-b border-slate-200 pb-6">
                    <h3 className="text-sm font-bold text-[#2D2D2D]/60 uppercase tracking-widest mb-4">Interests</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {selectedProfile.interests.map((interest, idx) => (
                        <span key={idx} className="px-4 py-2 rounded-full text-xs font-bold bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                <div className="mb-6 border-b border-slate-200 pb-6">
                  <h3 className="text-sm font-bold text-[#2D2D2D]/60 uppercase tracking-widest mb-4">Languages</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {/* Mock languages since not all dummy profiles have them */}
                    {['English 🇬🇧', 'Spanish 🇪🇸'].map((lang, idx) => (
                      <span key={idx} className="px-4 py-2 rounded-full text-xs font-bold bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Relationship Goals */}
                <div className="mb-6 border-b border-slate-200 pb-6">
                  <h3 className="text-sm font-bold text-[#2D2D2D]/60 uppercase tracking-widest mb-4">Relationship Goals</h3>
                  <div className="flex flex-wrap gap-2.5">
                    <span className="px-4 py-2 rounded-full text-xs font-bold bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors">
                      {selectedProfile.relationship || 'Dating 💕'}
                    </span>
                  </div>
                </div>

                {/* Religion */}
                <div className="mb-2">
                  <h3 className="text-sm font-bold text-[#2D2D2D]/60 uppercase tracking-widest mb-4">Religion</h3>
                  <div className="flex flex-wrap gap-2.5">
                    <span className="px-4 py-2 rounded-full text-xs font-bold bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors">
                      Spiritual 🙏
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MATCH MODAL */}
      <AnimatePresence>
        {isMatchedOpen && matchedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-lg flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.85, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 40 }} transition={{ type: 'spring', damping: 25, stiffness: 350 }} className="bg-[#0f0a10]/90 backdrop-blur-3xl max-w-md w-full p-10 rounded-[2.5rem] text-center border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-[-30%] left-[-30%] w-96 h-96 rounded-full bg-gradient-to-tr from-[#D51659]/30 to-purple-600/20 opacity-50 blur-[80px] pointer-events-none" />

              <div className="w-20 h-20 bg-[#D51659] rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-[0_4px_20px_rgba(213,22,89,0.4)] rotate-12 relative z-10">
                <Heart className="w-10 h-10 text-white fill-current animate-pulse" />
              </div>

              <h2 className="text-4xl font-black tracking-tight mb-3 text-white relative z-10 font-serif italic">It's a Spark!</h2>
              <p className="text-white/60 text-sm mb-10 relative z-10">You and <span className="text-[#D51659] font-bold">{matchedUser.name}</span> liked each other</p>

              <div className="flex justify-center items-center gap-0 mb-10 relative z-10">
                <div className="w-28 h-28 rounded-full overflow-hidden border-[3px] border-[#D51659] shadow-2xl relative z-10 -mr-6 ring-4 ring-black/40">
                  <img src={getImageUrl(currentUser) || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&q=80'} alt={currentUser?.name || "You"} className="w-full h-full object-cover" />
                </div>
                <div className="w-28 h-28 rounded-full overflow-hidden border-[3px] border-[#D51659] shadow-2xl relative z-10 ring-4 ring-black/40">
                  <img src={getImageUrl(matchedUser) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80'} alt={matchedUser?.name || "Match"} className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="space-y-3 relative z-10">
                <button onClick={() => {
                  dispatch(createNewChat(matchedUser));
                  dispatch(setMatchedModal({ isOpen: false }));
                  navigate('/chat');
                }} className="w-full py-4 rounded-2xl text-xs uppercase tracking-widest font-black bg-[#D51659] text-white shadow-[0_4px_15px_rgba(213,22,89,0.4)] hover:bg-[#b44ddc] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <MessageSquare className="w-4 h-4 shrink-0" /> <span>Send Message</span>
                </button>
                <button onClick={() => dispatch(setMatchedModal({ isOpen: false }))} className="w-full py-4 rounded-2xl text-xs uppercase tracking-widest font-bold bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer">
                  Continue Exploring
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
