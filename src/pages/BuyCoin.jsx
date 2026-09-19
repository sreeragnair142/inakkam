import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Coins, ShieldCheck, ArrowLeft, CreditCard, Headphones, Video,
  Sparkles, Zap, X, Lock, CheckCircle2, ChevronRight, Copy,
  Upload, Camera, Clock, AlertCircle, Check, ArrowRight,
  Building2, QrCode, Banknote,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../utils/api";
import { fetchMe } from "../redux/slices/authSlice";
import toast from "react-hot-toast";

/* ============================================================
   WhatsApp SVG Icon
============================================================ */
const WhatsAppIcon = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

/* ============================================================
   PAYMENT CONFIGURATION — Client Details
   WhatsApp: +91 7092518846 (payment section ONLY)
============================================================ */
const PAYMENT_CONFIG = {
  whatsappNumber: "917092518846",
  methods: [
    {
      id: "qr_federal",
      type: "qr",
      label: "Scan QR",
      sublabel: "Federal Bank",
      tagline: "turbosolutions1@fbl",
      upiId: "turbosolutions1@fbl",
      bankName: "Federal Bank",
      accountHolder: "Turboweb Solutions Pvt Ltd",
      color: "#1a56db",
      bg: "linear-gradient(135deg,#0a3880 0%,#1a56db 100%)",
      qrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=260x260&color=000000&bgcolor=FFFFFF&data=upi%3A%2F%2Fpay%3Fpa%3Dturbosolutions1%40fbl%26pn%3DTurboweb%2BSolutions%26cu%3DINR",
    },
    {
      id: "qr_hdfc",
      type: "qr",
      label: "Scan QR",
      sublabel: "HDFC Bank",
      tagline: "7034033302@hdfc",
      upiId: "7034033302@hdfc",
      bankName: "HDFC Bank",
      accountHolder: "Turboweb Solutions Pvt Ltd",
      color: "#004C8F",
      bg: "linear-gradient(135deg,#003368 0%,#0070ba 100%)",
      qrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=260x260&color=000000&bgcolor=FFFFFF&data=upi%3A%2F%2Fpay%3Fpa%3D7034033302%40hdfc%26pn%3DTurboweb%2BSolutions%26cu%3DINR",
    },
    {
      id: "bank_federal",
      type: "bank",
      label: "Bank Transfer",
      sublabel: "Federal Bank",
      tagline: "A/C: 22890200003026",
      bankName: "FDRL Bank (Federal Bank)",
      accountHolder: "Turbo Web Solutions Private Limited",
      accountNumber: "22890200003026",
      ifsc: "FDRL0002289",
      branch: "Palakkad",
      color: "#1a56db",
      bg: "linear-gradient(135deg,#0a3880 0%,#1a56db 100%)",
    },
    {
      id: "bank_hdfc",
      type: "bank",
      label: "Bank Transfer",
      sublabel: "HDFC Bank",
      tagline: "A/C: 50200107900153",
      bankName: "HDFC Bank",
      accountHolder: "Turboweb Solutions Private Limited",
      accountNumber: "50200107900153",
      ifsc: "HDFC0000117",
      branch: "Palakkad",
      color: "#004C8F",
      bg: "linear-gradient(135deg,#003368 0%,#0070ba 100%)",
    },
    {
      id: "card",
      type: "card",
      label: "Card Payment",
      sublabel: "Visa / Mastercard / RuPay",
      tagline: "Contact support on WhatsApp",
      color: "#D51659",
      bg: "linear-gradient(135deg,#D51659 0%,#b44ddc 100%)",
    },
  ],
};

/* ============================================================
   PACKAGE DATA
============================================================ */
const customerRechargePacks = [
  { id: "pkg_199",  coins: 1194,  price: 199  },
  { id: "pkg_399",  coins: 2394,  price: 399  },
  { id: "pkg_599",  coins: 3594,  price: 599  },
  { id: "pkg_799",  coins: 4794,  price: 799  },
  { id: "pkg_999",  coins: 5994,  price: 999,  badge: "Popular" },
  { id: "pkg_1199", coins: 7194,  price: 1199 },
  { id: "pkg_1399", coins: 8394,  price: 1399 },
  { id: "pkg_1599", coins: 9594,  price: 1599 },
  { id: "pkg_1799", coins: 10794, price: 1799 },
  { id: "pkg_1999", coins: 11994, price: 1999, badge: "Hot" },
  { id: "pkg_2199", coins: 13194, price: 2199 },
  { id: "pkg_2399", coins: 14394, price: 2399 },
  { id: "pkg_2599", coins: 15594, price: 2599 },
  { id: "pkg_2799", coins: 16794, price: 2799 },
  { id: "pkg_2999", coins: 17994, price: 2999 },
  { id: "pkg_3199", coins: 19194, price: 3199 },
  { id: "pkg_3399", coins: 20394, price: 3399 },
  { id: "pkg_3599", coins: 21594, price: 3599 },
  { id: "pkg_3799", coins: 22794, price: 3799 },
  { id: "pkg_3999", coins: 23994, price: 3999, badge: "Best Value" },
  { id: "pkg_4199", coins: 25194, price: 4199 },
  { id: "pkg_4399", coins: 26394, price: 4399 },
  { id: "pkg_4599", coins: 27594, price: 4599 },
  { id: "pkg_4799", coins: 28794, price: 4799 },
  { id: "pkg_4999", coins: 29994, price: 4999 },
];

const audioCallingPacks = [
  { id: "audio_5",  minutes: 5,  coins: 750,  price: 125  },
  { id: "audio_10", minutes: 10, coins: 1500, price: 250  },
  { id: "audio_20", minutes: 20, coins: 3000, price: 500  },
  { id: "audio_30", minutes: 30, coins: 4500, price: 750  },
  { id: "audio_40", minutes: 40, coins: 6000, price: 1000 },
  { id: "audio_50", minutes: 50, coins: 7500, price: 1250 },
  { id: "audio_60", minutes: 60, coins: 9000, price: 1500 },
];

const videoCallingPacks = [
  { id: "video_5",  minutes: 5,  coins: 2100,  price: 350  },
  { id: "video_10", minutes: 10, coins: 4194,  price: 699  },
  { id: "video_20", minutes: 20, coins: 8394,  price: 1399 },
  { id: "video_30", minutes: 30, coins: 12594, price: 2099 },
  { id: "video_40", minutes: 40, coins: 16794, price: 2799 },
  { id: "video_50", minutes: 50, coins: 20994, price: 3499 },
  { id: "video_60", minutes: 60, coins: 25194, price: 4199 },
];

const badgeStyles = {
  Hot: "bg-gradient-to-r from-rose-500 to-orange-500 text-white",
  Popular: "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white",
  "Best Value": "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
};

/* ============================================================
   HELPER — Package Summary Bar
============================================================ */
function PkgBar({ pkg }) {
  return (
    <div className="flex items-center justify-between bg-gradient-to-br from-[#FFF5F8] to-[#FFF0F4] rounded-2xl border border-rose-100 p-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow">
          <Coins className="w-5 h-5 text-slate-900 fill-current" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#D51659] uppercase tracking-wider">Coin Pack</p>
          <p className="text-base font-black text-slate-900">{pkg.coins.toLocaleString()} Coins</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[10px] text-slate-400 font-medium">You Pay</p>
        <p className="text-xl font-black text-[#D51659]">&#8377;{pkg.price.toLocaleString()}</p>
      </div>
    </div>
  );
}

/* ============================================================
   STEP 1 — CHOOSE PAYMENT METHOD
============================================================ */
function StepMethod({ pkg, onSelect }) {
  const getIcon = (type) => {
    if (type === "qr")   return <QrCode className="w-6 h-6" />;
    if (type === "bank") return <Building2 className="w-6 h-6" />;
    return <CreditCard className="w-6 h-6" />;
  };
  return (
    <div className="flex flex-col gap-4">
      <PkgBar pkg={pkg} />
      <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Select Payment Method</p>
      <div className="flex flex-col gap-2.5">
        {PAYMENT_CONFIG.methods.map((m) => (
          <motion.button
            key={m.id}
            type="button"
            onClick={() => onSelect(m)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 bg-white hover:border-slate-200 hover:shadow-lg transition-all cursor-pointer text-left"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md" style={{ background: m.bg }}>
              {getIcon(m.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900">{m.label}</p>
              <p className="text-xs font-bold" style={{ color: m.color }}>{m.sublabel}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate font-mono">{m.tagline}</p>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: m.color + "18" }}>
              <ChevronRight className="w-4 h-4" style={{ color: m.color }} />
            </div>
          </motion.button>
        ))}
      </div>
      <div className="flex items-center justify-center gap-5 pt-1">
        <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />100% Secure</span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium"><Zap className="w-3.5 h-3.5 text-amber-500" />Coins in 30 mins</span>
      </div>
    </div>
  );
}

/* ============================================================
   STEP 2 — PAYMENT DETAILS
============================================================ */
function StepPayment({ pkg, method, onPaid }) {
  const [copiedField, setCopiedField] = useState(null);
  const copyText = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(id); toast.success("Copied!");
      setTimeout(() => setCopiedField(null), 2000);
    });
  };
  const CopyBtn = ({ text, id }) => (
    <button type="button" onClick={() => copyText(text, id)}
      className={"shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-none " + (copiedField === id ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
      {copiedField === id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copiedField === id ? "Done" : "Copy"}
    </button>
  );
  const upiLink = method.upiId ? "upi://pay?pa=" + method.upiId + "&pn=Turboweb+Solutions&am=" + pkg.price + "&cu=INR&tn=InakkamCoins_" + pkg.coins : null;

  return (
    <div className="flex flex-col gap-4">
      <PkgBar pkg={pkg} />
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: method.bg }}>
          {method.type === "qr" && <QrCode className="w-3.5 h-3.5" />}
          {method.type === "bank" && <Building2 className="w-3.5 h-3.5" />}
          {method.type === "card" && <CreditCard className="w-3.5 h-3.5" />}
        </div>
        <span className="text-sm font-black text-slate-800">{method.label} &mdash; <span style={{ color: method.color }}>{method.sublabel}</span></span>
      </div>

      {method.type === "qr" && (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-800 font-medium leading-relaxed">
              <strong>How to Pay:</strong><br />
              1. Scan QR below or copy UPI ID<br />
              2. Enter exactly &#8377;{pkg.price.toLocaleString()} as amount<br />
              3. Complete payment &amp; save screenshot<br />
              4. Click "I Have Paid" to upload proof
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="relative p-3 bg-white rounded-2xl shadow-2xl" style={{ border: "3px solid " + method.color + "30" }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg" style={{ background: method.bg }}>
                Scan &amp; Pay &#8377;{pkg.price.toLocaleString()}
              </div>
              <img src={method.qrUrl} alt={method.bankName + " UPI QR"} className="w-56 h-56 rounded-xl" />
              <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <span className="text-[10px] font-black px-3 py-0.5 rounded-full text-white" style={{ background: method.bg }}>{method.bankName}</span>
              </div>
            </div>
            <div className="w-full flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">UPI</span>
              <span className="flex-1 text-xs font-extrabold text-slate-800 font-mono truncate">{method.upiId}</span>
              <CopyBtn text={method.upiId} id="upi" />
            </div>
            {upiLink && (
              <a href={upiLink} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-black text-xs uppercase tracking-wider shadow-md hover:scale-[1.01] active:scale-95 transition-all no-underline" style={{ background: "linear-gradient(135deg,#00b300,#00d900)" }}>
                Open in UPI App <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </>
      )}

      {method.type === "bank" && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-blue-800 font-medium leading-relaxed">
              <strong>How to Transfer:</strong><br />
              1. Copy account details below<br />
              2. Transfer exactly &#8377;{pkg.price.toLocaleString()} via NEFT/IMPS<br />
              3. Save your UTR / receipt number<br />
              4. Click "I Have Paid" to upload proof
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { label: "Account Holder", value: method.accountHolder, id: "holder", mono: false },
              { label: "Account Number",  value: method.accountNumber, id: "acc",    mono: true  },
              { label: "IFSC Code",       value: method.ifsc,          id: "ifsc",   mono: true  },
              { label: "Bank Name",       value: method.bankName,      id: "bank",   mono: false },
              { label: "Branch",          value: method.branch,        id: "branch", mono: false },
            ].map((f) => (
              <div key={f.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{f.label}</p>
                  <p className={"text-sm font-extrabold text-slate-800 mt-0.5 " + (f.mono ? "font-mono" : "")}>{f.value}</p>
                </div>
                <CopyBtn text={f.value} id={f.id} />
              </div>
            ))}
          </div>
        </>
      )}

      {method.type === "card" && (
        <>
          <div className="rounded-2xl p-4 flex items-start gap-2.5" style={{ background: "#fdf2f8", border: "1px solid #fbcfe8" }}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#D51659" }} />
            <div className="text-[11px] font-medium leading-relaxed" style={{ color: "#9d174d" }}>
              <strong>Card Payment Steps:</strong><br />
              1. Tap "Contact on WhatsApp" below<br />
              2. Our team sends you a secure payment link<br />
              3. Pay with your Visa / Mastercard / RuPay<br />
              4. Share payment screenshot on WhatsApp
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 py-3">
            <div className="w-28 h-16 rounded-2xl flex items-center justify-center shadow-2xl" style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e)" }}>
              <CreditCard className="w-9 h-9 text-white" strokeWidth={1.5} />
            </div>
            <p className="text-xs font-black text-slate-700 text-center">Visa &middot; Mastercard &middot; RuPay</p>
            <p className="text-[11px] text-slate-400 text-center max-w-[240px]">Our support team will assist you with a secure card payment link via WhatsApp</p>
          </div>
        </>
      )}

      {method.type !== "card" ? (
        <button type="button" onClick={onPaid} className="w-full py-3.5 rounded-2xl text-white font-black text-sm uppercase tracking-wider shadow-lg hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-none mt-1" style={{ background: "linear-gradient(135deg,#D51659,#b44ddc)" }}>
          <Check className="w-4 h-4" /> I Have Paid &mdash; Upload Proof <ChevronRight className="w-4 h-4" />
        </button>
      ) : (
        <a href={"https://wa.me/917092518846?text=" + encodeURIComponent("Hi Inakkam Support! I need assistance with card payment for coin recharge.")} target="_blank" rel="noreferrer" onClick={onPaid}
          className="w-full py-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2.5 cursor-pointer border-none shadow-lg hover:scale-[1.01] active:scale-95 transition-all no-underline mt-1" style={{ background: "linear-gradient(135deg,#25D366,#128C7E)" }}>
          <WhatsAppIcon size={19} /> Contact on WhatsApp
        </a>
      )}
    </div>
  );
}

/* ============================================================
   STEP 3 — UPLOAD / WHATSAPP
============================================================ */
function StepUpload({ pkg, method, currentUser, onSubmit, onWhatsApp, isSubmitting }) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);
  const [base64, setBase64] = useState("");
  const [utrNumber, setUtrNumber] = useState("");

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB allowed"); return; }
    const reader = new FileReader();
    reader.onload = (e) => { setPreview(e.target.result); setBase64(e.target.result); };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between bg-gradient-to-br from-[#FFF5F8] to-[#FFF0F4] rounded-2xl border border-rose-100 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2"><Coins className="w-5 h-5 text-amber-500 fill-current" /><span className="text-sm font-bold text-slate-800">{pkg.coins.toLocaleString()} Coins</span></div>
        <span className="text-base font-black text-[#D51659]">&#8377;{pkg.price.toLocaleString()}</span>
      </div>

      {/* WhatsApp Option */}
      <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: "#25D36640", background: "linear-gradient(135deg,#f0fdf4,#dcfce7)" }}>
        <div className="px-4 pt-4 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#25D366" }}>
              <WhatsAppIcon size={16} className="text-white" />
            </div>
            <p className="text-sm font-black text-slate-800">Send via WhatsApp</p>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white uppercase tracking-wide" style={{ background: "#25D366" }}>Recommended</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
            Opens WhatsApp with your name, email &amp; order details pre-filled. Just attach your payment screenshot and send!
          </p>
          <button type="button" onClick={onWhatsApp}
            className="w-full py-3 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer border-none hover:scale-[1.01] active:scale-95 transition-all shadow-md"
            style={{ background: "linear-gradient(135deg,#25D366,#128C7E)" }}>
            <WhatsAppIcon size={17} /> Open WhatsApp &amp; Share Screenshot
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[11px] text-slate-400 font-semibold">OR upload here</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
        className="relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-5 cursor-pointer transition-all min-h-[130px]"
        style={{ borderColor: preview ? "#10b981" : "#D5165944", background: preview ? "#f0fdf488" : "#fff5f888" }}
      >
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        {preview ? (
          <><img src={preview} alt="preview" className="max-h-36 rounded-xl object-contain shadow-md" /><p className="text-[11px] text-slate-500 font-medium">Tap to change</p></>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-[#D51659]/10 flex items-center justify-center"><Camera className="w-6 h-6 text-[#D51659]" /></div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700">Upload Payment Screenshot</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tap to choose or drag &amp; drop</p>
              <p className="text-[10px] text-slate-300 mt-1">JPG, PNG or WEBP &middot; Max 5 MB</p>
            </div>
          </>
        )}
      </div>

      <div>
        <label className="text-xs font-extrabold text-slate-700 block mb-1.5">UTR / Transaction ID <span className="text-slate-400 font-normal">(optional)</span></label>
        <input type="text" value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} placeholder="e.g. 412345678901"
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#D51659] text-sm font-semibold text-slate-800 bg-white" />
      </div>

      <button type="button" onClick={() => onSubmit(base64, utrNumber)} disabled={!preview || isSubmitting}
        className="w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-wider shadow-lg hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg,#D51659,#b44ddc)" }}>
        {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Upload className="w-4 h-4" /> Submit for Verification</>}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Your screenshot is encrypted and stored securely
      </div>
    </div>
  );
}

/* ============================================================
   STEP 4 — SUCCESS
============================================================ */
function StepSuccess({ pkg, requestId, viaWhatsApp, onClose }) {
  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <div className="relative">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl"
          style={{ background: viaWhatsApp ? "linear-gradient(135deg,#25D366,#128C7E)" : "linear-gradient(135deg,#10b981,#059669)" }}>
          <CheckCircle2 className="w-12 h-12 text-white" />
        </motion.div>
        <motion.div animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 rounded-full" style={{ background: viaWhatsApp ? "#25D36640" : "#10b98140" }} />
      </div>
      <div>
        <h3 className="text-xl font-black text-slate-900">{viaWhatsApp ? "WhatsApp Opened!" : "Request Submitted!"}</h3>
        <p className="text-sm text-slate-500 mt-1 leading-relaxed max-w-[280px] mx-auto">
          {viaWhatsApp
            ? "Your order is logged. Send your payment screenshot on WhatsApp to get coins credited fast."
            : <><strong className="text-slate-800">{pkg.coins.toLocaleString()} coins</strong> (&#8377;{pkg.price.toLocaleString()}) payment is under review.</>}
        </p>
      </div>
      <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left space-y-2.5">
        <div className="flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-xs font-black text-amber-800">Expected Crediting Time</p>
            <p className="text-[11px] text-amber-700">Within 15&ndash;30 minutes after verification</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-purple-500 shrink-0" />
          <div>
            <p className="text-xs font-black text-slate-700">Notification</p>
            <p className="text-[11px] text-slate-500">You will get an in-app notification once coins are credited</p>
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
      <button type="button" onClick={onClose} className="w-full py-3.5 rounded-2xl text-white font-black text-sm uppercase tracking-wider shadow-md hover:scale-[1.01] transition-all cursor-pointer border-none" style={{ background: "linear-gradient(135deg,#D51659,#b44ddc)" }}>
        Done
      </button>
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
const BuyCoin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((s) => s.auth.user);

  const [activeTab, setActiveTab] = useState("recharge");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [step, setStep] = useState(null); // null | "method" | "payment" | "upload" | "success"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [viaWhatsApp, setViaWhatsApp] = useState(false);

  const userCoins = currentUser?.wallet?.balance || 0;

  const getPackages = () => {
    if (activeTab === "audio") return audioCallingPacks;
    if (activeTab === "video") return videoCallingPacks;
    return customerRechargePacks;
  };

  const tabs = [
    { id: "recharge", label: "Coin Recharge", icon: Banknote },
    { id: "audio",    label: "Audio Bundles", icon: Headphones },
    { id: "video",    label: "Video Bundles", icon: Video },
  ];

  const handleSelectPack = (pkg) => { setSelectedPackage(pkg); setSelectedMethod(null); setStep("method"); setRequestId(null); setViaWhatsApp(false); };
  const handleClose = () => { setSelectedPackage(null); setSelectedMethod(null); setStep(null); setViaWhatsApp(false); };
  const handleSelectMethod = (m) => { setSelectedMethod(m); setStep("payment"); };
  const handlePaid = () => setStep("upload");

  const handleSubmitRequest = async (screenshotBase64, utrNumber) => {
    if (!screenshotBase64 || !selectedPackage) return;
    setIsSubmitting(true);
    try {
      const res = await api.post("/coins/request", {
        coins: selectedPackage.coins, amount: selectedPackage.price,
        packageId: selectedPackage.id, packageType: activeTab,
        minutes: selectedPackage.minutes || null,
        screenshotUrl: screenshotBase64, utrNumber,
        paymentMethod: selectedMethod?.id || "other",
        submittedViaWhatsapp: false,
      });
      if (res.data?.success) {
        setRequestId(res.data.requestId); setViaWhatsApp(false); setStep("success"); dispatch(fetchMe());
      } else {
        toast.error(res.data?.message || "Failed to submit. Please try again.");
      }
    } catch (err) {
      console.error(err); setViaWhatsApp(false); setStep("success"); dispatch(fetchMe());
    } finally { setIsSubmitting(false); }
  };

  const handleWhatsApp = async () => {
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
    const methodLabel = selectedMethod ? (selectedMethod.label + " - " + selectedMethod.sublabel + (selectedMethod.upiId ? " (" + selectedMethod.upiId + ")" : "")) : "WhatsApp";
    const lines = [
      "Hi Inakkam Support! \uD83D\uDE4F",
      "",
      "*COIN RECHARGE REQUEST*",
      "------------------------------",
      "*Name:* " + (currentUser?.name || "N/A"),
      "*Email:* " + (currentUser?.email || "N/A"),
      "*Phone:* " + (currentUser?.phone || "N/A"),
      "------------------------------",
      "*Coins:* " + (selectedPackage?.coins?.toLocaleString()),
      "*Amount Paid:* ₹" + (selectedPackage?.price?.toLocaleString()),
      "*Paid via:* " + methodLabel,
      "*Date & Time:* " + now + " IST",
      "------------------------------",
      "Please find payment screenshot attached.",
      "Kindly verify and credit coins. Thank you!",
    ];
    const msg = lines.join("\n");
    const waUrl = "https://wa.me/" + PAYMENT_CONFIG.whatsappNumber + "?text=" + encodeURIComponent(lines.join("\n"));
    try {
      const res = await api.post("/coins/request", {
        coins: selectedPackage?.coins, amount: selectedPackage?.price,
        packageId: selectedPackage?.id, packageType: activeTab,
        minutes: selectedPackage?.minutes || null,
        screenshotUrl: "", utrNumber: "",
        paymentMethod: selectedMethod?.id || "whatsapp",
        submittedViaWhatsapp: true,
      });
      if (res.data?.requestId) setRequestId(res.data.requestId);
      dispatch(fetchMe());
    } catch (e) { console.warn("WA backend log failed:", e); }
    window.open(waUrl, "_blank");
    setViaWhatsApp(true);
    setStep("success");
  };

  const stepTitles = { method: "Choose Payment", payment: "Payment Details", upload: "Upload Proof", success: "All Done!" };
  const stepNumbers = { method: 1, payment: 2, upload: 3, success: 4 };
  const currentStepNum = stepNumbers[step] || 0;

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#FFF5F6] via-[#FFFDFD] to-[#FFEBEF] pt-20 md:pt-24 pb-28 px-4 md:px-8 relative overflow-hidden">
      <div className="max-w-5xl w-full mx-auto relative">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate(-1)} className="p-2.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer border-none">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Recharge Coins</h1>
              <p className="text-sm text-slate-500 hidden sm:block mt-0.5">Fuel your calls, chats and gifts</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-slate-950"><Coins className="w-3.5 h-3.5 fill-current" /></div>
            <span className="text-sm font-extrabold text-slate-800">{userCoins.toLocaleString()}</span>
          </div>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-2 mb-9 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                className={"relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors duration-200 cursor-pointer border-none " + (isActive ? "text-white" : "text-slate-500 hover:text-slate-800")}>
                {isActive && <motion.div layoutId="tab-pill" className="absolute inset-0 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-500" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* PACKAGE GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 md:gap-5">
          {getPackages().map((pkg) => (
            <motion.button key={pkg.id} type="button" onClick={() => handleSelectPack(pkg)}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className={"group relative flex flex-col items-center justify-center text-center rounded-2xl p-5 min-h-[148px] overflow-hidden border transition-all duration-200 shadow-sm cursor-pointer border-none " + (pkg.badge ? "bg-white border-slate-200 shadow-md" : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-md")}>
              {pkg.badge && <span className={"absolute top-0 right-0 px-2.5 py-1 rounded-bl-xl rounded-tr-2xl text-[10px] font-bold tracking-wide " + badgeStyles[pkg.badge]}>{pkg.badge}</span>}
              {activeTab !== "recharge" && pkg.minutes && <span className="mb-2 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-[11px] font-semibold text-purple-600">{pkg.minutes} min</span>}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 flex items-center justify-center mb-2.5 shadow-md group-hover:scale-110 transition-transform">
                <Coins className="w-6 h-6 text-slate-950 fill-current opacity-90" />
              </div>
              <span className="text-base font-extrabold text-slate-900 tracking-tight">{pkg.coins.toLocaleString()} coins</span>
              <span className="text-[10px] text-slate-400 font-medium mt-1 group-hover:text-[#D51659] transition-colors">Tap to recharge</span>
            </motion.button>
          ))}
        </div>

        {/* HOW IT WORKS */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { icon: "🔍", title: "Select Pack",  desc: "Choose any coin pack" },
            { icon: "💳", title: "Pick Method",  desc: "UPI, Bank or Card" },
            { icon: "📱", title: "Pay & Proof",  desc: "Pay & upload receipt" },
            { icon: "⚡", title: "Get Coins",    desc: "Credited in 30 mins" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl shrink-0">{s.icon}</div>
              <div><p className="text-xs font-extrabold text-slate-800">{s.title}</p><p className="text-[11px] text-slate-400 mt-0.5">{s.desc}</p></div>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-slate-400 text-xs font-medium">
          <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" />Secure &amp; Verified</span>
          <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" />Coins in 30 mins</span>
          <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#D51659]" />No Hidden Charges</span>
          <span className="flex items-center gap-2"><WhatsAppIcon size={14} className="text-green-500" />WhatsApp Support</span>
        </div>
      </div>

      {/* ================================================================
          PAYMENT FLOW MODAL (Mounted via Portal to escape header stacking context)
      ================================================================ */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {selectedPackage && step && (
              <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={step === "success" ? handleClose : undefined}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  key={step}
                  initial={{ y: 50, opacity: 0, scale: 0.96 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 50, opacity: 0, scale: 0.96 }}
                  transition={{ type: "spring", damping: 28, stiffness: 300 }}
                  className="relative z-10 w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl flex flex-col max-h-[88vh] sm:max-h-[85vh] my-auto overflow-hidden"
                >
                  <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
                    <div className="w-10 h-1 bg-slate-200 rounded-full" />
                  </div>
                  {step !== "success" && (
                    <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-slate-100 shrink-0">
                      <div className="flex items-center gap-3">
                        {step !== "method" && (
                          <button
                            type="button"
                            onClick={() => {
                              if (step === "payment") setStep("method");
                              else if (step === "upload") setStep("payment");
                            }}
                            className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer border-none"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                        )}
                        <div>
                          <p className="text-base font-black text-slate-900 tracking-tight">
                            {stepTitles[step]}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {[1, 2, 3, 4].map((n) => (
                              <div
                                key={n}
                                className={
                                  "h-1 rounded-full transition-all " +
                                  (n <= currentStepNum
                                    ? "bg-[#D51659] w-5"
                                    : "bg-slate-200 w-3")
                                }
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
                  <div className="overflow-y-auto px-5 pt-5 pb-6 flex-1">
                    {step === "method" && (
                      <StepMethod
                        pkg={selectedPackage}
                        onSelect={handleSelectMethod}
                      />
                    )}
                    {step === "payment" && selectedMethod && (
                      <StepPayment
                        pkg={selectedPackage}
                        method={selectedMethod}
                        onPaid={handlePaid}
                      />
                    )}
                    {step === "upload" && (
                      <StepUpload
                        pkg={selectedPackage}
                        method={selectedMethod}
                        currentUser={currentUser}
                        onSubmit={handleSubmitRequest}
                        onWhatsApp={handleWhatsApp}
                        isSubmitting={isSubmitting}
                      />
                    )}
                    {step === "success" && (
                      <StepSuccess
                        pkg={selectedPackage}
                        requestId={requestId}
                        viaWhatsApp={viaWhatsApp}
                        onClose={handleClose}
                      />
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

export default BuyCoin;
