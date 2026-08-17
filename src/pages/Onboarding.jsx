import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronRight, EyeOff, CheckCircle2, Plus, X, Search, Flame, Loader2, Pencil } from "lucide-react";
import landscapeLogo from "../assets/landscapelogowhite.png";
import { useDispatch, useSelector } from "react-redux";
import api from "../utils/api";
import { updateProfile } from "../redux/slices/authSlice";

export default function Onboarding() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const fileInputRef = React.useRef(null);
  const [formStep, setFormStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const [interestSearch, setInterestSearch] = useState("");
  const totalFormSteps = 11;

  const [dbLanguages, setDbLanguages] = useState([]);
  const [dbInterests, setDbInterests] = useState([]);
  const [dbReligions, setDbReligions] = useState([]);
  const [dbRelationGoals, setDbRelationGoals] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  // Custom premium states for OTP
  const [countryCode, setCountryCode] = useState("+91");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);
  const otpRefs = React.useRef([]);

  const countryCodes = [
    { code: "+91", name: "India", flag: "🇮🇳" },
    { code: "+1", name: "US/Canada", flag: "🇺🇸" },
    { code: "+44", name: "UK", flag: "🇬🇧" },
    { code: "+971", name: "UAE", flag: "🇦🇪" },
    { code: "+61", name: "Australia", flag: "🇦🇺" },
    { code: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
    { code: "+65", name: "Singapore", flag: "🇸🇬" },
  ];

  React.useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Request geolocation when the user reaches the distance preference step (step 6)
  React.useEffect(() => {
    if (formStep === 6) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { longitude, latitude } = position.coords;
            setUserLocation({
              type: "Point",
              coordinates: [longitude, latitude]
            });
          },
          (err) => {
            console.warn("Geolocation permission denied or error occurred:", err);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    }
  }, [formStep]);

  React.useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await api.get('/users/onboarding-options');
        if (res.data) {
          if (res.data.languages) setDbLanguages(res.data.languages);
          if (res.data.interests) setDbInterests(res.data.interests);
          if (res.data.religions) setDbReligions(res.data.religions);
          if (res.data.relationGoals) setDbRelationGoals(res.data.relationGoals);
        }
      } catch (err) {
        console.error("Failed to fetch onboarding options:", err);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  const [formData, setFormData] = useState({
    firstName: user?.name || "", 
    email: user?.email || "", 
    password: "", 
    bio: "Lover of adventure, books, and strong coffee.",
    phone: user?.phone || "", 
    otp: "", 
    birthday: "1994-05-15", 
    gender: "Man", 
    goals: "Dating", 
    distance: 295,
    interests: ["Cooking", "Yoga", "Books", "Wine"], 
    languages: ["English", "Hindi"],
    religion: "Hinduism", 
    searchPreference: "Both",
    photos: ["https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=300", "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300"]
  });
  const [otpSent, setOtpSent] = useState(false);

  const handleVerifyOtp = async (codeToVerify) => {
    const code = codeToVerify || formData.otp;
    if (!code || code.length !== 6) {
      setOtpError("Please enter a 6-digit verification code");
      return;
    }

    setIsVerifying(true);
    setOtpError("");
    const fullPhone = `${countryCode}${formData.phone.replace(/\D/g, '')}`;

    try {
      await api.post('/auth/verify-otp', { phone: fullPhone, otp: code });
      
      setOtpSuccess(true);
      
      setTimeout(() => {
        setFormStep(3);
        setOtpSent(false);
        setOtpSuccess(false);
        setIsVerifying(false);
        updateData('otp', ''); // Clear OTP input
      }, 1200);

    } catch (err) {
      setOtpError(typeof err === 'string' ? err : 'Invalid OTP code');
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0 || isVerifying) return;
    
    setIsVerifying(true);
    setOtpError("");
    updateData('otp', ''); // Clear code
    
    const fullPhone = `${countryCode}${formData.phone.replace(/\D/g, '')}`;
    try {
      await api.post('/auth/send-otp', { phone: fullPhone });
      setOtpCountdown(60); // Reset timer
    } catch (err) {
      setOtpError(typeof err === 'string' ? err : 'Failed to resend OTP');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = (formData.otp || "").split('');
    newOtp[index] = value;
    const combinedOtp = newOtp.join('');
    updateData('otp', combinedOtp);

    setOtpError(""); // Clear error on typing

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (combinedOtp.length === 6) {
      handleVerifyOtp(combinedOtp);
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      
      const newOtp = (formData.otp || "").split('');
      
      if (newOtp[index]) {
        newOtp[index] = "";
        updateData('otp', newOtp.join(''));
      } else if (index > 0) {
        newOtp[index - 1] = "";
        updateData('otp', newOtp.join(''));
        otpRefs.current[index - 1]?.focus();
      }
      setOtpError("");
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      updateData('otp', pastedData);
      setOtpError("");
      
      const chars = pastedData.split('');
      chars.forEach((char, idx) => {
        if (otpRefs.current[idx]) {
          otpRefs.current[idx].value = char;
        }
      });

      const lastIndex = Math.min(chars.length - 1, 5);
      otpRefs.current[lastIndex]?.focus();

      if (pastedData.length === 6) {
        handleVerifyOtp(pastedData);
      }
    }
  };

  const handleFormNext = async () => {
    if (formStep === 2 && !otpSent) { 
      const sanitizedPhone = formData.phone.replace(/\D/g, '');
      if (!sanitizedPhone || sanitizedPhone.length < 7) {
        alert("Please enter a valid phone number");
        return;
      }

      setIsVerifying(true);
      const fullPhone = `${countryCode}${sanitizedPhone}`;
      try {
        await api.post('/auth/send-otp', { phone: fullPhone });
        setOtpSent(true); 
        setOtpCountdown(60); // 60s countdown
      } catch (err) {
        alert(err);
      } finally {
        setIsVerifying(false);
      }
      return; 
    }
    
    if (formStep === 2 && otpSent) {
      await handleVerifyOtp();
      return;
    }

    if (formStep < totalFormSteps) {
      setFormStep(formStep + 1);
      setOtpSent(false);
    }
    else {
      await submitOnboarding();
    }
  };

  const calculateAge = (birthday) => {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const submitOnboarding = async () => {
    setIsSubmitting(true);
    try {
      const mappedData = {
        name: formData.firstName,
        bio: formData.bio,
        age: calculateAge(formData.birthday),
        gender: formData.gender,
        relationship: formData.goals,
        maxDistance: parseInt(formData.distance),
        location: userLocation || { type: 'Point', coordinates: [76.2673, 9.9312] },
        interests: formData.interests,
        languages: formData.languages,
        religion: formData.religion,
        interestedIn: ['Everyone', 'Both'].includes(formData.searchPreference) 
          ? ['Man', 'Woman', 'Non-binary', 'Transgender Man', 'Transgender Woman', 'Genderqueer', 'Lesbian', 'Other'] 
          : [formData.searchPreference],
        isComplete: true,
        photos: formData.photos,
        phone: formData.phone,
      };
      const res = await api.put('/users/me/onboarding', mappedData);
      dispatch(updateProfile(res.data.user));
      navigate('/profile');
    } catch (err) {
      console.error("Onboarding failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleFormBack = () => {
    if (formStep === 2 && otpSent) { setOtpSent(false); return; }
    if (formStep > 1) { setFormStep(formStep - 1); } else { navigate('/auth'); }
  };
  const updateData = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const toggleArrayItem = (field, item) => {
    setFormData(prev => {
      const arr = prev[field];
      return arr.includes(item) ? { ...prev, [field]: arr.filter(i => i !== item) } : { ...prev, [field]: [...arr, item] };
    });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (formData.photos.length >= 6) {
        alert("Maximum 6 photos allowed");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateData('photos', [...formData.photos, reader.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index) => {
    updateData('photos', formData.photos.filter((_, i) => i !== index));
  };

  const stepTitles = {
    1: { title: 'Tell us about you 😎', sub: 'This will be displayed on your profile.' },
    2: { title: 'Verify your number 📱', sub: 'Add your phone number for verification.' },
    3: { title: "When's your birthday? 🎂", sub: 'Only your age will be shown publicly.' },
    4: { title: 'What\'s your gender? 🌟', sub: 'Choose the gender that represents you.' },
    5: { title: 'Relationship goals 💖', sub: 'What kind of connection are you looking for?' },
    6: { title: 'Distance preference 📍', sub: 'How far should we search for matches?' },
    7: { title: 'Your interests 🥰', sub: 'Pick things you love doing.' },
    8: { title: 'Languages you speak 🗺️', sub: 'Select all languages you know.' },
    9: { title: 'Your faith 🤗', sub: 'Share your religion if you\'d like.' },
    10: { title: 'Show me 🌟', sub: 'Who do you want to see?' },
    11: { title: 'Add your photos 📸', sub: 'Show your best self to the world.' },
  };
  const { title, sub } = stepTitles[formStep] || {};

  // --- Styled input class helpers ---
  const inputCls = "w-full px-5 py-4 text-base font-bold text-white bg-white/5 border-2 border-white/10 rounded-2xl placeholder-white/40 focus:border-[#D51659] focus:ring-4 focus:ring-[#D51659]/20 outline-none transition-all";
  const selectedCls = "border-[#D51659] bg-[#D51659]/20 shadow-sm shadow-[#D51659]/10 text-white";
  const unselectedCls = "border-white/10 hover:border-white/30 bg-white/5 text-white/70";
  const chipSelectedCls = "bg-[#D51659] border-[#D51659] text-white shadow-lg shadow-[#D51659]/20";
  const chipUnselectedCls = "bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white";

  // --- Step content rendered as inline JSX (NOT as components) to prevent focus loss ---
  const allInterests = [
    { id: 'Travel', icon: '✈️' }, { id: 'Cooking', icon: '🍳' }, { id: 'Hiking', icon: '⛰️' },
    { id: 'Yoga', icon: '🧘' }, { id: 'Gaming', icon: '🎮' }, { id: 'Movies', icon: '🎬' },
    { id: 'Books', icon: '📚' }, { id: 'Animals', icon: '🐾' }, { id: 'Wine', icon: '🍷' },
    { id: 'Music', icon: '🎵' }, { id: 'Photography', icon: '📸' }, { id: 'Art', icon: '🎨' },
    { id: 'Sports', icon: '⚽' }, { id: 'Fitness', icon: '💪' }, { id: 'Dancing', icon: '💃' }
  ];
  const allGoals = [
    { id: 'Dating', icon: '💑', desc: 'Genuine relationships and love.' },
    { id: 'Friendship', icon: '🤝', desc: 'Expand your social circle.' },
    { id: 'Casual', icon: '😉', desc: 'Fun and relaxed encounters.' },
    { id: 'Serious', icon: '💍', desc: 'Commitment and partnership.' },
    { id: 'Open', icon: '😎', desc: 'Open to various connections.' },
  ];
  const allLangs = [
    { id: 'English', icon: '🇬🇧' }, { id: 'Gujarati', icon: '🇮🇳' }, { id: 'Hindi', icon: '🇮🇳' }, { id: 'Bengali', icon: '🇧🇩' },
    { id: 'Spanish', icon: '🇪🇸' }, { id: 'French', icon: '🇫🇷' }, { id: 'German', icon: '🇩🇪' }, { id: 'Italian', icon: '🇮🇹' },
    { id: 'Portuguese', icon: '🇵🇹' }, { id: 'Russian', icon: '🇷🇺' }, { id: 'Chinese', icon: '🇨🇳' }, { id: 'Japanese', icon: '🇯🇵' },
    { id: 'Korean', icon: '🇰🇷' }, { id: 'Arabic', icon: '🇸🇦' }, { id: 'Turkish', icon: '🇹🇷' }, { id: 'Dutch', icon: '🇳🇱' },
    { id: 'Tamil', icon: '🇮🇳' }, { id: 'Telugu', icon: '🇮🇳' }, { id: 'Marathi', icon: '🇮🇳' }, { id: 'Urdu', icon: '🇵🇰' },
    { id: 'Punjabi', icon: '🇮🇳' }, { id: 'Malayalam', icon: '🇮🇳' }, { id: 'Kannada', icon: '🇮🇳' }, { id: 'Odia', icon: '🇮🇳' }
  ];
  const allReligions = ['Islam', 'Hinduism', 'Christianity', 'Buddhism', 'Judaism', 'Sikhism', 'Taoism', 'Jainism', 'Shintoism', 'Atheist', 'Agnostic', 'Spiritual', 'Other'];
  const genderOptions = ['Man', 'Woman', 'Non-binary', 'Transgender Man', 'Transgender Woman', 'Genderqueer', 'Lesbian', 'Other'];
  const searchPreferenceOptions = ['Man', 'Woman', 'Non-binary', 'Transgender', 'Everyone', 'Lesbian', 'Other'];

  const languagesList = dbLanguages.length > 0
    ? dbLanguages.map(l => ({
        id: l.title,
        icon: l.image || '💬',
        isCustomImage: !!l.image
      }))
    : allLangs;

  const interestsList = dbInterests.length > 0
    ? dbInterests.map(i => ({
        id: i.title,
        icon: i.image || '🥰',
        isCustomImage: !!i.image
      }))
    : allInterests;

  const religionsList = dbReligions.length > 0
    ? dbReligions.map(r => r.title)
    : allReligions;

  const goalsList = dbRelationGoals.length > 0
    ? dbRelationGoals.map(g => ({
        id: g.title,
        desc: g.subtitle || '',
        icon: '💖'
      }))
    : allGoals;

  const renderStep = () => {
    switch (formStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="relative">
              <input type="text" placeholder="First Name" value={formData.firstName} onChange={e => updateData('firstName', e.target.value)} className={inputCls + " pr-12"} />
              {formData.firstName && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bumble-yellow" />}
            </div>
            <div className="relative">
              <input type="email" placeholder="Email" value={formData.email} onChange={e => updateData('email', e.target.value)} className={inputCls + " pr-12"} />
              {formData.email && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bumble-yellow" />}
            </div>
            <div className="relative">
              <input type="password" placeholder="Password" value={formData.password} onChange={e => updateData('password', e.target.value)} className={inputCls + " pr-12"} />
              <EyeOff className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 cursor-pointer hover:text-bumble-charcoal transition-colors" />
            </div>
            <textarea placeholder="Write a short bio…" value={formData.bio} onChange={e => updateData('bio', e.target.value)} rows="3" className={inputCls + " resize-none"} />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            {!otpSent ? (
              <div className="space-y-4">
                <div className="flex border-2 border-white/10 rounded-2xl overflow-hidden focus-within:border-[#D51659] focus-within:ring-4 focus-within:ring-[#D51659]/10 bg-white/5 transition-all">
                  {/* Premium Country Code Picker */}
                  <div className="relative bg-white/10 border-r-2 border-white/10 flex items-center text-white font-bold text-base min-w-[100px]">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    >
                      {countryCodes.map((c) => (
                        <option key={c.code} value={c.code} className="text-black bg-white">
                          {c.flag} {c.code} ({c.name})
                        </option>
                      ))}
                    </select>
                    <div className="px-4 py-4 w-full flex items-center justify-between select-none">
                      <span>{countryCodes.find((c) => c.code === countryCode)?.flag} {countryCode}</span>
                      <span className="text-xs opacity-50 ml-1">▼</span>
                    </div>
                  </div>
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    value={formData.phone}
                    onChange={(e) => updateData('phone', e.target.value.replace(/\D/g, ''))}
                    className="w-full px-5 py-4 text-base font-bold outline-none text-white bg-transparent placeholder-white/40"
                  />
                </div>
                
                <button
                  onClick={handleFormNext}
                  disabled={isVerifying || !formData.phone || formData.phone.length < 7}
                  className="w-full py-4 bg-[#D51659] text-white rounded-2xl font-black text-base shadow-xl shadow-[#D51659]/20 hover:bg-[#b44ddc] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send Verification OTP"
                  )}
                </button>
              </div>
            ) : (
              <motion.div 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                className="bg-black/40 backdrop-blur-2xl p-6 lg:p-8 rounded-3xl border-2 border-white/10 shadow-xl"
              >
                {otpSuccess ? (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    className="flex flex-col items-center justify-center py-6 text-center"
                  >
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500 mb-4 shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-1">Verified! 🎉</h3>
                    <p className="text-sm text-white/60 font-medium">Setting up your profile...</p>
                  </motion.div>
                ) : (
                  <>
                    <h2 className="text-2xl font-black text-white mb-2">Verify Number 📱</h2>
                    <div className="flex items-center flex-wrap gap-1 text-sm text-white/50 font-medium mb-8">
                      <span>We sent a 6-digit code to </span>
                      <strong className="text-white font-bold">{countryCode} {formData.phone}</strong>
                      <button 
                        onClick={() => { setOtpSent(false); updateData('otp', ''); setOtpError(''); }} 
                        className="inline-flex items-center gap-1 ml-2 text-xs font-black text-[#D51659] hover:text-[#b44ddc] transition-colors cursor-pointer border border-[#D51659]/30 rounded-lg px-2 py-0.5 hover:bg-[#D51659]/10"
                      >
                        <Pencil className="w-3 h-3" /> Change
                      </button>
                    </div>

                    {/* Code Container with Shake Effect on Error */}
                    <motion.div 
                      animate={otpError ? { x: [-10, 10, -10, 10, 0] } : {}}
                      transition={{ duration: 0.4 }}
                      className="flex gap-2.5 mb-6 justify-center lg:justify-start"
                    >
                      {[0, 1, 2, 3, 4, 5].map(i => (
                        <input
                          key={i}
                          type="text"
                          maxLength={1}
                          pattern="\d*"
                          inputMode="numeric"
                          ref={el => otpRefs.current[i] = el}
                          value={formData.otp[i] || ""}
                          onKeyDown={e => handleOtpKeyDown(e, i)}
                          onPaste={handleOtpPaste}
                          onChange={e => handleOtpChange(e.target.value, i)}
                          className="w-11 h-14 sm:w-12 sm:h-15 lg:w-14 lg:h-16 border-2 border-white/10 rounded-2xl text-center text-xl lg:text-2xl font-black focus:border-[#D51659] focus:ring-4 focus:ring-[#D51659]/10 outline-none bg-white/5 text-white transition-all shadow-md focus:scale-[1.05]"
                        />
                      ))}
                    </motion.div>

                    {/* Inline Error Message */}
                    {otpError && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="text-sm text-rose-500 font-bold mb-6 text-center lg:text-left"
                      >
                        ⚠️ {otpError}
                      </motion.p>
                    )}

                    <button 
                      onClick={() => handleVerifyOtp()} 
                      disabled={isVerifying || formData.otp.length !== 6}
                      className="w-full py-4 bg-[#D51659] text-white rounded-2xl font-black text-base shadow-xl shadow-[#D51659]/20 hover:bg-[#b44ddc] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Verifying Code...
                        </>
                      ) : (
                        "Verify & Continue"
                      )}
                    </button>

                    {/* Countdown and Resend */}
                    <div className="mt-6 text-center lg:text-left flex items-center justify-between text-xs font-semibold text-white/50">
                      <span>Didn't get the code?</span>
                      {otpCountdown > 0 ? (
                        <span>Resend in <b className="text-[#D51659]">{otpCountdown}s</b></span>
                      ) : (
                        <button 
                          onClick={handleResendOtp} 
                          disabled={isVerifying}
                          className="font-bold text-[#D51659] hover:text-[#b44ddc] hover:underline disabled:opacity-40 cursor-pointer transition-colors"
                        >
                          Resend Code
                        </button>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </div>
        );
      case 3:
        return (
          <div><input type="date" value={formData.birthday} onChange={e => updateData('birthday', e.target.value)} className={inputCls + " font-black"} /></div>
        );
      case 4:
        return (
          <div className="space-y-3 pb-12">
            {genderOptions.map(g => (
              <div key={g} onClick={() => updateData('gender', g)} className={`p-5 rounded-2xl border-2 flex justify-between items-center cursor-pointer transition-all ${formData.gender === g ? selectedCls : unselectedCls}`}>
                <span className="font-black text-base text-white">{g}</span>
                {formData.gender === g && <CheckCircle2 className="w-6 h-6 text-[#D51659]" />}
              </div>
            ))}
          </div>
        );
      case 5:
        return (
          <div className="space-y-3 pb-12">
            {goalsList.map(g => (
              <div key={g.id} onClick={() => updateData('goals', g.id)} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.goals === g.id ? selectedCls : unselectedCls}`}>
                <div className="flex items-center gap-3 mb-1"><span className="text-xl">{g.icon}</span><span className="font-black text-base text-white">{g.id}</span></div>
                <p className="text-xs text-white/50 font-medium ml-9">{g.desc}</p>
              </div>
            ))}
          </div>
        );
      case 6:
        return (
          <div className="pt-4">
            <div className="flex justify-between items-center mb-8">
              <span className="text-sm font-black text-white/50 uppercase tracking-wider">Distance</span>
              <span className="text-xl font-black text-white bg-[#D51659]/20 px-5 py-2 rounded-full border border-[#D51659]/30">{formData.distance} km</span>
            </div>
            <input type="range" min="1" max="500" value={formData.distance} onChange={e => updateData('distance', e.target.value)} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#D51659]" />
          </div>
        );
      case 7:
        return (
          <div className="pb-12">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="text" placeholder="Search interests…" value={interestSearch} onChange={(e) => setInterestSearch(e.target.value)} className={inputCls + " pl-12"} />
            </div>
            <div className="flex flex-wrap gap-3">
              {interestsList.filter(i => i.id.toLowerCase().includes(interestSearch.toLowerCase())).map(i => {
                const sel = formData.interests.includes(i.id);
                return (
                  <button key={i.id} onClick={() => toggleArrayItem('interests', i.id)} className={`px-5 py-3 rounded-full border-2 flex items-center gap-2 transition-all text-sm font-black cursor-pointer ${sel ? chipSelectedCls : chipUnselectedCls}`}>
                    {i.isCustomImage ? <img src={i.icon} className="w-5 h-5 rounded-full object-cover" alt="" /> : <span>{i.icon}</span>}
                    <span>{i.id}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 8:
        return (
          <div className="pb-12">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="text" placeholder="Search languages…" value={langSearch} onChange={(e) => setLangSearch(e.target.value)} className={inputCls + " pl-12"} />
            </div>
            <div className="space-y-3">
              {languagesList.filter(l => l.id.toLowerCase().includes(langSearch.toLowerCase())).map(l => {
                const sel = formData.languages.includes(l.id);
                return (
                  <div key={l.id} onClick={() => toggleArrayItem('languages', l.id)} className={`p-5 rounded-2xl border-2 flex justify-between items-center cursor-pointer transition-all ${sel ? selectedCls : unselectedCls}`}>
                    <div className="flex items-center gap-4">
                      {l.isCustomImage ? <img src={l.icon} className="w-8 h-8 rounded-lg object-cover" alt="" /> : <span className="text-2xl">{l.icon}</span>}
                      <span className="font-black text-base text-white">{l.id}</span>
                    </div>
                    {sel && <CheckCircle2 className="w-6 h-6 text-[#D51659]" />}
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 9:
        return (
          <div>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="text" placeholder="Search…" className={inputCls + " pl-12"} />
            </div>
            <div className="flex flex-wrap gap-3">
              {religionsList.map(r => {
                const sel = formData.religion === r;
                return <button key={r} onClick={() => updateData('religion', r)} className={`px-5 py-3 rounded-full border-2 transition-all text-sm font-black cursor-pointer ${sel ? chipSelectedCls : chipUnselectedCls}`}>{r}</button>;
              })}
            </div>
          </div>
        );
      case 10:
        return (
          <div className="space-y-3 pb-12">
            {searchPreferenceOptions.map(p => (
              <div key={p} onClick={() => updateData('searchPreference', p)} className={`p-5 rounded-2xl border-2 flex justify-between items-center cursor-pointer transition-all ${formData.searchPreference === p ? selectedCls : unselectedCls}`}>
                <span className="font-black text-base text-white">{p}</span>
                {formData.searchPreference === p && <CheckCircle2 className="w-6 h-6 text-[#D51659]" />}
              </div>
            ))}
          </div>
        );
      case 11:
        return (
          <div className="grid grid-cols-3 gap-3 lg:gap-5">
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handlePhotoUpload} />
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div 
                key={i} 
                onClick={() => !formData.photos[i] && fileInputRef.current?.click()}
                className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 bg-white/5 relative overflow-hidden flex items-center justify-center cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all group"
              >
                {formData.photos[i] ? (
                  <>
                    <img src={formData.photos[i]} alt="Upload" className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md text-white hover:text-rose-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="w-10 h-10 rounded-full border-2 border-white/20 text-white/40 flex items-center justify-center group-hover:border-[#D51659] group-hover:text-[#D51659] transition-colors bg-white/5 shadow-sm">
                    <Plus className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-[100dvh] w-full overflow-hidden flex items-center justify-center lg:p-10" style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #1a0a15 20%, #15061a 45%, #0d0515 70%, #0A0A0A 100%)' }}>
      <div className="w-full h-full lg:h-[85vh] lg:max-h-[850px] lg:max-w-5xl bg-black/30 backdrop-blur-xl border border-white/10 lg:rounded-[2.5rem] lg:shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col lg:flex-row relative">

        {/* DESKTOP SPLIT BANNER */}
        <div className="hidden lg:flex w-5/12 p-16 flex-col justify-between relative overflow-hidden shrink-0" style={{ background: 'linear-gradient(135deg, #6b0a2e 0%, #3d1252 100%)' }}>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <img src={landscapeLogo} alt="Inakkam" className="h-14 w-auto" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4 leading-tight">{title}</h2>
            <p className="text-white/80 font-medium text-lg leading-relaxed">{sub}</p>
          </div>
          <div className="relative z-10 mt-20">
            <div className="flex gap-1.5 mb-6">
              {[...Array(totalFormSteps)].map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i + 1 <= formStep ? 'flex-1 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'flex-1 bg-black/20'}`} />
              ))}
            </div>
            <span className="text-white/70 font-black text-sm uppercase tracking-widest">Step {formStep} of {totalFormSteps}</span>
          </div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/15 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* MOBILE + FORM */}
        <div className="flex-1 flex flex-col relative h-full">

          {/* Mobile Header */}
          <div className="lg:hidden px-5 pt-6 pb-4">
            <div className="flex items-center justify-between mb-5">
              <button onClick={handleFormBack} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all cursor-pointer border border-white/10">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="flex items-center gap-2">
                <img src={landscapeLogo} alt="Inakkam" className="h-10 w-auto" />
              </div>
              <span className="text-xs font-black text-white/70 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">{formStep}/{totalFormSteps}</span>
            </div>
            {/* Progress bar */}
            <div className="flex gap-1 mb-6">
              {[...Array(totalFormSteps)].map((_, i) => (
                <motion.div key={i} className={`h-1 rounded-full transition-all duration-500 flex-1 ${i + 1 <= formStep ? 'bg-[#D51659] shadow-[0_0_5px_rgba(213,22,89,0.8)]' : 'bg-white/10'}`} />
              ))}
            </div>
            <h1 className="text-2xl font-black text-white mb-1.5 leading-tight">{title}</h1>
            <p className="text-sm font-medium text-white/70 leading-relaxed">{sub}</p>
          </div>

          {/* Form Content */}
          <div className="flex-1 px-5 lg:px-16 py-4 lg:py-16 overflow-y-auto no-scrollbar relative">
            <AnimatePresence mode="wait">
              <motion.div key={formStep} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.2 }} className="h-full pb-28">
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Floating Next */}
          {!(formStep === 2 && otpSent) && (
            <div className="absolute bottom-6 left-5 right-5 lg:bottom-12 lg:left-auto lg:right-12 z-40 flex items-center gap-3 lg:w-auto">
              <button onClick={handleFormBack} className="hidden lg:flex w-14 h-14 bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white rounded-full items-center justify-center shadow-md cursor-pointer border border-white/10">
                <ArrowLeft className="w-6 h-6" />
              </button>
              {/* Mobile: full-width button */}
              <button onClick={handleFormNext} className="lg:hidden flex-1 py-4 bg-[#D51659] hover:bg-[#b44ddc] active:scale-[0.98] transition-all text-white rounded-2xl font-black text-base shadow-xl shadow-[#D51659]/20 cursor-pointer flex items-center justify-center gap-2">
                {formStep === totalFormSteps ? "Complete Setup" : "Continue"}
                <ChevronRight className="w-5 h-5" />
              </button>
              {/* Desktop: circle button */}
              <button disabled={isSubmitting} onClick={handleFormNext} className="hidden lg:flex w-20 h-20 bg-[#D51659] hover:bg-[#b44ddc] active:scale-95 transition-all text-white rounded-full items-center justify-center shadow-2xl shadow-[#D51659]/20 cursor-pointer group disabled:opacity-50">
                {isSubmitting ? (
                  <Loader2 className="w-10 h-10 animate-spin" />
                ) : (
                  <ChevronRight className="w-10 h-10 group-hover:translate-x-1 transition-transform" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
