import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronRight, EyeOff, CheckCircle2, Plus, X, Search, Flame } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const [formStep, setFormStep] = useState(1);
  const totalFormSteps = 11;

  const [formData, setFormData] = useState({
    firstName: "Jorge", email: "jorge@gmail.com", password: "", bio: "Lover of adventure, books, and strong coffee.",
    phone: "", otp: "", birthday: "1994-05-15", gender: "Man", goals: "Dating", distance: 295,
    interests: ["Cooking", "Yoga", "Books", "Wine"], languages: ["English", "Hindi"],
    religion: "Hinduism", searchPreference: "Both",
    photos: ["https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=300", "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300"]
  });
  const [otpSent, setOtpSent] = useState(false);

  const handleFormNext = () => {
    if (formStep === 2 && !otpSent) { setOtpSent(true); return; }
    if (formStep < totalFormSteps) { setFormStep(formStep + 1); setOtpSent(false); }
    else { navigate('/swipe'); }
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
  const inputCls = "w-full px-5 py-4 text-base font-bold text-bumble-charcoal bg-white border-2 border-slate-100 rounded-2xl placeholder-slate-400 focus:border-bumble-yellow focus:ring-4 focus:ring-bumble-yellow/10 outline-none transition-all";
  const selectedCls = "border-bumble-yellow bg-bumble-yellow/10 shadow-sm";
  const unselectedCls = "border-slate-100 hover:border-slate-200 bg-white";
  const chipSelectedCls = "bg-bumble-charcoal border-bumble-charcoal text-white shadow-lg shadow-black/10";
  const chipUnselectedCls = "bg-white border-slate-200 text-slate-600 hover:border-slate-300";

  // --- Step Components (Redesigned) ---
  const Step1 = () => (
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

  const Step2 = () => (
    <div className="space-y-4">
      {!otpSent ? (
        <div className="flex border-2 border-slate-100 rounded-2xl overflow-hidden focus-within:border-bumble-yellow focus-within:ring-4 focus-within:ring-bumble-yellow/10">
          <div className="bg-slate-50 px-5 py-4 border-r-2 border-slate-100 flex items-center text-bumble-charcoal font-black text-base">+91</div>
          <input type="tel" placeholder="Mobile Number" value={formData.phone} onChange={e => updateData('phone', e.target.value)} className="w-full px-5 py-4 text-base font-bold outline-none text-bumble-charcoal placeholder-slate-400" />
        </div>
      ) : (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white p-6 lg:p-8 rounded-3xl border-2 border-slate-100 shadow-xl">
          <h2 className="text-2xl font-black text-bumble-charcoal mb-2">Awesome 🎉</h2>
          <p className="text-sm text-slate-500 font-medium mb-8">We sent an OTP to +91 {formData.phone}</p>
          <div className="flex gap-3 mb-8 justify-center lg:justify-start">
            {[1,2,3,4,5].map(i => (
              <input key={i} type="text" maxLength={1} className="w-12 h-14 lg:w-14 lg:h-16 border-2 border-slate-100 rounded-2xl text-center text-xl lg:text-2xl font-black focus:border-bumble-yellow focus:ring-4 focus:ring-bumble-yellow/10 outline-none bg-slate-50 text-bumble-charcoal" />
            ))}
          </div>
          <button onClick={() => setFormStep(3)} className="w-full py-4 bg-bumble-charcoal text-white rounded-2xl font-black text-base shadow-xl hover:bg-black active:scale-[0.98] transition-all cursor-pointer">Verify & Continue</button>
        </motion.div>
      )}
    </div>
  );

  const Step3 = () => (
    <div><input type="date" value={formData.birthday} onChange={e => updateData('birthday', e.target.value)} className={inputCls + " font-black"} /></div>
  );

  const Step4 = () => (
    <div className="space-y-3">
      {['Man', 'Woman', 'Other'].map(g => (
        <div key={g} onClick={() => updateData('gender', g)} className={`p-5 rounded-2xl border-2 flex justify-between items-center cursor-pointer transition-all ${formData.gender === g ? selectedCls : unselectedCls}`}>
          <span className="font-black text-base text-bumble-charcoal">{g}</span>
          {formData.gender === g && <CheckCircle2 className="w-6 h-6 text-bumble-yellow" />}
        </div>
      ))}
    </div>
  );

  const Step5 = () => {
    const goals = [
      { id: 'Dating', icon: '💑', desc: 'Genuine relationships and love.' },
      { id: 'Friendship', icon: '🤝', desc: 'Expand your social circle.' },
      { id: 'Casual', icon: '😉', desc: 'Fun and relaxed encounters.' },
      { id: 'Serious', icon: '💍', desc: 'Commitment and partnership.' },
      { id: 'Open', icon: '😎', desc: 'Open to various connections.' },
    ];
    return (
      <div className="space-y-3 pb-12">
        {goals.map(g => (
          <div key={g.id} onClick={() => updateData('goals', g.id)} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.goals === g.id ? selectedCls : unselectedCls}`}>
            <div className="flex items-center gap-3 mb-1"><span className="text-xl">{g.icon}</span><span className="font-black text-base text-bumble-charcoal">{g.id}</span></div>
            <p className="text-xs text-slate-500 font-medium ml-9">{g.desc}</p>
          </div>
        ))}
      </div>
    );
  };

  const Step6 = () => (
    <div className="pt-4">
      <div className="flex justify-between items-center mb-8">
        <span className="text-sm font-black text-slate-500 uppercase tracking-wider">Distance</span>
        <span className="text-xl font-black text-bumble-charcoal bg-bumble-yellow/20 px-5 py-2 rounded-full">{formData.distance} km</span>
      </div>
      <input type="range" min="1" max="500" value={formData.distance} onChange={e => updateData('distance', e.target.value)} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-bumble-yellow" />
    </div>
  );

  const Step7 = () => {
    const allInterests = [
      { id: 'Travel', icon: '✈️' }, { id: 'Cooking', icon: '🍳' }, { id: 'Hiking', icon: '⛰️' },
      { id: 'Yoga', icon: '🧘' }, { id: 'Gaming', icon: '🎮' }, { id: 'Movies', icon: '🎬' },
      { id: 'Books', icon: '📚' }, { id: 'Animals', icon: '🐾' }, { id: 'Wine', icon: '🍷' }
    ];
    return (
      <div>
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Search interests…" className={inputCls + " pl-12"} />
        </div>
        <div className="flex flex-wrap gap-3">
          {allInterests.map(i => {
            const sel = formData.interests.includes(i.id);
            return (
              <button key={i.id} onClick={() => toggleArrayItem('interests', i.id)} className={`px-5 py-3 rounded-full border-2 flex items-center gap-2 transition-all text-sm font-black cursor-pointer ${sel ? chipSelectedCls : chipUnselectedCls}`}>
                <span>{i.icon}</span><span>{i.id}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const Step8 = () => {
    const langs = [{ id: 'English', icon: '🇬🇧' }, { id: 'Gujarati', icon: '🇮🇳' }, { id: 'Hindi', icon: '🇮🇳' }, { id: 'Bengali', icon: '🇧🇩' }];
    return (
      <div>
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Search languages…" className={inputCls + " pl-12"} />
        </div>
        <div className="space-y-3">
          {langs.map(l => {
            const sel = formData.languages.includes(l.id);
            return (
              <div key={l.id} onClick={() => toggleArrayItem('languages', l.id)} className={`p-5 rounded-2xl border-2 flex justify-between items-center cursor-pointer transition-all ${sel ? selectedCls : unselectedCls}`}>
                <div className="flex items-center gap-4"><span className="text-2xl">{l.icon}</span><span className="font-black text-base text-bumble-charcoal">{l.id}</span></div>
                {sel && <CheckCircle2 className="w-6 h-6 text-bumble-yellow" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const Step9 = () => {
    const religions = ['Islam', 'Hinduism', 'Christianity', 'Buddhism', 'Judaism', 'Sikhism', 'Taoism', 'Jainism', 'Shintoism'];
    return (
      <div>
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Search…" className={inputCls + " pl-12"} />
        </div>
        <div className="flex flex-wrap gap-3">
          {religions.map(r => {
            const sel = formData.religion === r;
            return <button key={r} onClick={() => updateData('religion', r)} className={`px-5 py-3 rounded-full border-2 transition-all text-sm font-black cursor-pointer ${sel ? chipSelectedCls : chipUnselectedCls}`}>{r}</button>;
          })}
        </div>
      </div>
    );
  };

  const Step10 = () => (
    <div className="space-y-3">
      {['Man', 'Woman', 'Both'].map(p => (
        <div key={p} onClick={() => updateData('searchPreference', p)} className={`p-5 rounded-2xl border-2 flex justify-between items-center cursor-pointer transition-all ${formData.searchPreference === p ? selectedCls : unselectedCls}`}>
          <span className="font-black text-base text-bumble-charcoal">{p}</span>
          {formData.searchPreference === p && <CheckCircle2 className="w-6 h-6 text-bumble-yellow" />}
        </div>
      ))}
    </div>
  );

  const Step11 = () => (
    <div className="grid grid-cols-3 gap-3 lg:gap-5">
      {[0,1,2,3,4,5].map(i => (
        <div key={i} className="aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 relative overflow-hidden flex items-center justify-center cursor-pointer hover:bg-bumble-yellow/5 hover:border-bumble-yellow/30 transition-all group">
          {formData.photos[i] ? (
            <>
              <img src={formData.photos[i]} alt="Upload" className="w-full h-full object-cover" />
              <button className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md text-slate-500 hover:text-rose-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-10 h-10 rounded-full border-2 border-slate-300 text-slate-400 flex items-center justify-center group-hover:border-bumble-yellow group-hover:text-bumble-yellow transition-colors bg-white shadow-sm">
              <Plus className="w-5 h-5" />
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const stepsMap = { 1: <Step1 />, 2: <Step2 />, 3: <Step3 />, 4: <Step4 />, 5: <Step5 />, 6: <Step6 />, 7: <Step7 />, 8: <Step8 />, 9: <Step9 />, 10: <Step10 />, 11: <Step11 /> };

  return (
    <div className="min-h-screen bg-bumble-yellow/5 flex items-center justify-center lg:p-10">
      <div className="w-full h-screen lg:h-auto lg:max-w-5xl bg-white lg:rounded-[2.5rem] lg:shadow-2xl overflow-hidden flex flex-col lg:flex-row relative">

        {/* DESKTOP SPLIT BANNER */}
        <div className="hidden lg:flex w-5/12 bg-bumble-yellow p-16 flex-col justify-between relative overflow-hidden shrink-0">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-bumble-charcoal flex items-center justify-center"><Flame className="w-5 h-5 text-bumble-yellow" /></div>
              <span className="font-black text-lg text-bumble-charcoal">Inakkam</span>
            </div>
            <h2 className="text-4xl font-black text-bumble-charcoal mb-4 leading-tight">{title}</h2>
            <p className="text-bumble-charcoal/70 font-medium text-lg leading-relaxed">{sub}</p>
          </div>
          <div className="relative z-10 mt-20">
            <div className="flex gap-1.5 mb-6">
              {[...Array(totalFormSteps)].map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i + 1 <= formStep ? 'flex-1 bg-bumble-charcoal' : 'flex-1 bg-bumble-charcoal/15'}`} />
              ))}
            </div>
            <span className="text-bumble-charcoal/70 font-black text-sm uppercase tracking-widest">Step {formStep} of {totalFormSteps}</span>
          </div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/15 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* MOBILE + FORM */}
        <div className="flex-1 flex flex-col relative h-full">

          {/* Mobile Header */}
          <div className="lg:hidden px-5 pt-6 pb-4">
            <div className="flex items-center justify-between mb-5">
              <button onClick={handleFormBack} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all cursor-pointer">
                <ArrowLeft className="w-5 h-5 text-bumble-charcoal" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-bumble-charcoal flex items-center justify-center"><Flame className="w-4 h-4 text-bumble-yellow" /></div>
                <span className="font-black text-sm text-bumble-charcoal">Inakkam</span>
              </div>
              <span className="text-xs font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">{formStep}/{totalFormSteps}</span>
            </div>
            {/* Progress bar */}
            <div className="flex gap-1 mb-6">
              {[...Array(totalFormSteps)].map((_, i) => (
                <motion.div key={i} className={`h-1 rounded-full transition-all duration-500 flex-1 ${i + 1 <= formStep ? 'bg-bumble-yellow' : 'bg-slate-200'}`} />
              ))}
            </div>
            <h1 className="text-2xl font-black text-bumble-charcoal mb-1.5 leading-tight">{title}</h1>
            <p className="text-sm font-medium text-slate-500 leading-relaxed">{sub}</p>
          </div>

          {/* Form Content */}
          <div className="flex-1 px-5 lg:px-16 py-4 lg:py-16 overflow-y-auto no-scrollbar relative">
            <AnimatePresence mode="wait">
              <motion.div key={formStep} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.2 }} className="h-full pb-28">
                {stepsMap[formStep]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Floating Next */}
          {!(formStep === 2 && otpSent) && (
            <div className="absolute bottom-6 left-5 right-5 lg:bottom-12 lg:left-auto lg:right-12 z-40 flex items-center gap-3 lg:w-auto">
              <button onClick={handleFormBack} className="hidden lg:flex w-14 h-14 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all text-slate-500 rounded-full items-center justify-center shadow-md cursor-pointer">
                <ArrowLeft className="w-6 h-6" />
              </button>
              {/* Mobile: full-width button */}
              <button onClick={handleFormNext} className="lg:hidden flex-1 py-4 bg-bumble-charcoal hover:bg-black active:scale-[0.98] transition-all text-white rounded-2xl font-black text-base shadow-xl shadow-black/15 cursor-pointer flex items-center justify-center gap-2">
                {formStep === totalFormSteps ? "Complete Setup" : "Continue"}
                <ChevronRight className="w-5 h-5" />
              </button>
              {/* Desktop: circle button */}
              <button onClick={handleFormNext} className="hidden lg:flex w-20 h-20 bg-bumble-charcoal hover:bg-black active:scale-95 transition-all text-white rounded-full items-center justify-center shadow-2xl shadow-black/20 cursor-pointer group">
                <ChevronRight className="w-10 h-10 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
