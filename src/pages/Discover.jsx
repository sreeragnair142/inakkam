import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setMatchedModal } from '../redux/slices/uiSlice';
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
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const Discover = () => {
  const dispatch = useDispatch();
  const discoveredUsers = useSelector((state) => state.user.discoveredUsers);
  const isMatchedOpen = useSelector((state) => state.ui.isMatchedModalOpen);
  const matchedUser = useSelector((state) => state.ui.lastMatchedUser);
  const currentUser = useSelector((state) => state.auth.user);
  const [selectedProfile, setSelectedProfile] = useState(null);

  return (
    <div className="flex-1 flex items-start justify-center relative min-h-screen pt-28 pb-16 lg:pt-36 lg:pb-20 px-4">
      


      {discoveredUsers && discoveredUsers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-x-8 md:gap-y-12 w-full max-w-7xl mx-auto px-4 z-10 relative">
          {discoveredUsers.map((profile) => (
            <div key={profile.id} className="relative w-full aspect-[3/4] rounded-[2rem] overflow-visible group mt-4">
              {/* Card Inner */}
              <div 
                onClick={() => setSelectedProfile(profile)}
                className="w-full h-full rounded-[2rem] overflow-hidden relative border border-white/10 shadow-2xl bg-black/40 cursor-pointer"
              >
                <img src={profile.images[0]} alt={profile.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
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
                    <div className="w-12 h-12 rounded-full flex items-center justify-center relative bg-black/10 backdrop-blur-sm border border-white/10">
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
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20" onClick={(e) => e.stopPropagation()}>
                <button className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                  <X className="w-5 h-5 text-yellow-500" strokeWidth={2.5} />
                </button>
                <button className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                  <Heart className="w-5 h-5 text-rose-500 fill-current" />
                </button>
                <button className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                  <MessageSquare className="w-5 h-5 text-purple-500 fill-current" />
                </button>
                <button className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                  <Gift className="w-5 h-5 text-yellow-400 fill-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="relative z-10 max-w-md w-full p-10 rounded-[2.5rem] text-center bg-black/40 backdrop-blur-2xl border border-white/10 shadow-xl">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border-2 border-white/10 mb-6 mx-auto">
            <Sparkles className="w-10 h-10 text-white/50" />
          </div>
          <h3 className="font-black text-2xl mb-2 text-white">You've Seen Everyone!</h3>
          <p className="text-white/50 text-sm leading-relaxed mb-8">No new profiles in your area right now. Expand your filters or wait for more people to join.</p>
          <button onClick={() => dispatch({ type: 'user/resetSwipes' })} className="px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-widest bg-white/10 text-white border border-white/10 hover:bg-white/20 transition-colors cursor-pointer">
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
              className="relative w-full max-w-4xl bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[80vh]"
            >
              {/* Close Button */}
              <button onClick={() => setSelectedProfile(null)} className="absolute top-4 right-4 z-30 p-2.5 bg-black/40 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer backdrop-blur-md border border-white/10">
                <X className="w-5 h-5" />
              </button>

              {/* Left: Image */}
              <div className="w-full md:w-[400px] shrink-0 relative h-[45vh] md:h-auto">
                <img src={selectedProfile.images[0]} alt={selectedProfile.name} className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
                
                {/* Action buttons at the bottom of the image */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
                  <button className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-lg border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                    <X className="w-5 h-5 text-yellow-500" strokeWidth={2.5} />
                  </button>
                  <button className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-lg border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                    <Heart className="w-5 h-5 text-rose-500 fill-current" />
                  </button>
                  <button className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-lg border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                    <MessageSquare className="w-5 h-5 text-purple-500 fill-current" />
                  </button>
                  <button className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-lg border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                    <Gift className="w-5 h-5 text-yellow-400 fill-current" />
                  </button>
                </div>
              </div>

              {/* Right: Info Scrollable Area */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto no-scrollbar">
                {/* Header */}
                <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black text-white tracking-tight">{selectedProfile.name} ({selectedProfile.age})</h2>
                    {selectedProfile.verified && <CheckCircle2 className="w-6 h-6 text-blue-400 fill-blue-400/20 mt-1" />}
                  </div>
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20 shrink-0 mt-1">
                    <MapPin className="w-3.5 h-3.5" /> {selectedProfile.distance}
                  </div>
                </div>

                {/* Interests */}
                {selectedProfile.interests && selectedProfile.interests.length > 0 && (
                  <div className="mb-6 border-b border-white/10 pb-6">
                    <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Interests</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {selectedProfile.interests.map((interest, idx) => (
                        <span key={idx} className="px-4 py-2 rounded-full text-xs font-bold bg-transparent border border-purple-500/40 text-white hover:bg-purple-500/10 transition-colors">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                <div className="mb-6 border-b border-white/10 pb-6">
                  <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Languages</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {/* Mock languages since not all dummy profiles have them */}
                    {['English 🇬🇧', 'Spanish 🇪🇸'].map((lang, idx) => (
                      <span key={idx} className="px-4 py-2 rounded-full text-xs font-bold bg-transparent border border-purple-500/40 text-white hover:bg-purple-500/10 transition-colors">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Relationship Goals */}
                <div className="mb-6 border-b border-white/10 pb-6">
                  <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Relationship Goals</h3>
                  <div className="flex flex-wrap gap-2.5">
                    <span className="px-4 py-2 rounded-full text-xs font-bold bg-transparent border border-purple-500/40 text-white hover:bg-purple-500/10 transition-colors">
                      {selectedProfile.relationship || 'Dating 💕'}
                    </span>
                  </div>
                </div>

                {/* Religion */}
                <div className="mb-2">
                  <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Religion</h3>
                  <div className="flex flex-wrap gap-2.5">
                    <span className="px-4 py-2 rounded-full text-xs font-bold bg-transparent border border-purple-500/40 text-white hover:bg-purple-500/10 transition-colors">
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
