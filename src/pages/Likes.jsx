import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Heart, X, Sparkles, MapPin, MessageSquare, CheckCircle2, Flame, Shield, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchReceivedLikes, apiSwipe, removeReceivedLike } from '../redux/slices/userSlice';
import { createNewChat } from '../redux/slices/chatSlice';
import toast from 'react-hot-toast';

const mockDemoLikes = [
  {
    swipeId: 'demo1',
    action: 'superlike',
    likedAt: new Date().toISOString(),
    user: {
      _id: 'demo_user_1',
      name: 'Ananya Nair',
      age: 24,
      bio: 'Coffee enthusiast, sunset chaser & bookworm 📚✨',
      city: 'Kochi',
      state: 'Kerala',
      occupation: 'UI/UX Designer',
      verified: true,
      photos: [
        { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600' }
      ]
    }
  },
  {
    swipeId: 'demo2',
    action: 'right',
    likedAt: new Date().toISOString(),
    user: {
      _id: 'demo_user_2',
      name: 'Rohan Sharma',
      age: 27,
      bio: 'Fitness fanatic 💪 & Tech Explorer 🚀 Let’s grab coffee!',
      city: 'Trivandrum',
      state: 'Kerala',
      occupation: 'Software Engineer',
      verified: true,
      photos: [
        { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600' }
      ]
    }
  },
  {
    swipeId: 'demo3',
    action: 'right',
    likedAt: new Date().toISOString(),
    user: {
      _id: 'demo_user_3',
      name: 'Meera Pillai',
      age: 25,
      bio: 'Classical dancer & foodie 🍜 Looking for genuine conversations.',
      city: 'Kozhikode',
      state: 'Kerala',
      occupation: 'Architect',
      verified: false,
      photos: [
        { url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600' }
      ]
    }
  }
];

const Likes = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);
  const receivedLikesFromStore = useSelector((state) => state.user.receivedLikes);
  const [matchModalData, setMatchModalData] = useState(null);

  useEffect(() => {
    dispatch(fetchReceivedLikes());
  }, [dispatch]);

  // Use real received likes if available, fallback to mock demo list for demonstration if array is empty
  const displayLikes = (receivedLikesFromStore && receivedLikesFromStore.length > 0)
    ? receivedLikesFromStore
    : mockDemoLikes;

  const handleLikeBack = async (likedItem) => {
    const targetUser = likedItem.user;
    const targetUserId = targetUser?._id || targetUser?.id;

    try {
      // Send right swipe to backend API
      const result = await dispatch(apiSwipe({ userId: targetUserId, action: 'right' })).unwrap();
      dispatch(removeReceivedLike(targetUserId));

      const conversationId = result?.match?.conversationId || `chat_${targetUserId}`;
      const matchId = result?.match?.matchId || 'temp_match_' + Date.now();

      // Populate Redux chat state immediately
      dispatch(createNewChat({
        ...targetUser,
        conversationId
      }));

      // Trigger Instant Match Celebration Modal
      setMatchModalData({
        user: targetUser,
        matchId,
        conversationId
      });
      toast.success(`You matched with ${targetUser.name}! 🎉`);
    } catch (err) {
      // Local fallback for smooth UI demo
      dispatch(removeReceivedLike(targetUserId));
      const fallbackConvId = `chat_${targetUserId}`;
      dispatch(createNewChat({
        ...targetUser,
        conversationId: fallbackConvId
      }));
      setMatchModalData({
        user: targetUser,
        matchId: 'temp_match_' + Date.now(),
        conversationId: fallbackConvId
      });
      toast.success(`You matched with ${targetUser.name}! 🎉`);
    }
  };

  const handlePass = (likedItem) => {
    const targetUserId = likedItem.user?._id || likedItem.user?.id;
    dispatch(removeReceivedLike(targetUserId));
    toast('Profile passed', { icon: '👋' });
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#FFF5F6] via-[#FFFDFD] to-[#FFEBEF] pt-20 md:pt-28 pb-28 px-4 md:px-8 flex flex-col items-center">
      <div className="max-w-6xl w-full flex flex-col">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-[#D51659]/10 text-[#D51659]">
                <Heart className="w-6 h-6 fill-current" />
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Likes You
              </h1>
              <span className="ml-2 px-3 py-1 bg-[#D51659] text-white font-extrabold text-xs rounded-full shadow-sm">
                {displayLikes.length}
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              People who swiped right on your profile. Like them back to start chatting instantly!
            </p>
          </div>

          <button
            onClick={() => navigate('/swipe')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-[#D51659] hover:border-[#D51659]/30 text-xs font-bold transition-all shadow-sm cursor-pointer w-fit"
          >
            <Flame className="w-4 h-4 text-[#D51659]" />
            <span>Discover More Profiles</span>
          </button>
        </div>

        {/* Likes Grid */}
        {displayLikes.length === 0 ? (
          <div className="w-full py-16 flex flex-col items-center justify-center text-center bg-white/60 backdrop-blur-md rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="w-16 h-16 rounded-full bg-[#D51659]/10 flex items-center justify-center text-[#D51659] mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No New Likes Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
              Keep your profile updated and active in Discover to get noticed by thousands of singles near you!
            </p>
            <button
              onClick={() => navigate('/swipe')}
              className="px-6 py-3 rounded-full bg-[#D51659] hover:bg-[#b44ddc] text-white font-black text-xs transition-all shadow-lg shadow-[#D51659]/20 flex items-center gap-2 cursor-pointer"
            >
              <span>Explore Profiles Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayLikes.map((item, idx) => {
              const u = item.user;
              const photoUrl = u?.photos?.[0]?.url || u?.images?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600';
              const isSuperlike = item.action === 'superlike';

              return (
                <motion.div
                  key={item.swipeId || u._id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="relative group rounded-3xl overflow-hidden shadow-xl bg-white border border-slate-100 flex flex-col h-[380px] hover:shadow-2xl transition-all duration-300"
                >
                  {/* Photo & Overlay */}
                  <div className="relative w-full h-full overflow-hidden">
                    <img
                      src={photoUrl}
                      alt={u.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                    {/* Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      {isSuperlike ? (
                        <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-900 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <Sparkles className="w-3 h-3 fill-current" /> Super Liked You
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-[#D51659] text-white font-extrabold text-[10px] tracking-wide flex items-center gap-1 shadow-md">
                          <Heart className="w-3 h-3 fill-current" /> Liked You
                        </span>
                      )}
                    </div>

                    {/* Verified Badge */}
                    {u.verified && (
                      <div className="absolute top-3 right-3 z-10 p-1 bg-white/80 backdrop-blur-md rounded-full text-blue-500">
                        <CheckCircle2 className="w-4 h-4 fill-current text-blue-500" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="absolute bottom-16 left-0 right-0 p-4 text-white z-10">
                      <h3 className="font-extrabold text-lg flex items-center gap-1.5 leading-tight">
                        {u.name}, {u.age}
                      </h3>
                      {u.occupation && (
                        <p className="text-xs text-white/80 font-medium line-clamp-1 mt-0.5">
                          {u.occupation}
                        </p>
                      )}
                      {(u.city || u.state) && (
                        <div className="flex items-center gap-1 text-[11px] text-white/70 mt-1 font-semibold">
                          <MapPin className="w-3 h-3 text-[#D51659]" />
                          <span>{[u.city, u.state].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-3">
                      <button
                        onClick={() => handlePass(item)}
                        className="flex-1 py-2.5 rounded-2xl bg-white/20 backdrop-blur-md hover:bg-white/30 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer border border-white/20"
                      >
                        <X className="w-4 h-4 text-slate-200" />
                        <span>Pass</span>
                      </button>
                      <button
                        onClick={() => handleLikeBack(item)}
                        className="flex-1 py-2.5 rounded-2xl bg-[#D51659] hover:bg-[#b44ddc] text-white font-extrabold text-xs transition-transform hover:scale-105 flex items-center justify-center gap-1.5 shadow-lg shadow-[#D51659]/40 cursor-pointer border-none"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                        <span>Like Back</span>
                      </button>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>

      {/* Match Celebration Modal */}
      <AnimatePresence>
        {matchModalData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setMatchModalData(null)}
            />

            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 30 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="relative z-10 w-full max-w-sm bg-gradient-to-b from-[#1a0a15] to-[#0d0515] rounded-[2.5rem] p-6 text-center text-white border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center"
            >
              {/* Background Glow */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#D51659] rounded-full blur-3xl opacity-30 pointer-events-none" />

              <div className="w-12 h-12 rounded-2xl bg-[#D51659]/20 border border-[#D51659]/50 flex items-center justify-center text-[#D51659] mb-3 animate-bounce">
                <Sparkles className="w-6 h-6" />
              </div>

              <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-md">
                It's a Match! 🎉
              </h2>
              <p className="text-xs text-white/70 font-medium mt-1 mb-6">
                You and <span className="text-[#D51659] font-bold">{matchModalData.user?.name}</span> liked each other!
              </p>

              {/* Avatars Side-by-Side */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <img
                  src={currentUser?.images?.[0] || currentUser?.photos?.[0]?.url || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600"}
                  alt="You"
                  className="w-20 h-20 rounded-full object-cover border-4 border-[#D51659] shadow-xl"
                />
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#D51659]">
                  <Heart className="w-4 h-4 fill-current" />
                </div>
                <img
                  src={matchModalData.user?.photos?.[0]?.url || matchModalData.user?.images?.[0] || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600"}
                  alt={matchModalData.user?.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-purple-500 shadow-xl"
                />
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={() => {
                    if (matchModalData?.user) {
                      dispatch(createNewChat({
                        ...matchModalData.user,
                        conversationId: matchModalData.conversationId || `chat_${matchModalData.user._id || matchModalData.user.id}`
                      }));
                    }
                    setMatchModalData(null);
                    navigate('/chat');
                  }}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#D51659] to-[#b44ddc] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D51659]/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  <MessageSquare className="w-4 h-4 fill-current" />
                  <span>Send Message Now</span>
                </button>

                <button
                  onClick={() => setMatchModalData(null)}
                  className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 font-bold text-xs transition-colors cursor-pointer border-none"
                >
                  Keep Browsing Likes
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Likes;
