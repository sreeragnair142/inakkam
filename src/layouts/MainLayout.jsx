import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { setActiveTab } from '../redux/slices/uiSlice';
import { logout } from '../redux/slices/authSlice';
import { setTheme } from '../redux/slices/themeSlice';
import { markAsRead } from '../redux/slices/notificationSlice';
import {
  Flame,
  MessageSquare,
  User,
  Settings,
  Sparkles,
  Bell,
  LogOut,
  Menu,
  X,
  Crown,
  CheckCircle2,
  Heart,
  ChevronDown,
  Palette,
  Eye,
  Shield,
  Trash2,
  Check,
  Home,
  Wallet,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isDarkBg = location.pathname === '/swipe' || location.pathname === '/profile';

  const activeTab = useSelector((state) => state.ui.activeTab);
  const user = useSelector((state) => state.auth.user);
  const isGuest = useSelector((state) => state.auth.isGuest);
  const notifications = useSelector((state) => state.notification.items);
  const unreadNotifCount = useSelector((state) => state.notification.unreadCount);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Settings local state
  const themeMode = useSelector((state) => state.theme.mode);
  const [privacyToggles, setPrivacyToggles] = useState({
    incognito: false,
    hideAge: false,
    hideLocation: false,
    showOnlineStatus: true,
  });
  const [notificationToggles, setNotificationToggles] = useState({
    matches: true,
    messages: true,
    likes: false,
    spotlight: true,
  });
  const [distanceValue, setDistanceValue] = useState(25);

  useEffect(() => {
    const path = location.pathname.slice(1);
    if (path && ['home', 'swipe', 'explore', 'chat', 'membership', 'profile', 'settings'].includes(path)) {
      dispatch(setActiveTab(path));
    }
  }, [location.pathname, dispatch]);

  // BOTTOM MOBILE NAV ITEMS (Matches 2nd Screenshot)
  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/landing' },
    { id: 'discover', label: 'Discover', icon: Flame, path: '/swipe' },
    { id: 'explore', label: 'Explore', icon: Heart, path: '/explore', isSpecial: true },
    { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/chat' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  // SIDEBAR ITEMS (Matches 1st Screenshot perfectly)
  const sidebarItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/landing' },
    { id: 'discover', label: 'Discover', icon: Flame, path: '/swipe' },
    { id: 'explore', label: 'Explore', icon: Heart, path: '/explore' },
    { id: 'settings', label: 'Settings', icon: Settings, action: () => { setShowSettingsModal(true); setShowSidebar(false); } },
    { id: 'wallet', label: 'Wallet', icon: Wallet, path: '/wallet' },
    { id: 'buy-coin', label: 'Buy Coin', icon: Sparkles, path: '/buy-coin' },
    { id: 'security', label: 'Account & Security', icon: ShieldCheck, path: '/security' },
    { id: 'chat', label: 'User Chat', icon: MessageSquare, path: '/chat' },
  ];

  const handleNavClick = (path) => {
    navigate(path);
    setShowSidebar(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully!");
    navigate('/auth');
  };

  return (
    <>
    <div className="min-h-screen flex flex-col bg-white text-bumble-charcoal font-sans relative overflow-x-hidden">

      {/* BRAND LOGO (Top Left for all screens) */}
      {(() => {
        const isDarkBg = location.pathname === '/swipe' || location.pathname === '/profile';
        return (
          <div className="fixed top-4 left-4 md:top-6 md:left-6 z-40">
            <div 
              onClick={() => handleNavClick('/landing')}
              className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform"
            >
              <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center shadow-md ${isDarkBg ? 'bg-white/20 backdrop-blur-sm' : 'bg-bumble-charcoal'}`}>
                <Flame className="w-4 h-4 text-bumble-yellow animate-pulse" />
              </div>
              <span className={`font-black text-lg md:text-xl tracking-tight ${isDarkBg ? 'text-white/90 drop-shadow-md' : 'text-bumble-charcoal'}`}>
                Inakkam
              </span>
            </div>
          </div>
        );
      })()}

      {(() => {
        const isDarkBg = location.pathname === '/swipe' || location.pathname === '/profile';
        return (
          <header className="fixed top-6 left-0 right-0 z-40 flex items-center justify-center pointer-events-none hidden lg:flex">
            <nav className={`${isDarkBg ? 'bg-black/20 backdrop-blur-md border-white/10' : 'bg-white border-black/5'} px-3 py-2 rounded-full shadow-lg border flex items-center gap-2 pointer-events-auto transition-colors`}>
              {navItems.map((item) => {
                const isActive = activeTab === item.id || (item.id === 'home' && activeTab === 'home');
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.path)}
                    className={`px-5 py-2.5 rounded-full text-xs font-black capitalize transition-all cursor-pointer flex items-center gap-1.5
                      ${isActive
                        ? (isDarkBg ? 'text-white bg-white/20' : 'text-black bg-slate-100')
                        : (isDarkBg ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-black hover:bg-slate-50')
                      }`}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </header>
        );
      })()}

      {/* MOBILE HAMBURGER REMOVED AS REQUESTED */}

      {/* BEAUTIFUL ALIGNED SIDEBAR (Screenshot 1 Match) */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-[#8a8a8a] z-[100] flex flex-col shadow-2xl"
              style={{ backgroundColor: '#898A8E' }} // Closest match to the grey background in screenshot 1
            >
              {/* Profile Header in Sidebar (Optional but good UX) */}
              <div className="p-6 pb-2 pt-8 flex items-center justify-between">
                <button 
                  onClick={() => setShowSidebar(false)}
                  className="p-2 -ml-2 rounded-full hover:bg-black/10 text-white/80 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sidebar Menu List - Beautifully Aligned */}
              <div className="flex flex-col py-6 px-4 gap-2">
                {sidebarItems.map((item, idx) => {
                  const isActive = activeTab === item.id || (item.id === 'home' && activeTab === 'home');
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (item.action) {
                          item.action();
                        } else if (item.path) {
                          handleNavClick(item.path);
                        }
                      }}
                      className={`flex items-center gap-5 px-4 py-3.5 rounded-2xl transition-all cursor-pointer border-none bg-transparent w-full text-left
                        ${isActive ? 'bg-black/10' : 'hover:bg-black/5'}
                      `}
                    >
                      <item.icon 
                        className={`w-[22px] h-[22px] ${isActive ? 'text-[#8423d9]' : 'text-[#2a2c35]'}`} 
                        strokeWidth={2}
                      />
                      <span 
                        className={`text-[15px] font-semibold tracking-wide
                          ${isActive ? 'text-[#8423d9]' : 'text-[#2a2c35]'}`}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT PORTAL (100% FULL-WIDTH CAPABLE VIEWPORT) */}
      <main 
        className="flex-grow w-full flex flex-col z-10 relative pb-20 lg:pb-0 bg-[#f8f9fa]"
        onClickCapture={(e) => {
          if (isGuest) {
            e.stopPropagation();
            e.preventDefault();
            toast("Sign up to unlock all features! ✨", { icon: "🔒" });
            navigate('/auth');
          }
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="flex-grow w-full flex flex-col justify-start"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Settings Modal Popup ... (Rest stays the same but keeping for completeness) */}
      <AnimatePresence>
        {showSettingsModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
              onClick={() => setShowSettingsModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[101] bg-white rounded-[2rem] shadow-2xl border border-slate-100 w-full sm:w-[640px] max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="font-black text-lg text-slate-800">Account Settings</h2>
                    <p className="text-xs text-slate-400 font-medium">Manage your preferences</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="overflow-y-auto flex-1 px-8 py-6 space-y-8">
                {/* Discovery & Privacy */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-slate-800" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Discovery & Privacy</h3>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Maximum Match Distance</span>
                      <span className="text-purple-600 font-extrabold">{distanceValue} miles</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={distanceValue}
                      onChange={(e) => setDistanceValue(parseInt(e.target.value))}
                      className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-full"
                    />
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    {[
                      { key: 'incognito', label: 'Incognito Mode', desc: 'Only show your profile to connections you swiped right on first.' },
                      { key: 'hideAge', label: 'Hide My Age', desc: 'Remove your age badge from discover cards.' },
                      { key: 'hideLocation', label: 'Hide Location', desc: 'Hide distance proximity indicators from matches.' },
                      { key: 'showOnlineStatus', label: 'Active Status Ring', desc: 'Display a green dot when you are currently online.' },
                    ].map((toggle) => (
                      <div key={toggle.key} className="flex justify-between items-center gap-4">
                        <div className="text-left max-w-md">
                          <span className="text-sm font-bold block text-slate-800">{toggle.label}</span>
                          <span className="text-xs text-slate-500 block mt-0.5">{toggle.desc}</span>
                        </div>
                        <button
                          onClick={() => setPrivacyToggles(prev => ({ ...prev, [toggle.key]: !prev[toggle.key] }))}
                          className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 relative shrink-0 cursor-pointer
                            ${privacyToggles[toggle.key] ? 'bg-purple-600' : 'bg-slate-300'}`}
                        >
                          <div 
                            className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 transform
                              ${privacyToggles[toggle.key] ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-rose-300 p-4 rounded-2xl bg-rose-50">
                    <div className="text-left">
                      <span className="text-sm font-bold block text-rose-600">Delete Inakkam Account</span>
                      <span className="text-xs text-slate-500 block mt-0.5">Permanently remove all data, matches, and history.</span>
                    </div>
                    <button className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm">
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Permanently</span>
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>

    {/* Fixed Bottom Nav Bar on Mobile (App Style) */}
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        backgroundColor: isDarkBg ? 'rgba(0,0,0,0.5)' : '#ffffff',
        backdropFilter: isDarkBg ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: isDarkBg ? 'blur(16px)' : 'none',
        borderTop: isDarkBg ? '1px solid rgba(255,255,255,0.1)' : '1px solid #f1f5f9',
        boxShadow: isDarkBg ? 'none' : '0 -4px 20px -10px rgba(0,0,0,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      className="mobile-bottom-nav lg:hidden"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '64px', padding: '0 8px' }}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          
          if (item.isSpecial) {
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                className="flex flex-col items-center justify-center flex-1 h-full relative cursor-pointer border-none bg-transparent"
              >
                <div className={`w-[42px] h-[42px] rounded-full flex items-center justify-center transition-all shadow-md mt-[-10px]
                  ${isActive ? 'bg-purple-600 shadow-purple-600/30 border-2 border-white scale-110' : (isDarkBg ? 'bg-white/10 border-2 border-white/20' : 'bg-white border-2 border-slate-200')}`}
                >
                  <item.icon className={`w-[22px] h-[22px] ${isActive ? 'text-white fill-white' : (isDarkBg ? 'text-white/70' : 'text-slate-400')}`} strokeWidth={isActive ? 0 : 2} />
                </div>
                <span className={`text-[9px] font-bold mt-1 ${isActive ? 'text-purple-600' : (isDarkBg ? 'text-white/70' : 'text-slate-400')}`}>
                  {item.label}
                </span>
              </button>
            );
          }
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                height: '100%',
                gap: '4px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: isActive ? '#9333ea' : (isDarkBg ? 'rgba(255,255,255,0.5)' : '#94a3b8'),
                transition: 'all 0.2s',
                padding: 0,
              }}
            >
              <item.icon style={{ width: '22px', height: '22px', strokeWidth: isActive ? 2.5 : 2 }} />
              <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.025em', transition: 'all 0.2s' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>

    </>
  );
};

export default MainLayout;
