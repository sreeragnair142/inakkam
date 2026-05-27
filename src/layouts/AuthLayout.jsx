import React from 'react';
import { Flame } from 'lucide-react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-bumble-cream text-bumble-charcoal overflow-hidden relative">
      
      {/* Decorative Shifting Background Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[55rem] h-[55rem] rounded-full bg-bumble-yellow/15 blur-[130px] pointer-events-none animate-float-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50rem] h-[50rem] rounded-full bg-bumble-red/8 blur-[120px] pointer-events-none animate-float-medium" />
      <div className="absolute top-[40%] right-[30%] w-[35rem] h-[35rem] rounded-full bg-rose-500/5 blur-[100px] pointer-events-none animate-float-fast" />

      {/* Left Pane - Premium Branding Showcase */}
      <div className="hidden md:flex md:w-1/2 bg-bumble-yellow p-12 flex-col justify-between relative overflow-hidden">
        
        {/* Shifting radial glow */}
        <div className="absolute -inset-px bg-gradient-to-tr from-white/10 via-transparent to-black/5 opacity-50 pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 rounded-xl bg-bumble-charcoal flex items-center justify-center shadow-lg shadow-black/10">
            <Flame className="w-6 h-6 text-bumble-yellow animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-2xl tracking-tight text-bumble-charcoal">
              Inakkam
            </span>
            <p className="text-[9px] text-bumble-charcoal/80 font-bold uppercase tracking-wider">Premium Dating Experience</p>
          </div>
        </div>

        {/* Core Slogan & Features */}
        <div className="my-auto max-w-md relative z-10">
          <span className="text-bumble-charcoal font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-full bg-black/5 border border-black/10 inline-block mb-4 shadow-sm">
            Welcome to the future of connection
          </span>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-none mb-6 text-bumble-charcoal">
            Where sparks meet{' '}
            <span className="text-bumble-red">
              elegance.
            </span>
          </h2>
          <p className="text-bumble-charcoal/70 text-sm leading-relaxed mb-8">
            Experience dating redefined. Crafted with a premium aesthetic, HoneyGlow brings high-fidelity match-swiping, sleek glassmorphism dashboard structures, and authentic messaging to help you meet quality connections.
          </p>

          {/* Interactive Floating Card Mockup */}
          <div className="bg-white p-4.5 rounded-2xl border border-black/5 shadow-2xl flex items-center gap-4 animate-float-medium max-w-sm text-bumble-charcoal">
            <img
              src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=150"
              alt="Sophia Profile Preview"
              className="w-16 h-16 rounded-xl object-cover border border-black/5"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-sm">Sophia, 24</h4>
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">Product Designer • Stanford</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] bg-bumble-yellow/20 text-slate-800 px-1.5 py-0.5 rounded-md font-bold">96% Match</span>
                <span className="text-[10px] bg-bumble-red/10 text-bumble-red px-1.5 py-0.5 rounded-md font-bold">Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-bumble-charcoal/60 text-xs relative z-10 flex justify-between items-center font-medium">
          <span>&copy; {new Date().getFullYear()} HoneyGlow Inc.</span>
          <div className="flex gap-4">
            <span className="hover:text-bumble-charcoal cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-bumble-charcoal cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>

      </div>

      {/* Right Pane - Form Container */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10 bg-white border-l border-slate-200/30">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

    </div>
  );
};

export default AuthLayout;
