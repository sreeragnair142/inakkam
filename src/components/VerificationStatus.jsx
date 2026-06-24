import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Clock, ShieldX, Shield } from 'lucide-react';

// ─── Badge config ─────────────────────────────────────────
const STATUS_CONFIG = {
  NOT_VERIFIED: {
    icon: Shield,
    label: 'Not Verified',
    color: 'text-white/50',
    bg: 'bg-white/5',
    border: 'border-white/10',
    dot: 'bg-white/30',
    cta: true,
  },
  PENDING_VERIFICATION: {
    icon: Clock,
    label: 'Verification Under Review',
    color: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
    cta: false,
  },
  UNDER_VERIFICATION: {
    icon: Clock,
    label: 'Under Verification',
    color: 'text-blue-300',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    dot: 'bg-blue-400',
    cta: false,
  },
  VERIFIED: {
    icon: ShieldCheck,
    label: 'Verified Customer',
    color: 'text-green-300',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    dot: 'bg-green-400',
    cta: false,
  },
  REJECTED: {
    icon: ShieldX,
    label: 'Verification Rejected',
    color: 'text-red-300',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    dot: 'bg-red-400',
    cta: true,
  },
};

// ─── Compact badge (for navbar / header) ─────────────────
export const VerificationBadge = ({ status = 'NOT_VERIFIED', size = 'sm' }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_VERIFIED;
  const Icon = cfg.icon;
  const isSmall = size === 'sm';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status.includes('PENDING') || status.includes('UNDER') ? 'animate-pulse' : ''}`} />
      {!isSmall && <Icon className="w-3 h-3" />}
      {cfg.label}
    </span>
  );
};

// ─── Full verification card (for Profile page) ────────────
export const VerificationCard = ({ status = 'NOT_VERIFIED' }) => {
  const navigate = useNavigate();
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_VERIFIED;
  const Icon = cfg.icon;

  return (
    <div className={`rounded-2xl p-5 border ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${cfg.bg} ${cfg.border} border flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${cfg.color}`} />
          </div>
          <div>
            <p className={`text-sm font-black ${cfg.color}`}>{cfg.label}</p>
            {status === 'NOT_VERIFIED' && <p className="text-xs text-white/30 mt-0.5">Complete verification to unlock earnings</p>}
            {status === 'PENDING_VERIFICATION' && <p className="text-xs text-amber-300/60 mt-0.5">🕐 Review takes 24–48 hours</p>}
            {status === 'UNDER_VERIFICATION' && <p className="text-xs text-blue-300/60 mt-0.5">Our team is reviewing your documents</p>}
            {status === 'VERIFIED' && (
              <div className="mt-2 space-y-1">
                {['Earn Through Chat', 'Receive Paid Chat Requests', 'Withdraw Earnings'].map(b => (
                  <p key={b} className="text-xs text-green-300/70 flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-green-400" /> {b}
                  </p>
                ))}
              </div>
            )}
            {status === 'REJECTED' && <p className="text-xs text-red-300/60 mt-0.5">Re-submit with correct documents</p>}
          </div>
        </div>
        {cfg.cta && (
          <button onClick={() => navigate('/kyc-verification')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D51659] to-[#b44ddc] text-white text-xs font-bold whitespace-nowrap hover:opacity-90 transition-opacity cursor-pointer shadow-[0_2px_12px_rgba(213,22,89,0.3)]">
            {status === 'REJECTED' ? 'Re-Submit' : 'Get Verified'}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Verification Required popup modal ────────────────────
export const VerificationRequiredModal = ({ isOpen, onClose, onVerify }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-[#1a0a1e] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
        onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-xl font-black text-white mb-2">Verification Required</h3>
        <p className="text-sm text-white/50 mb-6 leading-relaxed">
          Complete customer verification to unlock earning features, receive paid chat requests, and withdraw earnings.
        </p>
        <button onClick={onVerify}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#D51659] to-[#b44ddc] text-white font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer shadow-[0_4px_20px_rgba(213,22,89,0.3)] mb-3">
          Become Verified
        </button>
        <button onClick={onClose}
          className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white/50 text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer">
          Not Now
        </button>
      </div>
    </div>
  );
};

export default VerificationBadge;
