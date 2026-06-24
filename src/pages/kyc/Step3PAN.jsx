import React, { useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

const Step3PAN = ({ data, onChange }) => {
  const ref = useRef();

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED.includes(f.type)) return alert('Only JPG, JPEG, PNG, PDF allowed.');
    if (f.size > MAX_SIZE) return alert('File size must be under 5MB.');
    const reader = new FileReader();
    reader.onload = (ev) => onChange({ ...data, panCard: f, panCardPreview: ev.target.result });
    reader.readAsDataURL(f);
  };

  const handleRemove = () => onChange({ ...data, panCard: null, panCardPreview: null });

  return (
    <div className="space-y-6">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-xs text-blue-300 font-medium">
        💳 Upload a clear image of your PAN card. Make sure the PAN number, name, and date of birth are clearly visible.
      </div>

      <div className="max-w-sm mx-auto">
        <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2">PAN Card Image</p>
        <p className="text-xs text-white/30 mb-4">Both sides not required — front side only</p>

        {data.panCardPreview ? (
          <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
            {data.panCard?.type === 'application/pdf' ? (
              <div className="h-52 bg-white/5 flex flex-col items-center justify-center gap-2">
                <FileText className="w-12 h-12 text-blue-400" />
                <span className="text-xs text-white/60 font-medium">{data.panCard.name}</span>
              </div>
            ) : (
              <img src={data.panCardPreview} alt="PAN Card" className="w-full h-52 object-cover" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button onClick={handleRemove} className="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <X className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
            <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        ) : (
          <button onClick={() => ref.current?.click()}
            className="w-full h-52 border-2 border-dashed border-white/15 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group">
            <div className="w-14 h-14 rounded-full bg-white/5 group-hover:bg-blue-500/10 flex items-center justify-center transition-colors">
              <Upload className="w-6 h-6 text-white/40 group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white/50 group-hover:text-white/70 transition-colors">Upload PAN Card</p>
              <p className="text-xs text-white/25 mt-0.5">JPG, PNG, PDF · Max 5MB</p>
            </div>
          </button>
        )}
        <input ref={ref} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleFile} />
      </div>

      <div className="flex items-start gap-3 bg-white/5 rounded-2xl p-4 border border-white/10">
        <AlertCircle className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
        <p className="text-xs text-white/40 leading-relaxed">
          Your documents are encrypted and stored securely. They will only be used for identity verification purposes and will not be shared with third parties.
        </p>
      </div>
    </div>
  );
};

export default Step3PAN;
