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
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = useSelector((state) => state.ui.activeTab);
  const user = useSelector((state) => state.auth.user);
  const notifications = useSelector((state) => state.notification.items);
  const unreadNotifCount = useSelector((state) => state.notification.unreadCount);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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
    if (path && ['home', 'swipe', 'chat', 'membership', 'profile', 'settings'].includes(path)) {
      dispatch(setActiveTab(path));
    }
  }, [location.pathname, dispatch]);

  const navItems = [
    { id: 'swipe', label: 'Discover', icon: Heart, path: '/swipe' },
    { id: 'chat', label: 'Conversations', icon: MessageSquare, path: '/chat' },
    { id: 'membership', label: 'Go Premium', icon: Sparkles, path: '/membership', premium: true },
    { id: 'profile', label: 'My Profile', icon: User, path: '/profile' },
  ];

  const handleNavClick = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully!");
    navigate('/auth');
  };

  return (
    <>
    <div className="min-h-screen flex flex-col bg-white text-bumble-charcoal font-sans relative overflow-x-hidden">


      {/* HORIZONTAL NAVBAR (Ultra Clean Website Navbar Style) */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-4 md:px-8 py-3 md:py-4.5 flex items-center justify-between shadow-sm">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick('/')}>
          <span className="font-black text-xl tracking-tight text-bumble-charcoal">
            Inakkam
          </span>
        </div>

        {/* Desktop Navigation Links (Elegant Spaced Style like Bumble.com) */}
        <nav className="hidden lg:flex items-center gap-9">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                className={`text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer flex items-center gap-1.5 relative py-2
                  ${isActive
                    ? 'text-bumble-charcoal'
                    : 'text-slate-400 hover:text-bumble-charcoal'
                  }`}
              >
                <span>{item.label}</span>
                {item.premium && (
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-bumble-yellow/15 text-bumble-charcoal uppercase tracking-wider scale-90">
                    Pro
                  </span>
                )}
                {/* Underline for active state */}
                {isActive && (
                  <motion.div 
                    layoutId="activeNavLine"
                    className="absolute bottom-0 inset-x-0 h-0.75 bg-bumble-yellow rounded-full" 
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Stats, Notifications, Avatar Panel */}
        <div className="flex items-center gap-4 relative">
          
          {/* Likes counter badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-bumble-red/10 text-bumble-red border border-bumble-red/5">
            <Heart className="w-3.5 h-3.5 fill-current animate-pulse" />
            <span>{user?.likesCount || 14} Likes</span>
          </div>

          {/* Notification bell widget */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-full border border-slate-100 bg-white transition-all duration-300 relative hover:bg-slate-50 text-slate-500 hover:text-bumble-charcoal cursor-pointer shadow-sm"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-0 right-0 w-4.5 h-4.5 bg-bumble-red text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-bounce">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            <AnimatePresence>
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute right-0 mt-3.5 w-80 sm:w-96 rounded-2xl shadow-2xl border z-50 overflow-hidden bg-white border-slate-100 text-bumble-charcoal"
                  >
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Notifications</h3>
                      {unreadNotifCount > 0 && (
                        <span className="text-[10px] bg-bumble-yellow/15 text-bumble-charcoal font-bold px-2 py-0.5 rounded-full">
                          {unreadNotifCount} unread
                        </span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">
                          No notifications yet! Get swiping!
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            onClick={() => {
                              dispatch(markAsRead(notif.id));
                            }}
                            className={`p-3.5 transition-colors cursor-pointer flex gap-3 text-xs
                              ${!notif.read
                                ? 'bg-bumble-yellow/5 hover:bg-bumble-yellow/10'
                                : 'hover:bg-slate-50'
                              }`}
                          >
                            <div className="flex-1 text-left">
                              <p className="font-medium text-bumble-charcoal leading-relaxed">{notif.text}</p>
                              <span className="text-[10px] text-slate-400 block mt-1">{notif.time}</span>
                            </div>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-bumble-yellow self-center shrink-0" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Avatar with dropdown options */}
          {user && (
            <div className="relative">
              <div 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1 pr-3 rounded-full border border-slate-100 bg-white hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
              >
                <img
                  src={user.images[0]}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-white"
                />
                <span className="text-xs font-black hidden sm:inline-block text-bumble-charcoal">{user.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Profile dropdown drawer */}
              <AnimatePresence>
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2.5 w-56 rounded-2xl shadow-xl border bg-white border-slate-100 z-50 p-2 text-left"
                    >
                      <div className="p-3 border-b border-slate-100 flex flex-col">
                        <span className="font-bold text-xs text-bumble-charcoal flex items-center gap-1">
                          {user.name}, {user.age}
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-current" />
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-wider">
                          {user.membership}
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => {
                          handleNavClick('/profile');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-50 hover:text-bumble-charcoal transition-colors cursor-pointer mt-1"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>My Profile Dashboard</span>
                      </button>

                      <button 
                        onClick={() => {
                          setShowSettingsModal(true);
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-50 hover:text-bumble-charcoal transition-colors cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>Account Settings</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl text-bumble-red hover:bg-rose-50 transition-colors cursor-pointer mt-1 border-t border-slate-100 pt-3"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

        </div>
      </header>

      {/* MAIN CONTENT PORTAL (100% FULL-WIDTH CAPABLE VIEWPORT) */}
      <main className="flex-grow w-full flex flex-col z-10 relative pb-20 lg:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="flex-grow w-full flex flex-col justify-start"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>


      {/* Settings Modal Popup */}
      <AnimatePresence>
        {showSettingsModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
              onClick={() => setShowSettingsModal(false)}
            />
            {/* Modal Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[101] bg-white rounded-[2rem] shadow-2xl border border-slate-100 w-full sm:w-[640px] max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-bumble-yellow flex items-center justify-center">
                    <Settings className="w-5 h-5 text-bumble-charcoal" />
                  </div>
                  <div>
                    <h2 className="font-black text-lg text-bumble-charcoal">Account Settings</h2>
                    <p className="text-xs text-slate-400 font-medium">Manage your preferences</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-bumble-charcoal transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="overflow-y-auto flex-1 px-8 py-6 space-y-8">

                {/* Theme Settings */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-bumble-yellow" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-bumble-charcoal">Aesthetic Theme</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {['light', 'dark', 'gradient-blend'].map((mode) => {
                      const isSelected = themeMode === mode;
                      return (
                        <button
                          key={mode}
                          onClick={() => dispatch(setTheme(mode))}
                          className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer
                            ${isSelected
                              ? 'bg-bumble-charcoal text-white border-transparent shadow-md'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                        >
                          <span>{mode.replace('-', ' ')}</span>
                          {isSelected && <Check className="w-4 h-4 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Privacy & Discovery */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-bumble-charcoal" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-bumble-charcoal">Discovery & Privacy</h3>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Maximum Match Distance</span>
                      <span className="text-bumble-yellow font-extrabold">{distanceValue} miles</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={distanceValue}
                      onChange={(e) => setDistanceValue(parseInt(e.target.value))}
                      className="w-full accent-bumble-yellow cursor-pointer h-1.5 bg-slate-200 rounded-full"
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
                          <span className="text-sm font-bold block text-bumble-charcoal">{toggle.label}</span>
                          <span className="text-xs text-slate-500 block mt-0.5">{toggle.desc}</span>
                        </div>
                        <button
                          onClick={() => setPrivacyToggles(prev => ({ ...prev, [toggle.key]: !prev[toggle.key] }))}
                          className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 relative shrink-0 cursor-pointer
                            ${privacyToggles[toggle.key] ? 'bg-bumble-yellow' : 'bg-slate-300'}`}
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

                {/* Notifications */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-bumble-red" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-bumble-charcoal">Communication Alerts</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: 'matches', label: 'New Spark Match Alert', desc: 'Receive real-time push alerts when you get a new match.' },
                      { key: 'messages', label: 'Inbound Chat Messages', desc: 'Get notified when a connection sends you a message.' },
                      { key: 'likes', label: 'Likes Dashboard Count', desc: 'Notify me when someone likes my profile.' },
                      { key: 'spotlight', label: 'Spotlight Trends', desc: 'Get updates when your profile is trending locally.' },
                    ].map((toggle) => (
                      <div key={toggle.key} className="flex justify-between items-center gap-4">
                        <div className="text-left max-w-md">
                          <span className="text-sm font-bold block text-bumble-charcoal">{toggle.label}</span>
                          <span className="text-xs text-slate-500 block mt-0.5">{toggle.desc}</span>
                        </div>
                        <button
                          onClick={() => setNotificationToggles(prev => ({ ...prev, [toggle.key]: !prev[toggle.key] }))}
                          className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 relative shrink-0 cursor-pointer
                            ${notificationToggles[toggle.key] ? 'bg-bumble-yellow' : 'bg-slate-300'}`}
                        >
                          <div 
                            className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 transform
                              ${notificationToggles[toggle.key] ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-rose-600" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-rose-500">Security & Account</h3>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-rose-200 p-4 rounded-2xl bg-rose-50/50">
                    <div className="text-left">
                      <span className="text-sm font-bold block text-bumble-charcoal">Temporarily Deactivate</span>
                      <span className="text-xs text-slate-500 block mt-0.5">Pause your profile from discover feeds.</span>
                    </div>
                    <button className="px-4 py-2 rounded-xl text-xs font-bold border border-rose-300 text-rose-500 hover:bg-rose-50/80 transition-colors shrink-0 cursor-pointer">
                      Pause Swipes
                    </button>
                  </div>
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

    {/* Fixed Bottom Nav Bar on Mobile (App Style) — rendered OUTSIDE overflow-hidden root */}
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        backgroundColor: '#ffffff',
        borderTop: '1px solid #f1f5f9',
        boxShadow: '0 -4px 20px -10px rgba(0,0,0,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      className="mobile-bottom-nav"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '64px', padding: '0 8px' }}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
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
                color: isActive ? '#1E1E1E' : '#94a3b8',
                transition: 'all 0.2s',
                position: 'relative',
                padding: 0,
              }}
            >
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <item.icon style={{ width: '22px', height: '22px', strokeWidth: isActive ? 2.5 : 2 }} />
                {item.premium && (
                  <div style={{
                    position: 'absolute', top: '-4px', right: '-6px',
                    width: '8px', height: '8px', backgroundColor: '#FFCB37',
                    borderRadius: '50%', border: '1.5px solid white',
                  }} />
                )}
              </div>
              <span style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.025em',
                opacity: isActive ? 1 : 0.7, transition: 'all 0.2s',
              }}>
                {item.label}
              </span>
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: '32px', height: '3px', backgroundColor: '#FFCB37',
                  borderRadius: '0 0 4px 4px',
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>

    </>
  );
};

export default MainLayout;
