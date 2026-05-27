import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../redux/slices/authSlice';
import AuthLayout from '../layouts/AuthLayout';
import { Mail, Lock, User, Calendar, MapPin, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Auth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    age: '',
    location: 'San Francisco, CA'
  });
  
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!isLoginMode) {
      if (!formData.username) newErrors.username = 'Name is required';
      if (!formData.age) newErrors.age = 'Age is required';
      if (formData.age && (parseInt(formData.age) < 18)) {
        newErrors.age = 'Must be 18 or older to join';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      dispatch(login({ username: formData.username || formData.email.split('@')[0] }));
      navigate('/'); // Send back to landing page after login, without redirecting to dashboard
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel-light p-8 rounded-3xl border border-slate-200/80 shadow-2xl relative overflow-hidden text-bumble-charcoal"
      >
        {/* Top Bumble Yellow Border Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-bumble-yellow" />
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black tracking-tight mb-2">
            {isLoginMode ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-500 text-xs font-semibold">
            {isLoginMode 
              ? 'Enter your credentials to access your HoneyGlow lounge' 
              : 'Fill in your details to start meeting verified singles'
            }
          </p>
        </div>

        {/* Tab Selector (Light themed) */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200/60">
          <button
            type="button"
            onClick={() => { setIsLoginMode(true); setErrors({}); }}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all duration-300 cursor-pointer ${
              isLoginMode 
                ? 'bg-bumble-charcoal text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setIsLoginMode(false); setErrors({}); }}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all duration-300 cursor-pointer ${
              !isLoginMode 
                ? 'bg-bumble-charcoal text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <AnimatePresence mode="wait">
            {!isLoginMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Username Input (Signup Only) */}
                <div>
                  <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1.5 ml-1">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="e.g. Liam"
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm glass-input-light text-bumble-charcoal"
                    />
                  </div>
                  {errors.username && <p className="text-rose-500 text-[10px] mt-1 ml-1">{errors.username}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Age Input (Signup Only) */}
                  <div>
                    <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1.5 ml-1">
                      Age
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        placeholder="e.g. 24"
                        className="w-full pl-11 pr-4 py-3 rounded-xl text-sm glass-input-light text-bumble-charcoal"
                      />
                    </div>
                    {errors.age && <p className="text-rose-500 text-[10px] mt-1 ml-1">{errors.age}</p>}
                  </div>

                  {/* Location Input (Signup Only) */}
                  <div>
                    <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1.5 ml-1">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="SF, CA"
                        className="w-full pl-11 pr-4 py-3 rounded-xl text-sm glass-input-light text-bumble-charcoal"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Input */}
          <div>
            <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1.5 ml-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm glass-input-light text-bumble-charcoal"
              />
            </div>
            {errors.email && <p className="text-rose-500 text-[10px] mt-1 ml-1">{errors.email}</p>}
          </div>

          {/* Password Input */}
          <div>
            <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1.5 ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm glass-input-light text-bumble-charcoal"
              />
            </div>
            {errors.password && <p className="text-rose-500 text-[10px] mt-1 ml-1">{errors.password}</p>}
          </div>

          {isLoginMode && (
            <div className="text-right">
              <span className="text-[11px] text-bumble-red hover:text-red-600 cursor-pointer font-bold">
                Forgot password?
              </span>
            </div>
          )}

          {/* Submit Button (Matching Bumble Slogan CTA Black shape) */}
          <button
            type="submit"
            className="w-full py-3.5 mt-2 rounded-xl text-xs uppercase tracking-widest font-black bg-bumble-charcoal text-white hover:bg-black shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
          >
            {isLoginMode ? 'Access Lounge' : 'Create Profile'}
            <Sparkles className="w-4.5 h-4.5 group-hover:animate-pulse" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400 font-semibold">
          By signing in, you agree to our{' '}
          <span className="text-slate-500 hover:text-slate-800 cursor-pointer underline">Community Rules</span> and{' '}
          <span className="text-slate-500 hover:text-slate-800 cursor-pointer underline">Terms of Use</span>.
        </div>
      </motion.div>
    </AuthLayout>
  );
};

export default Auth;
