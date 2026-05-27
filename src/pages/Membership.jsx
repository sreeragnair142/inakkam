import React from 'react';
import { useSelector } from 'react-redux';
import { mockPricingPlans } from '../data/mockData';
import { Crown, Sparkles, Check, Flame, ShieldAlert, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const Membership = () => {
  const themeMode = useSelector((state) => state.theme.mode);

  const handleUpgrade = (planName) => {
    // Blast confetti to celebrate premium selection
    confetti({
      particleCount: 100,
      spread: 70,
      colors: ['#FFCB37', '#FF5A5F', '#1E1E1E']
    });
    alert(`Thank you for selecting the ${planName}! This is a frontend demo checkout simulated overlay.`);
  };

  const getContainerClass = () => {
    return 'bg-white text-bumble-charcoal border border-slate-200 shadow-sm';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 text-left">
      
      {/* Premium Luxury Intro Slogan */}
      <div className="text-center space-y-4 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-bumble-yellow/15 border border-bumble-yellow/30 text-bumble-charcoal text-xs font-black uppercase tracking-wider shadow-sm">
          <Crown className="w-4 h-4 text-bumble-yellow fill-current animate-bounce" />
          <span>HoneyGlow Elite Lounge</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-bumble-charcoal">
          Unlock Unlimited{' '}
          <span className="bg-gradient-to-r from-bumble-yellow to-bumble-red bg-clip-text text-transparent">
            Connections
          </span>
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          Skip limits and double your match rate. Upgrade your tier to activate special features, see who likes you, and get highlighted spotlights.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid md:grid-cols-3 gap-6 items-stretch pt-4 select-none">
        {mockPricingPlans.map((plan) => (
          <motion.div
            key={plan.id}
            whileHover={{ y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`rounded-3xl border flex flex-col justify-between p-6 relative overflow-hidden bg-white shadow-lg
              ${plan.isPopular 
                ? 'border-bumble-yellow shadow-2xl scale-[1.03] z-10' 
                : 'border-slate-200'
              }`}
          >
            {/* Top Glow Overlay for Popular option */}
            {plan.isPopular && (
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-bumble-yellow to-bumble-red" />
            )}

            <div>
              {/* Popular Badge */}
              {plan.isPopular && (
                <span className="absolute top-4 right-4 bg-bumble-charcoal text-white font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                  Most Popular
                </span>
              )}

              {/* Title & Slogan */}
              <div className="flex items-center gap-2 mb-2">
                <Crown className={`w-5 h-5 ${plan.isPopular ? 'text-bumble-yellow animate-pulse' : 'text-slate-400'}`} />
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-bumble-charcoal">{plan.name}</h3>
              </div>
              <p className="text-slate-500 text-xs min-h-8 mb-6">{plan.description}</p>

              {/* Pricing Tag */}
              <div className="flex items-baseline gap-1.5 mb-6 text-bumble-charcoal">
                <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                <span className="text-slate-500 text-xs font-semibold">/ {plan.period}</span>
              </div>

              {/* Features list */}
              <ul className="space-y-3.5 border-t border-slate-100 pt-6 text-xs text-slate-600 font-medium">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Upgrade Action Button */}
            <button
              onClick={() => handleUpgrade(plan.name)}
              className={`w-full py-3.5 mt-8 rounded-xl text-xs uppercase tracking-widest font-black transition-all duration-300 cursor-pointer shadow-md
                ${plan.isPopular
                  ? 'bg-bumble-yellow text-bumble-charcoal shadow-bumble-yellow/20 hover:scale-[1.03] active:scale-[0.97]'
                  : 'bg-bumble-charcoal text-white hover:bg-black active:scale-[0.97]'
                }`}
            >
              Select Package
            </button>
          </motion.div>
        ))}
      </div>

      {/* Trust & Guarantee Panel */}
      <div className={`${getContainerClass()} p-6 rounded-3xl flex flex-col sm:flex-row gap-6 items-center justify-between`}>
        <div className="flex gap-4 items-center text-left">
          <div className="w-12 h-12 rounded-2xl bg-bumble-yellow/15 flex items-center justify-center shrink-0 border border-bumble-yellow/30">
            <Award className="w-6 h-6 text-bumble-yellow" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-bumble-charcoal">Cancel subscription anytime</h4>
            <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
              No hidden contracts or cancellation fees. You can downgrade, upgrade, or toggle recurring status right from settings.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] bg-slate-50 text-slate-500 font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl border border-slate-200 shrink-0 shadow-inner">
          <ShieldAlert className="w-4 h-4 text-slate-400" />
          <span>Secure Stripe Checkout</span>
        </div>
      </div>

    </div>
  );
};

export default Membership;
