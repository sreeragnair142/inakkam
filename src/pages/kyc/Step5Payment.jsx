import React from 'react';
import { Building2, CreditCard, Smartphone } from 'lucide-react';

const inputClass = `w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm
  placeholder-white/30 focus:outline-none focus:border-purple-500/60 focus:bg-white/8 transition-all duration-200`;

const labelClass = "block text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5";

const Step5Payment = ({ data, onChange }) => {
  const set = (field, val) => onChange({ ...data, [field]: val });
  const handle = (e) => set(e.target.name, e.target.value);

  return (
    <div className="space-y-6">
      {/* Method selector */}
      <div>
        <p className={labelClass}>Payment Method</p>
        <div className="grid grid-cols-2 gap-4 mt-2">
          {[
            { val: 'bank', icon: Building2, label: 'Bank Account' },
            { val: 'upi',  icon: Smartphone, label: 'UPI' },
          ].map(({ val, icon: Icon, label }) => (
            <button key={val} onClick={() => set('paymentMethod', val)}
              className={`flex items-center justify-center gap-2.5 py-4 rounded-2xl border text-sm font-bold transition-all cursor-pointer
                ${data.paymentMethod === val
                  ? 'bg-gradient-to-r from-[#D51659]/20 to-[#b44ddc]/20 border-purple-500/40 text-white shadow-[0_0_20px_rgba(180,77,220,0.15)]'
                  : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/8 hover:border-white/20'}`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bank Account Fields */}
      {data.paymentMethod === 'bank' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-white/70">Bank Account Details</span>
          </div>

          <div>
            <label className={labelClass}>Account Holder Name</label>
            <input name="accountHolderName" value={data.accountHolderName || ''} onChange={handle}
              placeholder="As per bank records" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Bank Name</label>
            <input name="bankName" value={data.bankName || ''} onChange={handle}
              placeholder="e.g. State Bank of India" className={inputClass} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Account Number</label>
              <input name="accountNumber" type="password" value={data.accountNumber || ''} onChange={handle}
                placeholder="Enter account number" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Confirm Account Number</label>
              <input name="confirmAccountNumber" value={data.confirmAccountNumber || ''} onChange={handle}
                placeholder="Re-enter account number" className={inputClass} />
            </div>
          </div>

          {data.accountNumber && data.confirmAccountNumber &&
            data.accountNumber !== data.confirmAccountNumber && (
            <p className="text-xs text-red-400 font-medium -mt-2">Account numbers do not match</p>
          )}

          <div>
            <label className={labelClass}>IFSC Code</label>
            <input name="ifscCode" value={data.ifscCode || ''} onChange={handle}
              placeholder="e.g. SBIN0001234" className={`${inputClass} uppercase`}
              maxLength={11} />
          </div>
        </div>
      )}

      {/* UPI Field */}
      {data.paymentMethod === 'upi' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-white/70">UPI Details</span>
          </div>
          <label className={labelClass}>UPI ID</label>
          <input name="upiId" value={data.upiId || ''} onChange={handle}
            placeholder="yourname@upi" className={inputClass} />
          <p className="text-xs text-white/30 mt-2">e.g. 9876543210@paytm, name@okhdfcbank</p>
        </div>
      )}

      {!data.paymentMethod && (
        <div className="text-center text-sm text-white/30 py-4">
          Select a payment method above to continue
        </div>
      )}

      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-xs text-green-300 font-medium">
        🔒 Your payment details are encrypted with bank-grade security and used only for earnings withdrawal.
      </div>
    </div>
  );
};

export default Step5Payment;
