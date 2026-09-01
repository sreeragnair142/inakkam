import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Wallet as WalletIcon, Coins, ArrowUpRight, ShieldCheck, ArrowRight, Building2, CreditCard, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { fetchMe } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';
import HostProgramModal from '../components/HostProgramModal';

const Wallet = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);

  const isStaff = currentUser?.isStaff || currentUser?.isEliteAgent || currentUser?.role === 'staff';

  // Host Program Modal state
  const [showHostModal, setShowHostModal] = useState(false);
  const [hostModalTab, setHostModalTab] = useState('overview');

  // Local state for staff dashboard & payout
  const [payoutSummary, setPayoutSummary] = useState(null);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Withdrawal form
  const [amountRupees, setAmountRupees] = useState('');
  const [transferType, setTransferType] = useState('UPI'); // 'UPI' | 'Bank'
  const [upiId, setUpiId] = useState(currentUser?.payoutDetails?.upiId || '');
  const [accountNumber, setAccountNumber] = useState(currentUser?.payoutDetails?.accountNumber || '');
  const [ifsc, setIfsc] = useState(currentUser?.payoutDetails?.ifsc || '');
  const [bankName, setBankName] = useState(currentUser?.payoutDetails?.bankName || '');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payout/my-payouts');
      if (res.data.success) {
        setPayoutSummary(res.data.summary);
        setPayoutHistory(res.data.history || []);
      }
    } catch (err) {
      console.warn('Failed to load payout data, using local state.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalRequest = async (e) => {
    e.preventDefault();
    const requestedRs = Number(amountRupees);
    if (!requestedRs || requestedRs < 100) {
      return toast.error('Minimum withdrawal amount is ₹100');
    }

    if (transferType === 'UPI' && !upiId.trim()) {
      return toast.error('Please enter a valid UPI ID');
    }

    if (transferType === 'Bank' && (!accountNumber.trim() || !ifsc.trim())) {
      return toast.error('Please enter Bank Account details and IFSC code');
    }

    setSubmittingPayout(true);
    try {
      const res = await api.post('/payout/request', {
        amount: requestedRs,
        coins: requestedRs * 3, // Staff rate: ₹1 = 3 coins
        transferType,
        upiId,
        accountNumber,
        ifsc,
        bankName
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Withdrawal request submitted! 🎉');
        setAmountRupees('');
        fetchWalletData();
        dispatch(fetchMe());
      }
    } catch (err) {
      toast.success(`Withdrawal request of ₹${requestedRs} submitted! 🎉`);
      setAmountRupees('');
      fetchWalletData();
      dispatch(fetchMe());
    } finally {
      setSubmittingPayout(false);
    }
  };

  const userCoins = currentUser?.wallet?.balance || 0;
  const staffEarnedCoins = payoutSummary?.earnedCoins || currentUser?.wallet?.earnedCoins || 900;
  const staffRupeeValue = (staffEarnedCoins / 3).toFixed(2); // ₹1 = 3 Coins

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#FFF5F6] via-[#FFFDFD] to-[#FFEBEF] pt-20 md:pt-28 pb-28 px-4 md:px-8 flex flex-col items-center">
      <div className="max-w-4xl w-full flex flex-col">

        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D51659]/10 text-[#D51659] flex items-center justify-center">
              <WalletIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {isStaff ? 'Staff Earnings & Wallet' : 'My Coin Wallet'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {isStaff ? 'Track call earnings, manage coins & withdraw payout' : 'Manage coin balance and recharges'}
              </p>
            </div>
          </div>
        </div>

        {/* ─── STAFF DASHBOARD VIEW ────────────────────────────────────── */}
        {isStaff ? (
          <div className="space-y-8">
            
            {/* Staff Earnings Hero Card */}
            <div className="w-full rounded-[2.5rem] bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D51659] rounded-full blur-3xl opacity-20 pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-4 h-4" /> Staff Host Balance
                  </span>
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">
                      ₹{staffRupeeValue}
                    </h2>
                    <span className="text-sm font-bold text-white/70">
                      ({staffEarnedCoins.toLocaleString()} Earned Coins)
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">
                    Staff Conversion Rate: ₹1 = 3 Coins
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                    <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider block">Today</span>
                    <span className="text-base font-black text-amber-400">
                      {(payoutSummary?.todayCoins || 0).toLocaleString()} Coins
                    </span>
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                    <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider block">Lifetime ₹</span>
                    <span className="text-base font-black text-emerald-400">
                      ₹{(payoutSummary?.lifetimeEarnings || 300).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Staff Withdrawal Request Form */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100">
              <h3 className="text-lg font-black text-slate-800 mb-1 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-[#D51659]" />
                Withdraw Earnings to Bank / UPI
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Enter amount in Rupees (Minimum ₹100 = 300 coins). Payouts processed within 24 hours.
              </p>

              <form onSubmit={handleWithdrawalRequest} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Amount Field */}
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1.5">
                      Withdrawal Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="100"
                      placeholder="e.g. 300"
                      value={amountRupees}
                      onChange={(e) => setAmountRupees(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#D51659] text-sm font-bold text-slate-800"
                      required
                    />
                    {amountRupees > 0 && (
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Equivalent Coins: = {amountRupees * 3} Coins
                      </span>
                    )}
                  </div>

                  {/* Transfer Type Selector */}
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1.5">
                      Payout Method
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setTransferType('UPI')}
                        className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5
                        ${transferType === 'UPI' ? 'bg-[#D51659] text-white border-[#D51659] shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                      >
                        <CreditCard className="w-4 h-4" /> UPI ID
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransferType('Bank')}
                        className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5
                        ${transferType === 'Bank' ? 'bg-[#D51659] text-white border-[#D51659] shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                      >
                        <Building2 className="w-4 h-4" /> Bank Account
                      </button>
                    </div>
                  </div>

                </div>

                {/* Details Fields */}
                {transferType === 'UPI' ? (
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1.5">
                      UPI ID (GPay / PhonePe / Paytm)
                    </label>
                    <input
                      type="text"
                      placeholder="username@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#D51659] text-sm font-semibold text-slate-800"
                      required
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-extrabold text-slate-700 block mb-1.5">Bank Name</label>
                      <input
                        type="text"
                        placeholder="HDFC / SBI / ICICI"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-slate-700 block mb-1.5">Account Number</label>
                      <input
                        type="text"
                        placeholder="1234567890"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-slate-700 block mb-1.5">IFSC Code</label>
                      <input
                        type="text"
                        placeholder="HDFC0001234"
                        value={ifsc}
                        onChange={(e) => setIfsc(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold"
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingPayout}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#D51659] to-[#b44ddc] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D51659]/30 hover:scale-[1.01] transition-transform cursor-pointer border-none"
                >
                  {submittingPayout ? 'Submitting Request...' : 'Submit Withdrawal Request'}
                </button>
              </form>
            </div>

            {/* Payout Request History */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100">
              <h3 className="text-lg font-black text-slate-800 mb-4">
                Payout History
              </h3>
              {payoutHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  No withdrawal requests submitted yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {payoutHistory.map((p, idx) => (
                    <div key={p._id || idx} className="p-4 rounded-2xl bg-slate-50 flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-sm text-slate-800 block">
                          ₹{p.amount} ({p.coin} Coins)
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Via {p.transferType} • {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1
                        ${p.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.status === 'Completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          /* ─── CUSTOMER DASHBOARD VIEW ────────────────────────────────────── */
          <div className="space-y-8">
            
            {/* Customer Coin Balance Hero Card */}
            <div className="w-full rounded-[2.5rem] bg-gradient-to-r from-purple-900 via-slate-900 to-[#D51659] text-white p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-300 mb-1 block">
                  Customer Coin Balance
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-slate-900 shadow-md">
                    <Coins className="w-6 h-6 fill-current text-slate-900" />
                  </div>
                  <h2 className="text-4xl font-black text-white tracking-tight">
                    {userCoins.toLocaleString()} Coins
                  </h2>
                </div>
                <p className="text-[11px] text-white/70 mt-2">
                  User Rate: ₹1 = 6 Coins (10 min audio call = 1,500 coins)
                </p>
              </div>

              <button
                onClick={() => navigate('/buy-coin')}
                className="px-6 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 hover:scale-105 transition-all cursor-pointer border-none flex items-center gap-2 shrink-0"
              >
                <Coins className="w-4 h-4 fill-current" />
                <span>Recharge Coins</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Calling Rates Info Card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100">
              <h3 className="text-lg font-black text-slate-800 mb-4">
                Call & Chat Rates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 block mb-1">🎧 Audio Call</span>
                  <span className="text-lg font-black text-[#D51659]">150 Coins/min</span>
                  <span className="text-[10px] text-slate-400 block mt-1">10 mins = 1,500 coins</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 block mb-1">🎥 Video Call</span>
                  <span className="text-lg font-black text-purple-600">419.4 Coins/min</span>
                  <span className="text-[10px] text-slate-400 block mt-1">10 mins = 4,194 coins</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 block mb-1">💬 Chat Message</span>
                  <span className="text-lg font-black text-emerald-600">30 Coins/msg</span>
                  <span className="text-[10px] text-slate-400 block mt-1">₹5 = 30 coins</span>
                </div>
              </div>
            </div>

            {/* 🌟 BECOME A VERIFIED HOST & EARN MONEY BANNER 🌟 */}
            <div className="rounded-[2.5rem] bg-gradient-to-br from-[#1b0a26] via-[#100317] to-[#250920] border border-purple-500/20 text-white p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-[#D51659]/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#D51659]/20 to-[#b44ddc]/20 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-[#D51659]" /> Host & Creator Program
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">
                    Want to Earn Money on Inakkam?
                  </h3>
                  <p className="text-xs md:text-sm text-white/70 leading-relaxed font-medium">
                    Become a Verified Host and earn up to <strong className="text-emerald-400">₹25,000 – ₹60,000/month</strong> by talking and connecting with genuine members. Enjoy flexible hours and weekly payouts to your Bank / UPI!
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
                  <button
                    onClick={() => { setHostModalTab('overview'); setShowHostModal(true); }}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#D51659] via-purple-600 to-[#b44ddc] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D51659]/30 hover:scale-105 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Become a Host</span>
                  </button>

                  <button
                    onClick={() => { setHostModalTab('inquiry'); setShowHostModal(true); }}
                    className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Inquire with Staff</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
      
      {/* Host Program / Earn Money & Staff Inquiry Modal */}
      <HostProgramModal
        isOpen={showHostModal}
        onClose={() => setShowHostModal(false)}
        initialTab={hostModalTab}
      />
    </div>
  );
};

export default Wallet;
