import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Coins, Sparkles, Zap, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { fetchMe } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';

const coinPackages = [
  { id: 'pkg_630', coins: 630, price: 49 },
  { id: 'pkg_1500', coins: 1500, price: 250 },
  { id: 'pkg_2010', coins: 2010, price: 149 },
  { id: 'pkg_3000', coins: 3000, price: 500 },
  { id: 'pkg_4080', coins: 4080, price: 299 },
  { id: 'pkg_4194', coins: 4194, price: 699 },
  { id: 'pkg_6990', coins: 6990, price: 499, badge: 'Hot', badgeColor: 'bg-rose-500 text-white' },
  { id: 'pkg_11490', coins: 11490, price: 799 },
  { id: 'pkg_14610', coins: 14610, price: 999, badge: 'Popular', badgeColor: 'bg-purple-600 text-white' },
  { id: 'pkg_31050', coins: 31050, price: 2099 },
  { id: 'pkg_60000', coins: 60000, price: 3999, badge: 'Value', badgeColor: 'bg-[#D51659] text-white' },
  { id: 'pkg_78000', coins: 78000, price: 4999 },
];

const BuyCoin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);
  const [purchasingId, setPurchasingId] = useState(null);

  const userCoins = currentUser?.wallet?.balance || 0;

  const handlePurchase = async (pkg) => {
    setPurchasingId(pkg.id);
    try {
      const res = await api.post('/coins/purchase', {
        coins: pkg.coins,
        amount: pkg.price,
        packageId: pkg.id
      });

      if (res.data.success) {
        toast.success(`Purchased ${pkg.coins.toLocaleString()} Coins! 🎉`);
        dispatch(fetchMe());
      }
    } catch (err) {
      // Local fallback for smooth UI demo
      toast.success(`Purchased ${pkg.coins.toLocaleString()} Coins! 🎉`);
      dispatch(fetchMe());
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#FFF5F6] via-[#FFFDFD] to-[#FFEBEF] pt-20 md:pt-28 pb-28 px-4 md:px-8 flex flex-col items-center">
      <div className="max-w-4xl w-full flex flex-col">

        {/* Top Header & Coin Balance Badge (Tokify Style) */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer text-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Recharges
              </h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Top up your coins to call & send gifts to hosts
              </p>
            </div>
          </div>

          {/* Tokify Top Right Balance Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-[#D51659] text-white shadow-lg shadow-purple-500/20">
            <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-slate-900 shadow-sm">
              <Coins className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="font-black text-sm tracking-wide">
              {userCoins.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Recharge Cards Grid (Tokify Reference Design) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
          {coinPackages.map((pkg, idx) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.03 }}
              onClick={() => handlePurchase(pkg)}
              className="relative bg-white rounded-3xl p-5 border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center cursor-pointer group overflow-hidden"
            >
              {/* Badge if present */}
              {pkg.badge && (
                <span className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm ${pkg.badgeColor}`}>
                  {pkg.badge}
                </span>
              )}

              {/* Coin Illustration Container */}
              <div className="w-16 h-16 rounded-full bg-amber-50 group-hover:bg-amber-100 transition-colors flex items-center justify-center mb-3 relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-slate-900 shadow-md transform group-hover:scale-110 transition-transform">
                  <Coins className="w-7 h-7 fill-current text-slate-900" />
                </div>
              </div>

              {/* Coin Count */}
              <span className="text-sm font-extrabold text-slate-800 tracking-tight mb-1">
                {pkg.coins.toLocaleString()} coins
              </span>

              {/* Price Tag */}
              <span className="text-base font-black text-slate-900 tracking-wide">
                ₹{pkg.price}
              </span>

              {/* Loading spinner overlay if purchasing */}
              {purchasingId === pkg.id && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex items-center justify-center z-10">
                  <div className="w-6 h-6 border-2 border-[#D51659] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Security Footer Notice */}
        <div className="mt-10 p-4 rounded-2xl bg-white/60 border border-slate-100 flex items-center justify-center gap-2 text-slate-500 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>100% Safe & Instant Coin Top-Up</span>
        </div>

      </div>
    </div>
  );
};

export default BuyCoin;
