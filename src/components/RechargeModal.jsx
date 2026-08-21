import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, Sparkles, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RechargeModal = ({ isOpen, onClose, requiredCoins = 30, currentBalance = 0 }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Box */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: 'spring', bounce: 0.4 }}
          className="relative z-10 w-full max-w-sm bg-gradient-to-b from-[#1a0a15] via-[#15061a] to-[#0d0515] rounded-[2.5rem] p-6 text-center text-white border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center"
        >
          {/* Top Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors cursor-pointer border-none"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Glowing Coin Icon */}
          <div className="relative mt-2 mb-4">
            <div className="absolute inset-0 bg-amber-400 blur-2xl opacity-30 rounded-full scale-150 animate-pulse" />
            <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-xl relative z-10">
              <Coins className="w-8 h-8 fill-current" />
            </div>
          </div>

          <h3 className="text-2xl font-black tracking-tight text-white">
            Insufficient Coins!
          </h3>
          <p className="text-xs text-white/70 font-medium mt-1 mb-4 leading-relaxed">
            You need <span className="text-amber-400 font-extrabold">{requiredCoins} coins</span> to perform this action.
          </p>

          {/* Current Balance Box */}
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400">
                <Coins className="w-4 h-4 fill-current" />
              </div>
              <span className="text-xs font-semibold text-white/80">Your Balance</span>
            </div>
            <span className="text-sm font-black text-amber-400">
              {currentBalance} Coins
            </span>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => {
              onClose();
              navigate('/buy-coin');
            }}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#D51659] to-[#b44ddc] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D51659]/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Recharge Coins Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Secure badge */}
          <div className="flex items-center justify-center gap-1 mt-4 text-[10px] text-white/40 font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Instant & Secure Delivery</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RechargeModal;
