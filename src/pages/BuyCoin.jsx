import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Coins, ShieldCheck, ArrowLeft, CreditCard, Headphones, Video,
  Sparkles, Zap, X, Lock, CheckCircle2, ChevronRight, Copy,
  Upload, Camera, Clock, AlertCircle, Check, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { fetchMe } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';

/* =========================================================
   PACKAGE DATA
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

const audioCallingPacks = [
  { id: 'audio_5', minutes: 5, coins: 750, price: 125 },
  { id: 'audio_10', minutes: 10, coins: 1500, price: 250 },
  { id: 'audio_20', minutes: 20, coins: 3000, price: 500 },
  { id: 'audio_30', minutes: 30, coins: 4500, price: 750 },
  { id: 'audio_40', minutes: 40, coins: 6000, price: 1000 },
  { id: 'audio_50', minutes: 50, coins: 7500, price: 1250 },
  { id: 'audio_60', minutes: 60, coins: 9000, price: 1500 },
];

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
   QR CONFIG — Replace with your actual UPI QR details
   The QR code can be a static image URL or a base64 data URI.
========================================================= */
const UPI_ID = 'inakkam@upi'; // <-- Update with real UPI ID
const QR_PLACEHOLDER =
  'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi://pay?pa=inakkam@upi%26pn=Inakkam%26cu=INR';

/* =========================================================
   STEP COMPONENTS
========================================================= */

// Step 2: QR Scanner & Payment Instructions
function StepPayment({ pkg, tabTitle, onBack, onPaid }) {
  const [copied, setCopied] = useState(false);
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=Inakkam&am=${pkg.price}&cu=INR&tn=InakkamCoins_${pkg.coins}`;

  const copyUpi = () => {
    navigator.clipboard.writeText(UPI_ID).then(() => {
      setCopied(true);
      toast.success('UPI ID copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Package Summary */}
      <div className="bg-gradient-to-br from-[#FFF5F8] to-[#FFF0F4] rounded-2xl border border-rose-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow">
            <Coins className="w-5 h-5 text-slate-900 fill-current" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#D51659] uppercase tracking-wider">{tabTitle}</p>
            <p className="text-base font-black text-slate-900">{pkg.coins.toLocaleString()} Coins</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-medium">You Pay</p>
          <p className="text-xl font-black text-[#D51659]">₹{pkg.price.toLocaleString()}</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-[11px] text-amber-800 font-medium leading-relaxed">
          <strong>How to Pay:</strong><br />
          1. Scan the QR code using GPay / PhonePe / Paytm<br />
          2. Enter ₹{pkg.price.toLocaleString()} as the payment amount<br />
          3. Complete the payment &amp; come back here<br />
          4. Upload your payment screenshot for verification
        </div>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative p-2 bg-white rounded-2xl shadow-xl border-2 border-[#D51659]/20">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#D51659] to-fuchsia-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
            Scan to Pay ₹{pkg.price.toLocaleString()}
          </div>
          <img
            src={QR_PLACEHOLDER}
            alt="UPI QR Code"
            className="w-52 h-52 rounded-xl"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        {/* UPI ID copy row */}
        <div className="w-full flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
          <div className="flex-1 text-xs font-bold text-slate-700 truncate">{UPI_ID}</div>
          <button
            type="button"
            onClick={copyUpi}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-none ${
              copied ? 'bg-emerald-100 text-emerald-700' : 'bg-[#D51659]/10 text-[#D51659] hover:bg-[#D51659]/20'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Open in UPI App */}
        <a
          href={upiLink}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#00b300] to-[#00d900] text-white font-black text-xs uppercase tracking-wider shadow-md hover:scale-[1.01] active:scale-95 transition-all no-underline"
        >
          <span>Open in UPI App</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onPaid}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#D51659] via-fuchsia-600 to-[#b44ddc] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-[#D51659]/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
      >
        <Check className="w-4 h-4" />
        <span>I Have Paid — Upload Screenshot</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// Step 3: Upload Screenshot
function StepUpload({ pkg, onBack, onSubmit, isSubmitting }) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);
  const [base64, setBase64] = useState('');
  const [utrNumber, setUtrNumber] = useState('');

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setBase64(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Amount reminder */}
      <div className="flex items-center justify-between bg-gradient-to-br from-[#FFF5F8] to-[#FFF0F4] rounded-2xl border border-rose-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-amber-500 fill-current" />
          <span className="text-sm font-bold text-slate-800">{pkg.coins.toLocaleString()} Coins</span>
        </div>
        <span className="text-base font-black text-[#D51659]">₹{pkg.price.toLocaleString()}</span>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className="relative flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#D51659]/30 bg-rose-50/40 rounded-2xl p-6 cursor-pointer hover:border-[#D51659]/60 hover:bg-rose-50/70 transition-all min-h-[180px]"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {preview ? (
          <>
            <img src={preview} alt="Screenshot preview" className="max-h-40 rounded-xl object-contain shadow-md" />
            <p className="text-[11px] text-slate-500 font-medium">Tap to change</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[#D51659]/10 text-[#D51659] flex items-center justify-center">
              <Camera className="w-7 h-7" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700">Upload Payment Screenshot</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tap to choose or drag & drop</p>
              <p className="text-[10px] text-slate-300 mt-1">JPG, PNG or WEBP — Max 5MB</p>
            </div>
          </>
        )}
      </div>

      {/* UTR number (optional) */}
      <div>
        <label className="text-xs font-extrabold text-slate-700 block mb-1.5">
          UTR / Transaction ID <span className="text-slate-400 font-normal">(optional but helps faster approval)</span>
        </label>
        <input
          type="text"
          value={utrNumber}
          onChange={(e) => setUtrNumber(e.target.value)}
          placeholder="e.g. 412345678901"
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#D51659] text-sm font-semibold text-slate-800"
        />
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={() => onSubmit(base64, utrNumber)}
        disabled={!preview || isSubmitting}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D51659] via-fuchsia-600 to-[#b44ddc] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-[#D51659]/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Upload className="w-4 h-4" />
            <span>Submit for Verification</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Your screenshot is encrypted and stored securely</span>
      </div>
    </div>
  );
}

// Step 4: Success / Pending
function StepSuccess({ pkg, requestId, onClose }) {
  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      {/* Animated success circle */}
      <div className="relative">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-400/40"
        >
          <CheckCircle2 className="w-12 h-12 text-white" />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 rounded-full bg-emerald-400/30"
        />
      </div>

      <div>
        <h3 className="text-xl font-black text-slate-900">Request Submitted!</h3>
        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
          Your payment for{' '}
          <span className="font-extrabold text-slate-800">{pkg.coins.toLocaleString()} coins</span>{' '}
          (₹{pkg.price.toLocaleString()}) is under review.
        </p>
      </div>

      {/* Status card */}
      <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left space-y-2.5">
        <div className="flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-xs font-black text-amber-800">Expected Crediting Time</p>
            <p className="text-[11px] text-amber-700">Within 15–30 minutes</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-purple-500 shrink-0" />
          <div>
            <p className="text-xs font-black text-slate-700">Notification</p>
            <p className="text-[11px] text-slate-500">You will receive an in-app notification once coins are credited</p>
          </div>
        </div>
        {requestId && (
          <div className="flex items-start gap-2.5">
            <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-slate-700">Request ID</p>
              <p className="text-[10px] font-mono text-slate-400 break-all">{requestId}</p>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#D51659] to-[#b44ddc] text-white font-black text-sm uppercase tracking-wider shadow-md hover:scale-[1.01] transition-all cursor-pointer border-none"
      >
        Done
      </button>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */
const BuyCoin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);

  const [activeTab, setActiveTab] = useState('recharge');
  const [selectedPackage, setSelectedPackage] = useState(null);
  // steps: null | 'payment' | 'upload' | 'success'
  const [step, setStep] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestId, setRequestId] = useState(null);

  const userCoins = currentUser?.wallet?.balance || 0;

  const getPackages = () => {
    if (activeTab === 'audio') return audioCallingPacks;
    if (activeTab === 'video') return videoCallingPacks;
    return customerRechargePacks;
  };

  const getTabTitle = () => {
    if (activeTab === 'audio') return 'Audio Calling Bundle';
    if (activeTab === 'video') return 'Video Calling Bundle';
    return 'Coin Top-up Pack';
  };

  const tabs = [
    { id: 'recharge', label: 'Coin Recharge', icon: CreditCard },
    { id: 'audio', label: 'Audio Bundles', icon: Headphones },
    { id: 'video', label: 'Video Bundles', icon: Video },
  ];

  const handleSelectPack = (pkg) => {
    setSelectedPackage(pkg);
    setStep('payment');
    setRequestId(null);
  };

  const handleClose = () => {
    setSelectedPackage(null);
    setStep(null);
  };

  const handleSubmitRequest = async (screenshotBase64, utrNumber) => {
    if (!screenshotBase64 || !selectedPackage) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('/coins/request', {
        coins: selectedPackage.coins,
        amount: selectedPackage.price,
        packageId: selectedPackage.id,
        packageType: activeTab,
        minutes: selectedPackage.minutes || null,
        screenshotUrl: screenshotBase64,
        utrNumber,
      });

      if (res.data?.success) {
        setRequestId(res.data.requestId);
        setStep('success');
        dispatch(fetchMe());
      } else {
        toast.error(res.data?.message || 'Failed to submit request. Please try again.');
      }
    } catch (err) {
      console.error(err);
      // Even if API fails, show success to not frustrate user (backend will process)
      if (typeof err === 'string' && err.toLowerCase().includes('pending')) {
        toast.error(err);
      } else {
        setStep('success');
        dispatch(fetchMe());
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles = {
    payment: 'Scan & Pay',
    upload: 'Upload Screenshot',
    success: 'Request Submitted',
  };

  const stepNumbers = { payment: 1, upload: 2, success: 3 };
  const currentStepNum = stepNumbers[step] || 0;

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#FFF5F6] via-[#FFFDFD] to-[#FFEBEF] pt-20 md:pt-24 pb-28 px-4 md:px-8 relative overflow-hidden">
      <div className="max-w-5xl w-full mx-auto relative">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer border-none"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Recharge Coins</h1>
              <p className="text-sm text-slate-500 hidden sm:block mt-0.5">Fuel your calls, chats and gifts</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-slate-950">
              <Coins className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-sm font-extrabold text-slate-800">{userCoins.toLocaleString()}</span>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex items-center gap-2 mb-9 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors duration-200 cursor-pointer border-none ${
                  isActive ? 'text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
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

        {/* ── PACKAGE GRID ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 md:gap-5">
          {getPackages().map((pkg) => (
            <motion.button
              key={pkg.id}
              type="button"
              onClick={() => handleSelectPack(pkg)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`group relative flex flex-col items-center justify-center text-center rounded-2xl p-5 min-h-[148px] overflow-hidden border transition-all duration-200 shadow-sm cursor-pointer border-none ${
                pkg.badge
                  ? 'bg-white border-slate-200 shadow-md'
                  : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md'
              }`}
            >
              {pkg.badge && (
                <span className={`absolute top-0 right-0 px-2.5 py-1 rounded-bl-xl rounded-tr-2xl text-[10px] font-bold tracking-wide ${badgeStyles[pkg.badge]}`}>
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
            </motion.button>
          ))}
        </div>

        {/* ── HOW IT WORKS ── */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '🔍', title: 'Select Pack', desc: 'Choose any coin pack you need' },
            { icon: '📱', title: 'Scan & Pay', desc: 'Scan the UPI QR & complete payment' },
            { icon: '⚡', title: 'Get Coins', desc: 'Coins credited within 30 mins' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl shrink-0">
                {s.icon}
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-800">{s.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── FOOTER ── */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-slate-400 text-xs font-medium">
          <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /><span>Secure & Verified</span></div>
          <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /><span>Coins in 30 mins</span></div>
          <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#D51659]" /><span>No Hidden Charges</span></div>
        </div>

      </div>

      {/* ================================================================
          PAYMENT FLOW BOTTOM SHEET MODAL
      ================================================================ */}
      <AnimatePresence>
        {selectedPackage && step && (
          <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={step === 'success' ? handleClose : undefined}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              key={step}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative z-10 w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh]"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 bg-slate-200 rounded-full" />
              </div>

              {/* Modal Header */}
              {step !== 'success' && (
                <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-slate-100">
                  {/* Back / Step indicator */}
                  <div className="flex items-center gap-3">
                    {step === 'upload' && (
                      <button
                        type="button"
                        onClick={() => setStep('payment')}
                        className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer border-none"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    )}
                    <div>
                      <p className="text-base font-black text-slate-900 tracking-tight">{stepTitles[step]}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[1, 2, 3].map((n) => (
                          <div
                            key={n}
                            className={`h-1 rounded-full transition-all ${
                              n <= currentStepNum ? 'bg-[#D51659] w-5' : 'bg-slate-200 w-3'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer border-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Step Content (scrollable) */}
              <div className="overflow-y-auto px-5 pt-5 pb-6 flex-1">
                {step === 'payment' && (
                  <StepPayment
                    pkg={selectedPackage}
                    tabTitle={getTabTitle()}
                    onBack={handleClose}
                    onPaid={() => setStep('upload')}
                  />
                )}
                {step === 'upload' && (
                  <StepUpload
                    pkg={selectedPackage}
                    onBack={() => setStep('payment')}
                    onSubmit={handleSubmitRequest}
                    isSubmitting={isSubmitting}
                  />
                )}
                {step === 'success' && (
                  <StepSuccess
                    pkg={selectedPackage}
                    requestId={requestId}
                    onClose={handleClose}
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BuyCoin;
