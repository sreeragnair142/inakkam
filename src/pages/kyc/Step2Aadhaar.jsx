import React, { useRef, useState } from 'react';
import { Upload, X, FileText, CheckCircle2 } from 'lucide-react';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

const DocUploader = ({ label, sublabel, fieldName, file, preview, onChange, onRemove }) => {
  const ref = useRef();

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED.includes(f.type)) return alert('Only JPG, JPEG, PNG, PDF allowed.');
    if (f.size > MAX_SIZE) return alert('File size must be under 5MB.');
    const reader = new FileReader();
    reader.onload = (ev) => onChange(fieldName, f, ev.target.result);
    reader.readAsDataURL(f);
  };

  return (
    <div>
      <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-xs text-white/30 mb-3">{sublabel}</p>
      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
          {file?.type === 'application/pdf' ? (
            <div className="h-40 bg-white/5 flex flex-col items-center justify-center gap-2">
              <FileText className="w-10 h-10 text-purple-400" />
              <span className="text-xs text-white/60 font-medium">{file.name}</span>
            </div>
          ) : (
            <img src={preview} alt={label} className="w-full h-40 object-cover" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button onClick={() => onRemove(fieldName)} className="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()}
          className="w-full h-40 border-2 border-dashed border-white/15 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer group">
          <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-purple-500/10 flex items-center justify-center transition-colors">
            <Upload className="w-5 h-5 text-white/40 group-hover:text-purple-400 transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white/50 group-hover:text-white/70 transition-colors">Click to Upload</p>
            <p className="text-xs text-white/25 mt-0.5">JPG, PNG, PDF · Max 5MB</p>
          </div>
        </button>
      )}
      <input ref={ref} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleFile} />
    </div>
  );
};

const Step2Aadhaar = ({ data, onChange }) => {
  const handleChange = (field, file, preview) => {
    onChange({ ...data, [field]: file, [`${field}Preview`]: preview });
  };
  const handleRemove = (field) => {
    onChange({ ...data, [field]: null, [`${field}Preview`]: null });
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-300 font-medium">
        📋 Upload clear, readable images of your Aadhaar card. Ensure all text is visible and image is not blurry.
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        <DocUploader
          label="Aadhaar Front"
          sublabel="Side with your photo & Aadhaar number"
          fieldName="aadhaarFront"
          file={data.aadhaarFront}
          preview={data.aadhaarFrontPreview}
          onChange={handleChange}
          onRemove={handleRemove}
        />
        <DocUploader
          label="Aadhaar Back"
          sublabel="Side with your address"
          fieldName="aadhaarBack"
          file={data.aadhaarBack}
          preview={data.aadhaarBackPreview}
          onChange={handleChange}
          onRemove={handleRemove}
        />
      </div>
    </div>
  );
};

export default Step2Aadhaar;
