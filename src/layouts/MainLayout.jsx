import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import landscapeLogo from '../assets/landscapelogo.png';
import phoneLogo from '../assets/phoneinakkam.png';
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
  ShieldCheck,
  Coins
} from 'lucide-react';

import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';

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
  const receivedLikes = useSelector((state) => state.user.receivedLikes);
  const receivedLikesCount = receivedLikes ? receivedLikes.length : 0;

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Scroll visibility state
  const scrollRef = useRef(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const { scrollY } = useScroll({ container: scrollRef });

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 50) {
      setIsHeaderVisible(false);
    } else if (latest < previous) {
      setIsHeaderVisible(true);
    }
  });

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
    if (path && ['home', 'swipe', 'likes', 'explore', 'chat', 'membership', 'profile', 'settings'].includes(path)) {
      dispatch(setActiveTab(path));
    }
  }, [location.pathname, dispatch]);

  // BOTTOM MOBILE NAV ITEMS (Floating elevated capsule layout)
  const navItems = [
    { id: 'swipe', label: 'Home', icon: Flame, path: '/swipe' },
    { id: 'likes', label: 'Likes', icon: Heart, path: '/likes' },
    { id: 'explore', label: 'Explore', icon: Sparkles, path: '/explore' },
    { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/chat' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  // SIDEBAR ITEMS
  const sidebarItems = [
    { id: 'swipe', label: 'Home', icon: Flame, path: '/swipe' },
    { id: 'likes', label: 'Likes You', icon: Heart, path: '/likes' },
    { id: 'explore', label: 'Explore', icon: Sparkles, path: '/explore' },
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
      <div
        ref={scrollRef}
        className="h-screen w-full flex flex-col text-[#2D2D2D] font-sans relative overflow-x-hidden overflow-y-auto scroll-smooth"
        style={{ background: 'linear-gradient(135deg, #FFF5F6 0%, #FFFDFD 50%, #FFEBEF 100%)' }}
      >

        {/* BRAND LOGO (Top Left for all screens) — hidden on chat */}
        {(() => {
          if (location.pathname === '/chat') return null;
          const isDarkBg = location.pathname === '/swipe' || location.pathname === '/profile';
          return (
            <div className={`fixed top-4 left-4 md:top-6 md:left-6 z-40 transition-all duration-500 ease-in-out ${isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-[150%] opacity-0'}`}>
              <div
                onClick={() => handleNavClick('/swipe')}
                className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform px-2 py-1"
              >
                <img src={landscapeLogo} alt="Inakkam" className="hidden md:block h-14 w-auto" />
                <img src={landscapeLogo} alt="Inakkam" className="block md:hidden h-8 w-auto" />
              </div>
            </div>
          );
        })()}

        {/* TOP RIGHT PROFILE & COIN BADGE MENU */}
        {(() => {
          if (location.pathname === '/chat') return null;
          const coinBalance = user?.wallet?.balance || 0;
          return (
            <div className={`fixed top-4 right-4 md:top-6 md:right-6 z-50 flex items-center gap-2.5 transition-all duration-500 ease-in-out ${isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-[150%] opacity-0'}`}>
              
              {/* Tokify Style Coin Badge Button */}
              <div
                onClick={() => navigate('/buy-coin')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-[#D51659] text-white cursor-pointer shadow-lg shadow-purple-500/20 hover:scale-105 transition-all border border-white/20"
              >
                <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-slate-900 shadow-xs">
                  <Coins className="w-3.5 h-3.5 fill-current" />
                </div>
                <span className="text-xs font-black tracking-wide">
                  {coinBalance.toLocaleString()}
                </span>
              </div>

              {/* Responsive Profile Menu Trigger (Desktop & Mobile) */}
              <div className="relative">
                <div
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 pr-1.5 md:pr-3 rounded-full border border-white/20 bg-gradient-to-r from-[#D51659] to-[#b44ddc] hover:brightness-110 cursor-pointer shadow-lg transition-all"
                >
                  <div className="relative">
                    <img
                      src={
                        user?.images?.[0] ||
                        user?.photos?.[0]?.url ||
                        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600"
                      }
                      alt={user?.name || "User"}
                      className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover border-2 border-white"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                  </div>
                  <span className="text-xs font-black hidden sm:inline-block text-white max-w-[90px] truncate">
                    {user?.name || "User"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/90" />
                </div>

                {/* Profile Menu Dropdown / Bottom Sheet Modal */}
                <AnimatePresence>
                  {showProfileMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs"
                        onClick={() => setShowProfileMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 mt-2.5 w-64 rounded-3xl shadow-2xl border bg-white/95 backdrop-blur-xl border-slate-100 z-50 p-2.5 text-left"
                      >
                        {/* User info banner in menu */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-[#FFF5F6] border border-slate-100/80 flex items-center gap-3">
                          <img
                            src={
                              user?.images?.[0] ||
                              user?.photos?.[0]?.url ||
                              "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600"
                            }
                            alt={user?.name || "User"}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-xs flex items-center gap-1 text-slate-800 truncate">
                              {user?.name || "User"}, {user?.age || 26}
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#D51659] shrink-0 fill-current" />
                            </span>
                            <span className="text-[9px] text-[#D51659] font-black uppercase tracking-wider mt-0.5 truncate">
                              {user?.membership?.plan || (typeof user?.membership === 'string' ? user?.membership : "Inakkam Elite")}
                            </span>
                          </div>
                        </div>

                        {/* Menu Actions */}
                        <div className="space-y-1 mt-2">
                          <button
                            onClick={() => {
                              navigate("/profile");
                              setShowProfileMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent"
                          >
                            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                              <User className="w-4 h-4" />
                            </div>
                            <span>My Profile</span>
                          </button>

                          <button
                            onClick={() => {
                              navigate("/buy-coin");
                              setShowProfileMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent"
                          >
                            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                              <Coins className="w-4 h-4" />
                            </div>
                            <span>Wallet & Coins</span>
                          </button>

                          <button
                            onClick={() => {
                              setShowSettingsModal(true);
                              setShowProfileMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent"
                          >
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                              <Settings className="w-4 h-4" />
                            </div>
                            <span>Account Settings</span>
                          </button>
                        </div>

                        {/* Premium Logout Button */}
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black rounded-xl text-rose-600 bg-rose-50/70 hover:bg-rose-100/80 transition-all cursor-pointer border border-rose-200/50 shadow-xs"
                          >
                            <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                              <LogOut className="w-4 h-4" />
                            </div>
                            <span>Log Out</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })()}

        {(() => {
          const isChatBg = location.pathname === '/chat';
          if (isChatBg) return null; // Hide header on chat page

          return (
            <header className={`fixed top-6 left-0 right-0 z-40 flex items-center justify-center pointer-events-none hidden lg:flex transition-all duration-500 ease-in-out ${isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-[150%] opacity-0'}`}>
              <nav className="bg-[#D51659] backdrop-blur-md px-3 py-2 rounded-full shadow-lg shadow-[#D51659]/20 border border-[#D51659]/80 flex items-center gap-2 pointer-events-auto transition-colors">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id || (item.id === 'home' && activeTab === 'home');
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.path)}
                      className={`px-5 py-2.5 rounded-full text-xs font-black capitalize transition-all cursor-pointer flex items-center gap-1.5
                      ${isActive
                          ? 'text-[#D51659] bg-white shadow-sm'
                          : 'text-white/80 hover:bg-white/15 hover:text-white'
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
                className="fixed inset-y-0 left-0 w-[280px] bg-[#FCFAF2] z-[100] flex flex-col shadow-2xl border-r border-slate-200"
                style={{ backgroundColor: '#FCFAF2' }}
              >
                {/* Profile Header in Sidebar (Optional but good UX) */}
                <div className="p-6 pb-2 pt-8 flex items-center justify-between">
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-2 -ml-2 rounded-full hover:bg-black/10 text-[#2D2D2D]/80 transition-colors cursor-pointer"
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
                        ${isActive ? 'bg-[#D51659]/10' : 'hover:bg-black/5'}
                      `}
                      >
                        <item.icon
                          className={`w-[22px] h-[22px] ${isActive ? 'text-[#D51659]' : 'text-[#2a2c35]'}`}
                          strokeWidth={2}
                        />
                        <span
                          className={`text-[15px] font-semibold tracking-wide
                          ${isActive ? 'text-[#D51659]' : 'text-[#2a2c35]'}`}
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
          className="flex-grow w-full flex flex-col z-10 relative pb-20 lg:pb-0"
          onClickCapture={(e) => {
            if (isGuest) {
              e.stopPropagation();
              e.preventDefault();
              toast("Sign up to unlock all features! ✨", { icon: "🔒" });
              navigate('/auth', { state: { skipSplash: true } });
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

                  {/* Session & Logout Section */}
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-200 p-4 rounded-2xl bg-slate-50">
                      <div className="text-left">
                        <span className="text-sm font-bold block text-slate-800">Account Session</span>
                        <span className="text-xs text-slate-500 block mt-0.5">Sign out of your active session on this device.</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowSettingsModal(false);
                          handleLogout();
                        }}
                        className="px-5 py-2.5 rounded-xl text-xs font-black bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors flex items-center gap-2 shrink-0 cursor-pointer shadow-xs"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
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

      {/* Elevated Premium Floating Bottom Nav Bar on Mobile */}
      {location.pathname !== '/chat' && (
        <div className="fixed bottom-4 left-3 right-3 sm:left-6 sm:right-6 lg:hidden z-40">
        <nav className="bg-[#D51659]/95 backdrop-blur-xl border border-white/20 shadow-2xl shadow-[#D51659]/30 rounded-full px-2 py-2 flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-full transition-all relative border-none bg-transparent cursor-pointer ${
                  isActive ? 'text-white font-extrabold scale-105' : 'text-white/70 hover:text-white font-medium'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  {item.id === 'likes' && receivedLikesCount > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 bg-white text-[#D51659] text-[9px] font-black rounded-full flex items-center justify-center shadow-md">
                      {receivedLikesCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
      )}


    </>
  );
};

export default MainLayout;
