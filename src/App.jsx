import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './redux/store';
import AppRoutes from './routes';

import { Toaster } from 'react-hot-toast';

function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-bumble-yellow flex flex-col items-center justify-center overflow-hidden"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
        className="flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-bumble-charcoal rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-black/20 relative">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-bumble-charcoal rounded-[2rem] opacity-50 blur-xl"
          />
          <Flame className="w-12 h-12 text-bumble-yellow relative z-10" />
        </div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl font-black text-bumble-charcoal tracking-tight"
        >
          Inakkam
        </motion.h1>
      </motion.div>
    </motion.div>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading sequence
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          {isLoading && <SplashScreen key="splash" />}
        </AnimatePresence>

        {!isLoading && (
          <>
            <AppRoutes />
            <Toaster position="top-center" />
          </>
        )}
      </BrowserRouter>
    </Provider>
  );
}

export default App;
