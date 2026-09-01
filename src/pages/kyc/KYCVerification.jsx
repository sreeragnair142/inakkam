import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck, Loader2, ArrowLeft, Headphones } from 'lucide-react';
import { submitVerification, resetSubmitSuccess } from '../../redux/slices/verificationSlice';
import { updateProfile } from '../../redux/slices/authSlice';
import HostProgramModal from '../../components/HostProgramModal';
import Step1Personal from './Step1Personal';
import Step2Aadhaar from './Step2Aadhaar';
import Step3PAN from './Step3PAN';
import Step4Facial from './Step4Facial';
import Step5Payment from './Step5Payment';

// ─── Step config ──────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Personal Info',  short: 'Personal' },
  { id: 2, label: 'Aadhaar',        short: 'Aadhaar' },
  { id: 3, label: 'PAN Card',       short: 'PAN' },
  { id: 4, label: 'Face Verify',    short: 'Face' },
  { id: 5, label: 'Payment',        short: 'Payment' },
];

// ─── Initial state ────────────────────────────────────────
const initPersonal = { fullName:'', dateOfBirth:'', gender:'', phone:'', email:'', address:'', city:'', state:'', pincode:'', occupation:'' };
const initAadhaar  = { aadhaarFront:null, aadhaarFrontPreview:null, aadhaarBack:null, aadhaarBackPreview:null };
const initPAN      = { panCard:null, panCardPreview:null };
const initFacial   = { selfieImage:null };
const initPayment  = { paymentMethod:'', accountHolderName:'', bankName:'', accountNumber:'', confirmAccountNumber:'', ifscCode:'', upiId:'' };

// ─── Validate each step ───────────────────────────────────
const validate = (step, data) => {
  switch(step) {
    case 1: {
      const { fullName, dateOfBirth, gender, phone, email, address, city, state, pincode, occupation } = data;
      return [fullName, dateOfBirth, gender, phone, email, address, city, state, pincode, occupation].every(v => v?.trim());
    }
    case 2: return !!(data.aadhaarFront && data.aadhaarBack);
    case 3: return !!data.panCard;
    case 4: return !!data.selfieImage;
    case 5: {
      if (!data.paymentMethod) return false;
      if (data.paymentMethod === 'upi') return !!data.upiId?.trim();
      return !!(data.accountHolderName?.trim() && data.bankName?.trim() &&
        data.accountNumber?.trim() && data.confirmAccountNumber?.trim() &&
        data.ifscCode?.trim() && data.accountNumber === data.confirmAccountNumber);
    }
    default: return false;
  }
};

// ─── Success Screen ───────────────────────────────────────
const SuccessScreen = ({ onDashboard }) => (
  <div className="min-h-screen flex items-center justify-center p-6"
    style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #1a0a15 40%, #0d0515 100%)' }}>
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4 }}
      className="max-w-md w-full text-center bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-10 shadow-2xl">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
        <CheckCircle2 className="w-12 h-12 text-green-400" />
      </div>
      <h2 className="text-2xl font-black text-white mb-3">Verification Request Submitted</h2>
      <p className="text-white/50 text-sm leading-relaxed mb-6">
        Thank you for submitting your verification request. Our team will review your documents and verification details. You will be notified once verification is completed.
      </p>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-8">
        <p className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">Estimated Review Time</p>
        <p className="text-2xl font-black text-white">24 – 48 Hours</p>
      </div>
      <button onClick={onDashboard}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D51659] to-[#b44ddc] text-white font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer shadow-[0_4px_20px_rgba(213,22,89,0.3)]">
        Back to Dashboard
      </button>
    </motion.div>
  </div>
);

// ─── Main KYC Page ────────────────────────────────────────
const KYCVerification = () => {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { submitting, error, submitSuccess } = useSelector(s => s.verification);
  const authUser  = useSelector(s => s.auth.user);

  const [step, setStep]       = useState(1);
  const [confirmed, setConf]  = useState(false);
  const [showHostModal, setShowHostModal] = useState(false);
  const [personal, setPersonal] = useState({ ...initPersonal, email: authUser?.email || '', phone: authUser?.phone || '', fullName: authUser?.name || '' });
  const [aadhaar,  setAadhaar]  = useState(initAadhaar);
  const [pan,      setPan]      = useState(initPAN);
  const [facial,   setFacial]   = useState(initFacial);
  const [payment,  setPayment]  = useState(initPayment);

  useEffect(() => {
    if (submitSuccess) {
      dispatch(updateProfile({ verificationStatus: 'PENDING_VERIFICATION' }));
    }
  }, [submitSuccess, dispatch]);

  const canProceed = validate(step, step === 1 ? personal : step === 2 ? aadhaar : step === 3 ? pan : step === 4 ? facial : payment);
  const allStepsOk = [1,2,3,4,5].every(s => validate(s, s===1?personal:s===2?aadhaar:s===3?pan:s===4?facial:payment));

  const handleNext = () => { if (canProceed && step < 5) setStep(s => s + 1); };
  const handleBack = () => { if (step > 1) setStep(s => s - 1); };

  const handleSubmit = async () => {
    if (!confirmed || !allStepsOk || submitting) return;
    const fd = new FormData();
    // Step 1
    Object.entries(personal).forEach(([k, v]) => fd.append(k, v));
    // Step 2
    if (aadhaar.aadhaarFront) fd.append('aadhaarFront', aadhaar.aadhaarFront);
    if (aadhaar.aadhaarBack)  fd.append('aadhaarBack',  aadhaar.aadhaarBack);
    // Step 3
    if (pan.panCard) fd.append('panCard', pan.panCard);
    // Step 4 – selfie as base64
    if (facial.selfieImage) fd.append('selfieImage', facial.selfieImage);
    // Step 5
    fd.append('paymentMethod', payment.paymentMethod);
    if (payment.paymentMethod === 'bank') {
      ['accountHolderName','bankName','accountNumber','ifscCode'].forEach(k => fd.append(k, payment[k] || ''));
    } else {
      fd.append('upiId', payment.upiId || '');
    }
    dispatch(submitVerification(fd));
  };

  if (submitSuccess) {
    return <SuccessScreen onDashboard={() => { dispatch(resetSubmitSuccess()); navigate('/swipe'); }} />;
  }

  const progress = (step / 5) * 100;

  const getStepInfo = () => {
    switch (step) {
      case 1: return { title: 'Personal Information', sub: 'Provide your basic personal details as per your official documents.', icon: '📋' };
      case 2: return { title: 'Aadhaar Verification', sub: 'Upload clear images of both sides of your Aadhaar card.', icon: '🪪' };
      case 3: return { title: 'PAN Verification', sub: 'Upload a clear image of your PAN card.', icon: '💳' };
      case 4: return { title: 'Facial Verification', sub: 'Take a live selfie to verify your identity.', icon: '🤳' };
      case 5: return { title: 'Payment Details', sub: 'Add your payment details to receive earnings from chat.', icon: '🏦' };
      default: return { title: '', sub: '', icon: '' };
    }
  };

  const { title, sub, icon } = getStepInfo();

  return (
    <div className="h-[100dvh] w-full overflow-hidden flex items-center justify-center lg:p-10" style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #1a0a15 20%, #15061a 45%, #0d0515 70%, #0A0A0A 100%)' }}>
      <div className="w-full h-full lg:h-[85vh] lg:max-h-[850px] lg:max-w-5xl bg-black/30 backdrop-blur-xl border border-white/10 lg:rounded-[2.5rem] lg:shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col lg:flex-row relative">

        {/* DESKTOP SPLIT BANNER */}
        <div className="hidden lg:flex w-5/12 p-14 flex-col justify-between relative overflow-hidden shrink-0" style={{ background: 'linear-gradient(135deg, #4c0e35 0%, #1a0a2e 100%)' }}>
          <div className="relative z-10">
            <button onClick={() => navigate(-1)} className="w-10 h-10 mb-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white mb-8">
              <ShieldCheck className="w-4 h-4 text-purple-400" /> KYC Verification
            </div>
            <h2 className="text-4xl font-black text-white mb-4 leading-tight">{title}</h2>
            <p className="text-white/70 font-medium text-lg leading-relaxed">{sub}</p>
          </div>
          
          <div className="relative z-10 mt-12">
            <div className="space-y-4">
              {STEPS.map(s => {
                const isPast = s.id < step;
                const isCurrent = s.id === step;
                return (
                  <div key={s.id} className={`flex items-center gap-4 transition-all duration-300 ${isCurrent ? 'opacity-100 translate-x-2' : isPast ? 'opacity-60' : 'opacity-30'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${isCurrent ? 'border-[#D51659] bg-[#D51659]/20 text-[#D51659]' : isPast ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-white/20 text-white'}`}>
                      {isPast ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-black">{s.id}</span>}
                    </div>
                    <span className={`font-bold ${isCurrent ? 'text-white text-lg' : 'text-white text-sm'}`}>{s.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Staff Assistance Helper */}
            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-white/50">Need help or have questions?</span>
              <button 
                type="button"
                onClick={() => setShowHostModal(true)} 
                className="text-xs text-amber-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Headphones className="w-3.5 h-3.5" /> Inquire with Staff
              </button>
            </div>
          </div>
          
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#D51659]/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
        </div>

        {/* MOBILE + FORM CONTAINER */}
        <div className="flex-1 flex flex-col relative h-full bg-black/20 backdrop-blur-md">
          
          {/* Mobile Header */}
          <div className="lg:hidden px-5 pt-6 pb-4 border-b border-white/5 bg-black/40">
            <div className="flex items-center gap-4 mb-4">
              <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all cursor-pointer border border-white/10">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <h1 className="text-sm font-black text-white flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-purple-400" /> KYC Verification</h1>
                  <span className="text-xs text-white/40 font-bold">{step}/5</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #D51659, #b44ddc)' }} animate={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {STEPS.map(s => {
                const isPast = s.id < step;
                const isCurrent = s.id === step;
                return (
                  <div key={s.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0
                    ${isCurrent ? 'bg-gradient-to-r from-[#D51659]/20 to-[#b44ddc]/20 border-purple-500/40 text-white' : isPast ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-white/5 border-white/10 text-white/30'}`}>
                    {isPast ? <CheckCircle2 className="w-3 h-3" /> : <span>{s.id}</span>}
                    <span>{s.short}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Scroll Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-5 lg:px-12 py-6 lg:py-10 relative">
            <div className="lg:hidden mb-6">
              <h2 className="text-2xl font-black text-white mb-2">{icon} {title}</h2>
              <p className="text-sm text-white/60 font-medium">{sub}</p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="pb-10">
                {step === 1 && <Step1Personal data={personal} onChange={setPersonal} />}
                {step === 2 && <Step2Aadhaar data={aadhaar}  onChange={setAadhaar} />}
                {step === 3 && <Step3PAN     data={pan}      onChange={setPan} />}
                {step === 4 && <Step4Facial  data={facial}   onChange={setFacial} />}
                {step === 5 && <Step5Payment data={payment}  onChange={setPayment} />}

                {step === 5 && (
                  <div className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Final Review</p>
                    <div className="space-y-3 mb-6">
                      {[
                        { label: 'Personal Details', ok: validate(1, personal) },
                        { label: 'Aadhaar Uploaded', ok: validate(2, aadhaar) },
                        { label: 'PAN Uploaded', ok: validate(3, pan) },
                        { label: 'Facial Verification', ok: validate(4, facial) },
                        { label: 'Payment Details', ok: validate(5, payment) },
                      ].map(({ label, ok }) => (
                        <div key={label} className={`flex items-center gap-3 text-sm font-bold ${ok ? 'text-green-400' : 'text-red-400'}`}>
                          <CheckCircle2 className="w-4 h-4 shrink-0" /> {label}
                        </div>
                      ))}
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div onClick={() => setConf(c => !c)} className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${confirmed ? 'bg-[#D51659] border-[#D51659]' : 'border-white/20 group-hover:border-white/40'}`}>
                        {confirmed && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-white/70 leading-relaxed font-medium">I confirm that all information provided is accurate and documents are genuine.</span>
                    </label>
                    {error && <p className="text-xs text-red-400 font-bold mt-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error?.message || 'Submission failed. Please try again.'}</p>}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Fixed Footer Buttons */}
          <div className="shrink-0 p-5 lg:p-8 bg-black/60 backdrop-blur-xl border-t border-white/5">
            <div className="flex items-center gap-4">
              {step > 1 && (
                <button onClick={handleBack} className="hidden lg:flex w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-white items-center justify-center hover:bg-white/10 transition-colors cursor-pointer shrink-0">
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              {step > 1 && (
                <button onClick={handleBack} className="lg:hidden flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-colors cursor-pointer text-center">
                  Back
                </button>
              )}
              
              {step < 5 ? (
                <button onClick={handleNext} disabled={!canProceed}
                  className={`flex-[2] lg:flex-1 py-4 rounded-2xl text-sm lg:text-base font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl
                    ${canProceed ? 'bg-[#D51659] text-white hover:bg-[#b44ddc] shadow-[#D51659]/20' : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'}`}>
                  Continue <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={!allStepsOk || !confirmed || submitting}
                  className={`flex-[2] lg:flex-1 py-4 rounded-2xl text-sm lg:text-base font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl
                    ${allStepsOk && confirmed && !submitting ? 'bg-gradient-to-r from-[#D51659] to-[#b44ddc] text-white hover:opacity-90 shadow-[#D51659]/30' : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'}`}>
                  {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : <><ShieldCheck className="w-5 h-5" /> Submit Application</>}
                </button>
              )}
            </div>

            {/* Mobile Inquire Helper */}
            <div className="lg:hidden mt-3 text-center">
              <button 
                type="button"
                onClick={() => setShowHostModal(true)} 
                className="text-[11px] text-white/50 hover:text-amber-300 transition-colors font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Headphones className="w-3 h-3 text-amber-300" /> Have questions? Inquire with our staff team
              </button>
            </div>
          </div>
          
        </div>
      </div>

      {/* Host Program Inquiry Modal */}
      <HostProgramModal
        isOpen={showHostModal}
        onClose={() => setShowHostModal(false)}
        initialTab="inquiry"
      />
    </div>
  );
};

export default KYCVerification;
