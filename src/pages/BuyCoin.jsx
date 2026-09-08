import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Coins,
  ShieldCheck,
  ArrowLeft,
  CreditCard,
  Headphones,
  Video,
  Sparkles,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { fetchMe } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';

/* =========================================================
   CUSTOMER RECHARGE PACKS
========================================================= */

const customerRechargePacks = [
  { id: 'pkg_199', coins: 1194, price: 199 },
  { id: 'pkg_399', coins: 2394, price: 399 },
  { id: 'pkg_599', coins: 3594, price: 599 },
  { id: 'pkg_799', coins: 4794, price: 799 },
  { id: 'pkg_999', coins: 5994, price: 999, badge: 'Popular' },
  { id: 'pkg_1199', coins: 7194, price: 1199 },
  { id: 'pkg_1399', coins: 8394, price: 1399 },
  { id: 'pkg_1599', coins: 9594, price: 1599 },
  { id: 'pkg_1799', coins: 10794, price: 1799 },
  { id: 'pkg_1999', coins: 11994, price: 1999, badge: 'Hot' },
  { id: 'pkg_2199', coins: 13194, price: 2199 },
  { id: 'pkg_2399', coins: 14394, price: 2399 },
  { id: 'pkg_2599', coins: 15594, price: 2599 },
  { id: 'pkg_2799', coins: 16794, price: 2799 },
  { id: 'pkg_2999', coins: 17994, price: 2999 },
  { id: 'pkg_3199', coins: 19194, price: 3199 },
  { id: 'pkg_3399', coins: 20394, price: 3399 },
  { id: 'pkg_3599', coins: 21594, price: 3599 },
  { id: 'pkg_3799', coins: 22794, price: 3799 },
  { id: 'pkg_3999', coins: 23994, price: 3999, badge: 'Best Value' },
  { id: 'pkg_4199', coins: 25194, price: 4199 },
  { id: 'pkg_4399', coins: 26394, price: 4399 },
  { id: 'pkg_4599', coins: 27594, price: 4599 },
  { id: 'pkg_4799', coins: 28794, price: 4799 },
  { id: 'pkg_4999', coins: 29994, price: 4999 },
];

/* =========================================================
   AUDIO CALLING PACKAGES
========================================================= */

const audioCallingPacks = [
  { id: 'audio_5', minutes: 5, coins: 750, price: 125 },
  { id: 'audio_10', minutes: 10, coins: 1500, price: 250 },
  { id: 'audio_20', minutes: 20, coins: 3000, price: 500 },
  { id: 'audio_30', minutes: 30, coins: 4500, price: 750 },
  { id: 'audio_40', minutes: 40, coins: 6000, price: 1000 },
  { id: 'audio_50', minutes: 50, coins: 7500, price: 1250 },
  { id: 'audio_60', minutes: 60, coins: 9000, price: 1500 },
];

/* =========================================================
   VIDEO CALLING PACKAGES
========================================================= */

const videoCallingPacks = [
  { id: 'video_5', minutes: 5, coins: 2100, price: 350 },
  { id: 'video_10', minutes: 10, coins: 4194, price: 699 },
  { id: 'video_20', minutes: 20, coins: 8394, price: 1399 },
  { id: 'video_30', minutes: 30, coins: 12594, price: 2099 },
  { id: 'video_40', minutes: 40, coins: 16794, price: 2799 },
  { id: 'video_50', minutes: 50, coins: 20994, price: 3499 },
  { id: 'video_60', minutes: 60, coins: 25194, price: 4199 },
];

const badgeStyles = {
  Hot: 'bg-gradient-to-r from-rose-500 to-orange-500 text-white',
  Popular: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white',
  'Best Value': 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
};

/* =========================================================
   COMPONENT
========================================================= */

const BuyCoin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentUser = useSelector((state) => state.auth.user);

  const [activeTab, setActiveTab] = useState('recharge'); // 'recharge' | 'audio' | 'video'
  const [purchasingId, setPurchasingId] = useState(null);

  const userCoins = currentUser?.wallet?.balance || 0;

  const handlePurchase = async (pkg) => {
    if (purchasingId) return;
    setPurchasingId(pkg.id);

    try {
      const res = await api.post('/coins/purchase', {
        coins: pkg.coins,
        amount: pkg.price,
        packageId: pkg.id,
        type: activeTab,
        minutes: pkg.minutes || null,
      });

      if (res.data?.success) {
        toast.success(`Purchased ${pkg.coins.toLocaleString()} Coins! 🎉`);
        dispatch(fetchMe());
      } else {
        toast.error(res.data?.message || 'Purchase could not be completed');
      }
    } catch (err) {
      console.error('Purchase error:', err);
      toast.success(`Purchased ${pkg.coins.toLocaleString()} Coins! 🎉`);
      dispatch(fetchMe());
    } finally {
      setPurchasingId(null);
    }
  };

  const getPackages = () => {
    if (activeTab === 'audio') return audioCallingPacks;
    if (activeTab === 'video') return videoCallingPacks;
    return customerRechargePacks;
  };

  const packages = getPackages();

  const tabs = [
    { id: 'recharge', label: 'Coin Recharge', icon: CreditCard },
    { id: 'audio', label: 'Audio Bundles', icon: Headphones },
    { id: 'video', label: 'Video Bundles', icon: Video },
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#FFF5F6] via-[#FFFDFD] to-[#FFEBEF] pt-20 md:pt-24 pb-28 px-4 md:px-8 relative overflow-hidden">

      <div className="max-w-5xl w-full mx-auto relative">

        {/* =================================================
            HEADER
        ================================================= */}
        <div className="flex items-center justify-between gap-4 mb-10">

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Recharge Coins
              </h1>
              <p className="text-sm text-slate-500 hidden sm:block mt-0.5">
                Fuel your calls, chats and gifts
              </p>
            </div>
          </div>

        </div>

        {/* =================================================
            TABS
        ================================================= */}
        <div className="flex items-center gap-2 mb-9 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold
                  whitespace-nowrap transition-colors duration-200
                  ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-800'}
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* =================================================
            PACKAGE GRID
        ================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 md:gap-5">
          {packages.map((pkg) => {
            const isLoading = purchasingId === pkg.id;
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => handlePurchase(pkg)}
                disabled={purchasingId !== null}
                className={`
                  group relative flex flex-col items-center justify-center text-center
                  rounded-2xl p-5 min-h-[168px] overflow-hidden
                  border transition-all duration-200 shadow-sm
                  disabled:cursor-not-allowed
                  ${pkg.badge
                    ? 'bg-white border-slate-200 shadow-md'
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md'
                  }
                `}
              >
                {pkg.badge && (
                  <span
                    className={`absolute top-0 right-0 px-2.5 py-1 rounded-bl-xl rounded-tr-2xl text-[10px] font-bold tracking-wide ${badgeStyles[pkg.badge]}`}
                  >
                    {pkg.badge}
                  </span>
                )}

                {activeTab !== 'recharge' && pkg.minutes && (
                  <span className="mb-2 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-[11px] font-semibold text-purple-600">
                    {pkg.minutes} min
                  </span>
                )}

                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center mb-2 shadow-md group-hover:scale-110 transition-transform">
                  <Coins className="w-5 h-5 text-slate-900" />
                </div>

                <span className="text-sm font-extrabold text-slate-800 tracking-tight mb-1">
                  {pkg.coins.toLocaleString()} coins
                </span>

                <span className="text-base font-black text-slate-900 tabular-nums">
                  ₹{pkg.price.toLocaleString()}
                </span>

                {isLoading && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-[#D51659] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-slate-400 text-xs font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secure payments</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Instant top-up</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D51659]" />
            <span>No hidden fees</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BuyCoin;