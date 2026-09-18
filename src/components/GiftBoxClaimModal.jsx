import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, Coins, X, Sparkles, Clock, CheckCircle2, 
  ArrowRight, ShieldCheck, Zap, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { fetchMe } from '../redux/slices/authSlice';

export default function GiftBoxClaimModal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, isGuest } = useSelector((state) => state.auth);

  const [activeGifts, setActiveGifts] = useState([]);
  const [currentGift, setCurrentGift] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isClaimedSuccess, setIsClaimedSuccess] = useState(false);
  const [claimedReward, setClaimedReward] = useState(0);
  const [newBalance, setNewBalance] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });

  // Fetch active timed gift drops
  const fetchActiveGifts = async () => {
    try {
      const res = await api.get('/coins/active-gifts');
      if (res.data?.success && Array.isArray(res.data.gifts) && res.data.gifts.length > 0) {
        setActiveGifts(res.data.gifts);
        
        // Pick the first unclaimed gift, or fallback to first active
        const unclaimed = res.data.gifts.find(g => !g.isClaimed);
        const selected = unclaimed || res.data.gifts[0];
        setCurrentGift(selected);

        // Check if user already saw / dismissed auto-popup in this session
        const hasAutoPopped = sessionStorage.getItem('inakkam_gift_auto_popped');
        if (!hasAutoPopped && unclaimed) {
          // Delay popup by 2 seconds so it feels smooth after page load
          setTimeout(() => {
            setIsOpen(true);
            sessionStorage.setItem('inakkam_gift_auto_popped', 'true');
          }, 2000);
        }
      } else {
        setActiveGifts([]);
        setCurrentGift(null);
      }
    } catch (err) {
      console.warn('Gifts fetch notice:', err.message);
    }
  };

  useEffect(() => {
    fetchActiveGifts();
    // Refresh active drops every 45 seconds
    const interval = setInterval(fetchActiveGifts, 45000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Live countdown timer logic
  useEffect(() => {
    if (!currentGift?.expiresAt) {
      setTimeLeft({ hours: 24, minutes: 0, seconds: 0, totalMs: 86400000 });
      return;
    }

    const updateCountdown = () => {
      const targetTime = new Date(currentGift.expiresAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, totalMs: diff });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [currentGift]);

  // Trigger celebration explosion
  const fireCelebrationConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  // Claim gift handler
  const handleClaim = async () => {
    if (!isAuthenticated || isGuest) {
      toast('Please login or create an account to claim your free coins!', {
        icon: '🎁',
        duration: 4000
      });
      setIsOpen(false);
      navigate('/login');
      return;
    }

    if (!currentGift?._id) return;

    if (timeLeft.totalMs <= 0 && currentGift.expiresAt) {
      toast.error('Sorry, this gift drop has expired!');
      return;
    }

    setIsClaiming(true);
    try {
      const res = await api.post(`/coins/claim-gift/${currentGift._id}`);
      if (res.data?.success) {
        const coins = res.data.coinsClaimed || currentGift.coinReward || 50;
        setClaimedReward(coins);
        setNewBalance(res.data.newBalance);
        setIsClaimedSuccess(true);
        fireCelebrationConfetti();
        dispatch(fetchMe());

        // Update local state to mark claimed
        setActiveGifts(prev => prev.map(g => g._id === currentGift._id ? { ...g, isClaimed: true } : g));
        setCurrentGift(prev => prev ? { ...prev, isClaimed: true } : null);
      } else {
        toast.error(res.data?.message || 'Unable to claim gift');
      }
    } catch (err) {
      console.error(err);
      if (err.response?.data?.alreadyClaimed) {
        toast.error('You already claimed this gift box!');
        setCurrentGift(prev => prev ? { ...prev, isClaimed: true } : null);
      } else {
        toast.error(err.response?.data?.message || 'Error claiming gift');
      }
    } finally {
      setIsClaiming(false);
    }
  };

  // If no active gifts exist, don't show launcher
  if (!currentGift && activeGifts.length === 0) {
    return null;
  }

  const isExpired = timeLeft.totalMs <= 0 && currentGift?.expiresAt;
  const isAlreadyClaimed = currentGift?.isClaimed;
  const rewardAmount = currentGift?.coinReward || currentGift?.coinCost || 50;

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. FLOATING 3D GIFT BOX LAUNCHER (PWA Screen Badge)
      ───────────────────────────────────────────────────────────── */}
      {!isOpen && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed bottom-24 right-4 z-[990] flex items-center gap-2"
        >
          <motion.button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsClaimedSuccess(false);
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="group relative flex items-center gap-2.5 p-2.5 sm:px-4 sm:py-3 rounded-full cursor-pointer border-none shadow-2xl transition-all"
            style={{
              background: 'linear-gradient(135deg, #D51659 0%, #ff4d88 50%, #b44ddc 100%)',
              boxShadow: '0 8px 30px rgba(213, 22, 89, 0.55), 0 0 20px rgba(180, 77, 220, 0.35)',
            }}
          >
            {/* Ambient Pulsing Aura */}
            <span className="absolute inset-0 rounded-full animate-ping opacity-25 bg-[#D51659]" />

            {/* 3D Gift Box Icon with Wiggle */}
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 10, 0],
                y: [0, -3, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2.2, 
                repeatDelay: 1.5 
              }}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0"
            >
              🎁
            </motion.div>

            {/* Launcher Label */}
            <div className="hidden sm:flex flex-col text-left pr-1">
              <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> Free Coins Drop
              </span>
              <span className="text-xs font-black text-white leading-tight">
                +{rewardAmount} Coins
              </span>
              {currentGift?.expiresAt && !isExpired && (
                <span className="text-[9px] font-bold text-white/80 font-mono">
                  ⏳ {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m left
                </span>
              )}
            </div>

            {/* Sparkle Badge on Mobile */}
            <span className="sm:hidden absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center border-2 border-white shadow">
              !
            </span>
          </motion.button>
        </motion.div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. CELEBRATORY UNBOXING POPUP MODAL
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 25 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="relative z-10 w-full max-w-sm sm:max-w-md rounded-[2.2rem] overflow-hidden text-center shadow-2xl p-6 sm:p-8"
              style={{
                background: 'linear-gradient(160deg, #1d182b 0%, #110d1c 60%, #0a0712 100%)',
                border: '1.5px solid rgba(251, 111, 146, 0.35)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 40px rgba(213, 22, 89, 0.25)',
              }}
            >
              {/* Background ambient lighting */}
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(213,22,89,0.3) 0%, rgba(180,77,220,0.15) 50%, transparent 70%)',
                  filter: 'blur(30px)',
                }}
              />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer border-none z-20"
              >
                <X className="w-5 h-5" />
              </button>

              {/* ──────────────────────────────────────────────────
                  A. UNCLAIMED / READY TO CLAIM STATE
              ────────────────────────────────────────────────── */}
              {!isClaimedSuccess && !isAlreadyClaimed && (
                <div className="relative z-10 flex flex-col items-center">
                  {/* Category Pill */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#D51659]/20 to-purple-500/20 border border-[#D51659]/40 text-rose-300 text-[11px] font-black uppercase tracking-wider mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Special Free Gift Drop
                  </div>

                  {/* 3D Animated Gift Box Graphic */}
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                      rotate: [0, -3, 3, 0],
                      scale: [1, 1.03, 1]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.4,
                      ease: "easeInOut"
                    }}
                    onClick={handleClaim}
                    className="relative cursor-pointer select-none group my-2"
                  >
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-[#D51659]/30 via-purple-600/30 to-amber-500/20 border-2 border-rose-400/40 flex items-center justify-center shadow-2xl backdrop-blur-md group-hover:scale-105 transition-transform">
                      {currentGift?.image ? (
                        <img 
                          src={currentGift.image} 
                          alt="Gift Box" 
                          className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-xl"
                        />
                      ) : (
                        <span className="text-6xl sm:text-7xl drop-shadow-lg">
                          🎁
                        </span>
                      )}
                    </div>
                    
                    {/* Glowing Tap Pulse */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-md whitespace-nowrap">
                      Tap to Open
                    </div>
                  </motion.div>

                  {/* Title & Description */}
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-4 tracking-tight">
                    {currentGift?.title || 'Surprise Coin Drop! 🎁'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xs leading-relaxed">
                    {currentGift?.description || 'Claim your exclusive free coins bonus before the timer runs out!'}
                  </p>

                  {/* Big Coin Reward Badge */}
                  <div className="mt-4 px-5 py-2.5 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center gap-2.5 shadow-inner">
                    <Coins className="w-6 h-6 text-amber-400 fill-current animate-pulse" />
                    <span className="text-lg sm:text-xl font-black text-amber-300 tracking-wide">
                      +{rewardAmount.toLocaleString()} FREE COINS
                    </span>
                  </div>

                  {/* Live Expiration Countdown Timer */}
                  {currentGift?.expiresAt && (
                    <div className="mt-3.5 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-rose-300">
                      <Clock className="w-4 h-4 text-rose-400 animate-pulse" />
                      {isExpired ? (
                        <span className="text-rose-400 font-extrabold">Expired</span>
                      ) : (
                        <span>
                          Expires in:{' '}
                          <span className="font-mono font-black text-white">
                            {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
                          </span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Claim Button */}
                  <div className="w-full mt-6 space-y-2">
                    <motion.button
                      type="button"
                      onClick={handleClaim}
                      disabled={isClaiming || isExpired}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-4 rounded-2xl text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-2xl flex items-center justify-center gap-2.5 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #D51659 0%, #b44ddc 100%)',
                        boxShadow: '0 8px 25px rgba(213, 22, 89, 0.45)',
                      }}
                    >
                      {isClaiming ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (!isAuthenticated || isGuest) ? (
                        <>
                          <span>Login to Claim +{rewardAmount} Coins</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 text-amber-300" />
                          <span>CLAIM {rewardAmount} FREE COINS NOW</span>
                        </>
                      )}
                    </motion.button>

                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium pt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Instant 100% Free Credit &middot; No Payment Required
                    </div>
                  </div>
                </div>
              )}

              {/* ──────────────────────────────────────────────────
                  B. SUCCESSFUL UNBOXING CELEBRATION STATE
              ────────────────────────────────────────────────── */}
              {isClaimedSuccess && (
                <div className="relative z-10 flex flex-col items-center py-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                    className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl mb-3"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 0 35px rgba(16, 185, 129, 0.6)'
                    }}
                  >
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  </motion.div>

                  <h3 className="text-2xl font-black text-white tracking-tight">
                    🎉 Free Coins Unlocked!
                  </h3>
                  <p className="text-sm text-slate-300 mt-1 max-w-xs">
                    You successfully claimed <strong className="text-amber-400">+{claimedReward} coins</strong>!
                  </p>

                  <div className="my-5 p-4 rounded-2xl bg-white/5 border border-white/10 w-full flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center">
                        <Coins className="w-5 h-5 text-amber-400 fill-current" />
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Added to Wallet</span>
                        <span className="text-sm font-black text-white">+{claimedReward} Coins</span>
                      </div>
                    </div>
                    {newBalance !== null && (
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">New Balance</span>
                        <span className="text-base font-black text-amber-400">{newBalance.toLocaleString()} Coins</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3.5 rounded-2xl text-white font-black text-sm uppercase tracking-wider shadow-lg cursor-pointer border-none hover:opacity-90 transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #D51659 0%, #b44ddc 100%)',
                    }}
                  >
                    Awesome, Thanks!
                  </button>
                </div>
              )}

              {/* ──────────────────────────────────────────────────
                  C. ALREADY CLAIMED STATE
              ────────────────────────────────────────────────── */}
              {!isClaimedSuccess && isAlreadyClaimed && (
                <div className="relative z-10 flex flex-col items-center py-2">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-4xl mb-3 shadow">
                    ✨
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    Already Claimed!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xs">
                    You have already claimed this drop. Stay tuned for the next surprise gift box!
                  </p>

                  <div className="my-4 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    New gift drops are posted regularly by admin.
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-sm cursor-pointer border-none transition-all"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
