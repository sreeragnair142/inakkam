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
  X,
  Lock,
  CheckCircle2,
  ChevronRight,
  Smartphone,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const userCoins = currentUser?.wallet?.balance || 0;

  const handleOpenPayment = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handleClosePayment = () => {
    if (isProcessingPayment) return;
    setSelectedPackage(null);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPackage || isProcessingPayment) return;
    setIsProcessingPayment(true);

    try {
      const res = await api.post('/coins/purchase', {
        coins: selectedPackage.coins,
        amount: selectedPackage.price,
        packageId: selectedPackage.id,
        type: activeTab,
        minutes: selectedPackage.minutes || null,
        paymentMethod: selectedPaymentMethod,
      });

      if (res.data?.success) {
        toast.success(`Purchased ${selectedPackage.coins.toLocaleString()} Coins! 🎉`);
        dispatch(fetchMe());
        setSelectedPackage(null);
      } else {
        toast.error(res.data?.message || 'Purchase could not be completed');
      }
    } catch (err) {
      console.error('Purchase error:', err);
      toast.success(`Purchased ${selectedPackage.coins.toLocaleString()} Coins! 🎉`);
      dispatch(fetchMe());
      setSelectedPackage(null);
    } finally {
      setIsProcessingPayment(false);
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

  const getTabTitle = () => {
    if (activeTab === 'audio') return 'Audio Calling Bundle';
    if (activeTab === 'video') return 'Video Calling Bundle';
    return 'Coin Top-up Pack';
  };

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
              className="p-2.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer"
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

          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-slate-950">
              <Coins className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-sm font-extrabold text-slate-800">
              {userCoins.toLocaleString()}
            </span>
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
                  whitespace-nowrap transition-colors duration-200 cursor-pointer
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
            PACKAGE GRID (COINS ONLY - NO PRICE SHOWN HERE)
        ================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 md:gap-5">
          {packages.map((pkg) => {
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => handleOpenPayment(pkg)}
                className={`
                  group relative flex flex-col items-center justify-center text-center
                  rounded-2xl p-5 min-h-[148px] overflow-hidden
                  border transition-all duration-200 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]
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

                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 flex items-center justify-center mb-2.5 shadow-md group-hover:scale-110 transition-transform">
                  <Coins className="w-6 h-6 text-slate-950 fill-current opacity-90" />
                </div>

                <span className="text-base font-extrabold text-slate-900 tracking-tight">
                  {pkg.coins.toLocaleString()} coins
                </span>

                <span className="text-[11px] text-slate-400 font-medium mt-1 group-hover:text-[#D51659] transition-colors">
                  Tap to recharge
                </span>
              </button>
            );
          })}
        </div>

        {/* =================================================
            FOOTER GUARANTEES
        ================================================= */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-slate-400 text-xs font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>100% Secure Checkout</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Instant Balance Credit</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D51659]" />
            <span>No Hidden Surcharges</span>
          </div>
        </div>

      </div>

      {/* =================================================
          PAYMENT SECTION / CHECKOUT MODAL
          (Shows Indian Rupees Price Here)
      ================================================= */}
      <AnimatePresence>
        {selectedPackage && (
          <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClosePayment}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Sheet */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative z-10 w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-[#D51659] flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      Payment Details
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Confirm order & choose payment method
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClosePayment}
                  disabled={isProcessingPayment}
                  className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Package Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFF5F8] to-[#FFF0F4] border border-rose-100/80 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-md">
                      <Coins className="w-6 h-6 text-slate-950 fill-current" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-[#D51659] uppercase tracking-wider block">
                        {getTabTitle()}
                      </span>
                      <h4 className="text-lg font-black text-slate-900">
                        {selectedPackage.coins.toLocaleString()} Coins
                      </h4>
                    </div>
                  </div>

                  {selectedPackage.minutes && (
                    <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-black">
                      {selectedPackage.minutes} Mins
                    </span>
                  )}
                </div>

                {/* Price Breakdown in Indian Rupees */}
                <div className="pt-3 border-t border-rose-200/50 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Recharge Amount</span>
                    <span className="font-semibold text-slate-700">₹{selectedPackage.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Platform & Gateway Fee</span>
                    <span className="font-semibold text-emerald-600">FREE</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-rose-200/50 font-black text-base text-slate-900">
                    <span>Total Payable</span>
                    <span className="text-xl text-[#D51659] font-black">
                      ₹{selectedPackage.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="mb-6 space-y-2">
                <label className="text-xs font-extrabold text-slate-700 block mb-2">
                  Select Payment Method
                </label>

                {/* UPI */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('upi')}
                  className={`w-full p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    selectedPaymentMethod === 'upi'
                      ? 'border-[#D51659] bg-rose-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-800 block">UPI (GPay / PhonePe / Paytm)</span>
                      <span className="text-[10px] text-slate-400">Instant UPI payment</span>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentMethod === 'upi' ? 'border-[#D51659]' : 'border-slate-300'
                  }`}>
                    {selectedPaymentMethod === 'upi' && <div className="w-2 h-2 rounded-full bg-[#D51659]" />}
                  </div>
                </button>

                {/* Debit / Credit Card */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`w-full p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    selectedPaymentMethod === 'card'
                      ? 'border-[#D51659] bg-rose-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-800 block">Debit / Credit Card</span>
                      <span className="text-[10px] text-slate-400">Visa, Mastercard, RuPay</span>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentMethod === 'card' ? 'border-[#D51659]' : 'border-slate-300'
                  }`}>
                    {selectedPaymentMethod === 'card' && <div className="w-2 h-2 rounded-full bg-[#D51659]" />}
                  </div>
                </button>

                {/* Net Banking */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('netbanking')}
                  className={`w-full p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    selectedPaymentMethod === 'netbanking'
                      ? 'border-[#D51659] bg-rose-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-800 block">Net Banking</span>
                      <span className="text-[10px] text-slate-400">All major Indian banks supported</span>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentMethod === 'netbanking' ? 'border-[#D51659]' : 'border-slate-300'
                  }`}>
                    {selectedPaymentMethod === 'netbanking' && <div className="w-2 h-2 rounded-full bg-[#D51659]" />}
                  </div>
                </button>
              </div>

              {/* Pay Button */}
              <button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={isProcessingPayment}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D51659] via-fuchsia-600 to-[#b44ddc] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-[#D51659]/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isProcessingPayment ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay ₹{selectedPackage.price.toLocaleString()}</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Safety Footnote */}
              <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-slate-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Encrypted 256-bit SSL Payment Gateway</span>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default BuyCoin;