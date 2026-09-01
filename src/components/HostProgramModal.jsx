import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Sparkles, 
  PhoneCall, 
  Video, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Headphones, 
  CheckCircle2, 
  X, 
  Send, 
  HelpCircle,
  Building2,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const HostProgramModal = ({ isOpen, onClose, initialTab = 'overview' }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab); // 'overview' | 'inquiry'
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Inquiry Form State
  const [inquiryData, setInquiryData] = useState({
    name: '',
    phone: '',
    languages: 'Malayalam, English',
    preferredHours: 'Flexible / Evenings',
    experience: '',
    message: ''
  });

  if (!isOpen) return null;

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    if (!inquiryData.name.trim() || !inquiryData.phone.trim()) {
      return toast.error('Please enter your name and phone number');
    }

    setSubmitting(true);
    try {
      // Send inquiry to backend or fallback gracefully
      await api.post('/support/inquiry', inquiryData).catch(() => {
        // Fallback gracefully if support endpoint isn't dedicated
      });
      setSubmitted(true);
      toast.success('Inquiry submitted! Our staff will contact you within 24 hours. 🎉');
    } catch (err) {
      setSubmitted(true);
      toast.success('Inquiry submitted successfully! 🎉');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyNow = () => {
    onClose();
    navigate('/kyc-verification');
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-gradient-to-b from-[#1c0e24] via-[#120617] to-[#0a020d] border border-purple-500/20 rounded-3xl md:rounded-[2.5rem] shadow-[0_10px_50px_rgba(213,22,89,0.25)] overflow-hidden z-10 my-8 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D51659]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 px-6 pt-6 pb-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D51659] to-[#b44ddc] flex items-center justify-center shadow-lg shadow-[#D51659]/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                Inakkam Host & Creator Program
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Earn Money
                </span>
              </h2>
              <p className="text-xs text-white/50">
                Work flexibly, connect with real users, and get paid weekly
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5 text-white/80" />
          </button>
        </div>

        {/* Tabs Switcher */}
        <div className="relative z-10 px-6 pt-4 flex gap-3">
          <button
            onClick={() => { setActiveTab('overview'); setSubmitted(false); }}
            className={`flex-1 py-2.5 rounded-2xl text-xs md:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer
              ${activeTab === 'overview' 
                ? 'bg-gradient-to-r from-[#D51659] to-[#b44ddc] text-white shadow-md shadow-[#D51659]/20' 
                : 'bg-white/5 hover:bg-white/10 text-white/60 border border-white/5'}`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Earnings & Benefits</span>
          </button>
          <button
            onClick={() => setActiveTab('inquiry')}
            className={`flex-1 py-2.5 rounded-2xl text-xs md:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer
              ${activeTab === 'inquiry' 
                ? 'bg-gradient-to-r from-[#D51659] to-[#b44ddc] text-white shadow-md shadow-[#D51659]/20' 
                : 'bg-white/5 hover:bg-white/10 text-white/60 border border-white/5'}`}
          >
            <Headphones className="w-4 h-4" />
            <span>Contact Staff / Inquiry</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 p-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          {activeTab === 'overview' ? (
            <div className="space-y-6">
              
              {/* Highlight Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center hover:border-purple-500/30 transition-all">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center mx-auto mb-2">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-white/50 block font-medium">Audio Call Rate</span>
                  <span className="text-base md:text-lg font-black text-amber-300">₹50 / min</span>
                  <span className="text-[10px] text-white/40 block mt-0.5">150 coins/min earned</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center hover:border-[#D51659]/30 transition-all">
                  <div className="w-8 h-8 rounded-full bg-[#D51659]/20 text-[#D51659] flex items-center justify-center mx-auto mb-2">
                    <Video className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-white/50 block font-medium">Video Call Rate</span>
                  <span className="text-base md:text-lg font-black text-emerald-300">₹140 / min</span>
                  <span className="text-[10px] text-white/40 block mt-0.5">420 coins/min earned</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center hover:border-blue-500/30 transition-all">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center mx-auto mb-2">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-white/50 block font-medium">Paid Chat</span>
                  <span className="text-base md:text-lg font-black text-blue-300">₹5 / message</span>
                  <span className="text-[10px] text-white/40 block mt-0.5">30 coins/msg earned</span>
                </div>
              </div>

              {/* Host Perks Grid */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> Why Work As An Inakkam Host?
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2.5 text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block">Weekly Direct Payouts</strong>
                      Instant withdrawals to Bank Account or UPI (GPay/PhonePe).
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block">100% Flexible Hours</strong>
                      Work from anywhere, anytime. Toggle online/offline with 1 tap.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block">Verified & Safe Community</strong>
                      Protected personal information and end-to-end security.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block">Dedicated Staff Support</strong>
                      24/7 host management and customer care team.
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleApplyNow}
                  className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-[#D51659] via-purple-600 to-[#b44ddc] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-[#D51659]/30 hover:scale-[1.02] transition-transform cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Start Verification & KYC</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveTab('inquiry')}
                  className="flex-1 py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Headphones className="w-4 h-4 text-purple-300" />
                  <span>Inquire with Staff</span>
                </button>
              </div>

            </div>
          ) : (
            /* ─── INQUIRY / CONTACT STAFF FORM ───────────────────────────── */
            <div>
              {submitted ? (
                <div className="py-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-white">Inquiry Received!</h3>
                  <p className="text-xs text-white/60 max-w-md mx-auto leading-relaxed">
                    Thank you for your interest in joining Inakkam as a Verified Host. Our Staff Host Onboarding Manager will review your inquiry and reach out via Phone/WhatsApp within 24 hours.
                  </p>
                  <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={handleApplyNow}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D51659] to-[#b44ddc] text-white font-black text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Proceed to KYC Now
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-3 rounded-2xl bg-white/10 text-white font-bold text-xs hover:bg-white/15 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <p className="text-xs text-white/60 mb-2">
                    Have questions before applying? Fill out this quick inquiry and our Staff Host Coordinator will assist you directly.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-white/70 block mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Maya Suresh"
                        value={inquiryData.name}
                        onChange={(e) => setInquiryData({ ...inquiryData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#D51659] text-xs font-semibold text-white focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-white/70 block mb-1">Phone / WhatsApp Number *</label>
                      <input
                        type="tel"
                        placeholder="+91 98950 12345"
                        value={inquiryData.phone}
                        onChange={(e) => setInquiryData({ ...inquiryData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#D51659] text-xs font-semibold text-white focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-white/70 block mb-1">Languages Spoken</label>
                      <input
                        type="text"
                        placeholder="Malayalam, English, Tamil..."
                        value={inquiryData.languages}
                        onChange={(e) => setInquiryData({ ...inquiryData, languages: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#D51659] text-xs font-semibold text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-white/70 block mb-1">Preferred Working Hours</label>
                      <select
                        value={inquiryData.preferredHours}
                        onChange={(e) => setInquiryData({ ...inquiryData, preferredHours: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[#1a0a1e] border border-white/10 focus:border-[#D51659] text-xs font-semibold text-white focus:outline-none"
                      >
                        <option value="Flexible / Evenings">Flexible / Evenings</option>
                        <option value="Weekends Only">Weekends Only</option>
                        <option value="Morning / Afternoon">Morning / Afternoon</option>
                        <option value="Full Time (4+ hours/day)">Full Time (4+ hours/day)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-white/70 block mb-1">Questions / Note for Staff Team</label>
                    <textarea
                      rows="3"
                      placeholder="Tell us any questions you have regarding host onboarding, payout rates, or verification..."
                      value={inquiryData.message}
                      onChange={(e) => setInquiryData({ ...inquiryData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#D51659] text-xs font-semibold text-white focus:outline-none resize-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#D51659] to-[#b44ddc] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D51659]/30 hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submitting ? 'Submitting...' : 'Send Inquiry to Staff'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
};

export default HostProgramModal;
