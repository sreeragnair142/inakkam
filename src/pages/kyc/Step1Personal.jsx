import React from 'react';
import { User, Phone, Mail, MapPin, Briefcase, Calendar } from 'lucide-react';

const inputClass = `w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm
  placeholder-white/30 focus:outline-none focus:border-purple-500/60 focus:bg-white/8
  transition-all duration-200`;

const labelClass = "block text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5";

const Field = ({ label, icon: Icon, children }) => (
  <div>
    <label className={labelClass}>{Icon && <Icon className="w-3 h-3 inline mr-1.5 -mt-0.5" />}{label}</label>
    {children}
  </div>
);

const Step1Personal = ({ data, onChange }) => {
  const handle = (e) => onChange({ ...data, [e.target.name]: e.target.value });

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Full Name" icon={User}>
          <input name="fullName" value={data.fullName} onChange={handle} placeholder="As on Aadhaar card"
            className={inputClass} />
        </Field>
        <Field label="Date of Birth" icon={Calendar}>
          <input name="dateOfBirth" type="date" value={data.dateOfBirth} onChange={handle}
            className={`${inputClass} [color-scheme:dark]`} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Gender">
          <select name="gender" value={data.gender} onChange={handle} className={inputClass}>
            <option value="" className="bg-[#1a0a1e]">Select Gender</option>
            <option value="Male" className="bg-[#1a0a1e]">Male</option>
            <option value="Female" className="bg-[#1a0a1e]">Female</option>
            <option value="Non-Binary" className="bg-[#1a0a1e]">Non-Binary</option>
            <option value="Prefer not to say" className="bg-[#1a0a1e]">Prefer not to say</option>
          </select>
        </Field>
        <Field label="Mobile Number" icon={Phone}>
          <input name="phone" value={data.phone} onChange={handle} placeholder="+91 XXXXX XXXXX"
            className={inputClass} maxLength={15} />
        </Field>
      </div>

      <Field label="Email Address" icon={Mail}>
        <input name="email" type="email" value={data.email} onChange={handle} placeholder="you@example.com"
          className={inputClass} />
      </Field>

      <Field label="Address" icon={MapPin}>
        <textarea name="address" value={data.address} onChange={handle} placeholder="House/Flat No., Street, Area"
          rows={2} className={`${inputClass} resize-none`} />
      </Field>

      <div className="grid sm:grid-cols-3 gap-5">
        <Field label="City">
          <input name="city" value={data.city} onChange={handle} placeholder="City"
            className={inputClass} />
        </Field>
        <Field label="State">
          <input name="state" value={data.state} onChange={handle} placeholder="State"
            className={inputClass} />
        </Field>
        <Field label="Pincode">
          <input name="pincode" value={data.pincode} onChange={handle} placeholder="6-digit PIN"
            className={inputClass} maxLength={6} />
        </Field>
      </div>

      <Field label="Occupation" icon={Briefcase}>
        <input name="occupation" value={data.occupation} onChange={handle} placeholder="e.g. Software Engineer"
          className={inputClass} />
      </Field>
    </div>
  );
};

export default Step1Personal;
