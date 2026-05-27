import React from 'react';
import { motion } from 'framer-motion';

const GlassButton = ({ children, onClick, className = '', glowColor = 'honey' }) => {
  const getGlow = () => {
    if (glowColor === 'honey') return 'hover:shadow-[0_0_20px_rgba(243,198,35,0.25)]';
    if (glowColor === 'rose') return 'hover:shadow-[0_0_20px_rgba(244,63,94,0.25)]';
    return 'hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]';
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md shadow-md transition-all duration-300 cursor-pointer ${getGlow()} ${className}`}
    >
      {children}
    </motion.button>
  );
};

export default GlassButton;
