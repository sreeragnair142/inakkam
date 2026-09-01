import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  CheckCircle2, MapPin, Sparkles, Image as ImageIcon, Heart, Award,
  MessageSquare, HelpCircle, Camera, User, Wallet, Briefcase, GraduationCap,
  Globe, BookHeart, Ruler, Star, Dumbbell, Eye, Crown, ShieldCheck, X,
  LogOut, Settings as SettingsIcon, AlertCircle, Edit3, Share2, Flame,
  Coffee, Compass, Zap, ArrowUpRight, ChevronRight, Check, Send, Shield,
  BadgeCheck, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VerificationCard } from '../components/VerificationStatus';
import HostProgramModal from '../components/HostProgramModal';
import { fetchVerificationStatus } from '../redux/slices/verificationSlice';
import { uploadUserPhoto, updateUserProfile, logout } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedUserId = useSelector((state) => state.user.selectedUserId);
  const discoveredUsers = useSelector((state) => state.user.discoveredUsers);
  const authUser = useSelector((state) => state.auth.user);
  const { status: verificationStatus } = useSelector((state) => state.verification);
  const [activeTab, setActiveTab] = useState('about');
  const [viewSelf, setViewSelf] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showHostModal, setShowHostModal] = useState(false);
  const [hostModalTab, setHostModalTab] = useState('overview');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully!');
    navigate('/auth');
  };

  const openEditModal = () => {
    setEditForm({
      name: authUser?.name || '',
      age: authUser?.age || '',
      bio: authUser?.bio || '',
      work: authUser?.work || '',
      education: authUser?.education || '',
      height: authUser?.height || '',
      zodiac: authUser?.zodiac || '',
      exercise: authUser?.exercise || '',
      relationship: authUser?.relationship || '',
      religion: authUser?.religion || '',
      gender: authUser?.gender || '',
      interests: (authUser?.interests || []).join(', '),
      languages: (authUser?.languages || []).join(', '),
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        name: editForm.name,
        age: editForm.age ? Number(editForm.age) : undefined,
        bio: editForm.bio,
        work: editForm.work,
        education: editForm.education,
        height: editForm.height,
        zodiac: editForm.zodiac,
        exercise: editForm.exercise,
        relationship: editForm.relationship,
        religion: editForm.religion,
        gender: editForm.gender,
        interests: editForm.interests ? editForm.interests.split(',').map(s => s.trim()).filter(Boolean) : [],
        languages: editForm.languages ? editForm.languages.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      // Remove undefined values
      Object.keys(payload).forEach(k => { if (payload[k] === undefined || payload[k] === '') delete payload[k]; });
      await dispatch(updateUserProfile(payload)).unwrap();
      toast.success('Profile updated successfully!');
      setShowEditModal(false);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    const toastId = toast.loading('Uploading photo...');
    try {
      await dispatch(uploadUserPhoto(formData)).unwrap();
      toast.success('Photo uploaded successfully!', { id: toastId });
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to upload photo', { id: toastId });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    dispatch(fetchVerificationStatus());
  }, [dispatch]);

  const profileUser = viewSelf
    ? authUser
    : (discoveredUsers.find(u => u.id === selectedUserId) || authUser);

  if (!profileUser) {
    return (
      <div className="p-12 text-center text-slate-400 min-h-screen flex flex-col items-center justify-center">
        <User className="w-12 h-12 text-slate-300 mb-3" />
        <span className="font-semibold text-slate-600">No profile selected. Go to explore to view matches.</span>
      </div>
    );
  }

  const displayLocation = typeof profileUser.location === 'string' ? profileUser.location : 'Nearby';

  // Extract images
  const userImages = profileUser.images?.length
    ? profileUser.images
    : (profileUser.photos?.map(p => typeof p === 'string' ? p : p.url) || []);

  const heroImg = userImages[selectedPhotoIndex] || userImages[0] || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600';

  const isVerified = viewSelf
    ? (verificationStatus === 'VERIFIED')
    : (profileUser?.verificationStatus === 'VERIFIED' || profileUser?.verified === true);

  const tabs = [
    { id: 'about', label: 'About', icon: User },
    { id: 'media', label: 'Gallery', icon: ImageIcon, badge: userImages.length },
    { id: 'prompts', label: 'Prompts', icon: MessageSquare },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'verification', label: 'Verification', icon: ShieldCheck, verified: isVerified },
  ];

  const stats = [
    { icon: Heart, value: profileUser.popularityScore || '92%', label: 'Popularity', color: 'from-rose-500 to-pink-500', bg: 'bg-rose-50' },
    { icon: Flame, value: profileUser.matchesCount || 8, label: 'Matches', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
    { icon: Eye, value: profileUser.profileViews || 124, label: 'Views', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' },
    { icon: Sparkles, value: profileUser.likesCount || 37, label: 'Likes', color: 'from-purple-500 to-indigo-500', bg: 'bg-purple-50' },
  ];

  const detailChips = [
    { icon: '📏', label: 'Height', text: profileUser.height || "5'9\"", bg: 'bg-white', textCol: 'text-slate-700' },
    { icon: '✨', label: 'Zodiac', text: profileUser.zodiac || 'Leo', bg: 'bg-amber-50/80', textCol: 'text-amber-800' },
    { icon: '🏃', label: 'Lifestyle', text: profileUser.exercise || 'Active', bg: 'bg-emerald-50/80', textCol: 'text-emerald-800' },
    { icon: '❤️', label: 'Looking for', text: profileUser.relationship || 'Dating', bg: 'bg-pink-50/80', textCol: 'text-[#D51659]' },
    { icon: '🙏', label: 'Beliefs', text: profileUser.religion || 'Spiritual', bg: 'bg-purple-50/80', textCol: 'text-purple-800' },
  ];

  return (
    <div className="w-full min-h-screen text-left pb-28 lg:pb-16 font-sans bg-[#FAF9F6] text-[#2D2D2D] relative overflow-x-hidden selection:bg-[#D51659] selection:text-white">
      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handlePhotoUpload} />

      {/* ── Ambient Background Glows ── */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-[#D51659]/10 via-[#EC3F7B]/5 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute top-40 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#B44DDC]/8 via-[#D51659]/4 to-transparent blur-[140px] pointer-events-none" />

      {/* ── Dynamic Top Hero Cover Header ── */}
      <div className="relative w-full h-[140px] sm:h-[180px] lg:h-[220px] overflow-hidden">
        {/* Blurred dynamic backdrop image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105"
          style={{
            backgroundImage: `url('${heroImg}')`,
            filter: 'blur(35px) brightness(0.7) saturate(1.3)',
          }}
        />
        {/* Soft gradient blend overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#FAF9F6]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#D51659]/15 via-transparent to-[#B44DDC]/15" />
      </div>

      {/* ── Main Container ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-12 sm:-mt-16 lg:-mt-20 z-20">

        {/* ── View Toggle Bar (Match View vs My Profile) — Positioned safely below navbar ── */}
        <div className="flex items-center justify-end mb-4">
          <div className="inline-flex items-center p-1 rounded-full bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-md">
            <button
              onClick={() => setViewSelf(false)}
              className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                !viewSelf
                  ? 'bg-gradient-to-r from-[#D51659] to-[#EC3F7B] text-white shadow-md shadow-[#D51659]/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Match View</span>
            </button>
            <button
              onClick={() => setViewSelf(true)}
              className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                viewSelf
                  ? 'bg-gradient-to-r from-[#D51659] to-[#EC3F7B] text-white shadow-md shadow-[#D51659]/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>My Profile</span>
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            HERO CARD (Unified Responsive Luxury Card)
           ══════════════════════════════════════════════════════ */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl sm:rounded-[2.5rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden mb-8 lg:mb-10 transition-all">
          <div className="flex flex-col lg:flex-row">

            {/* Left: Editorial Portrait Showcase */}
            <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 p-4 sm:p-6 lg:p-6 flex flex-col justify-between">
              <div className="relative aspect-[4/5] sm:aspect-[4/4.8] lg:aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl group border border-slate-100 bg-slate-100">
                <img
                  src={heroImg}
                  alt={profileUser.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Verification Badge Over Image */}
                {isVerified && (
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 text-xs font-black bg-white/90 backdrop-blur-md text-emerald-800 px-3 py-1.5 rounded-full border border-emerald-100 shadow-lg">
                    <BadgeCheck className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                    <span>Verified</span>
                  </div>
                )}

                {/* Photo Thumbnail Selector Indicator */}
                {userImages.length > 1 && (
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                    <div className="flex gap-1.5 pointer-events-auto">
                      {userImages.slice(0, 5).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedPhotoIndex(idx)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            selectedPhotoIndex === idx
                              ? 'w-6 bg-white shadow-md'
                              : 'w-2 bg-white/50 hover:bg-white/80'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-white/90 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full">
                      {selectedPhotoIndex + 1}/{userImages.length}
                    </span>
                  </div>
                )}

                {/* Upload Action Button for Self */}
                {viewSelf && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white text-slate-700 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-md border border-white"
                    title="Change Profile Photo"
                  >
                    <Camera className="w-4 h-4 text-[#D51659]" />
                  </button>
                )}
              </div>

              {/* Photo Thumbnails Row */}
              {userImages.length > 1 && (
                <div className="hidden sm:flex gap-2.5 mt-3.5 overflow-x-auto no-scrollbar py-1">
                  {userImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        selectedPhotoIndex === idx
                          ? 'border-[#D51659] scale-105 shadow-md shadow-[#D51659]/20 ring-2 ring-[#D51659]/20'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {viewSelf && userImages.length < 6 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#D51659] flex items-center justify-center text-slate-400 hover:text-[#D51659] transition-all shrink-0 cursor-pointer bg-white"
                      title="Add Photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right: Rich Profile Narrative & Highlights */}
            <div className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
              <div>
                {/* Header: Name, Age, Status, Location */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#2D2D2D]">
                        {profileUser.name}
                        {profileUser.age && <span className="text-slate-400 font-bold ml-2.5">· {profileUser.age}</span>}
                      </h1>
                      <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/30" title="Online Active" />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-slate-500 text-sm font-semibold mt-2">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-4 h-4 text-[#D51659]" />
                        {displayLocation}
                      </span>
                      {profileUser.gender && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{profileUser.gender}</span>
                        </>
                      )}
                      {profileUser.work && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            {profileUser.work}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions Header Bar */}
                  <div className="flex items-center gap-2.5">
                    {viewSelf ? (
                      <button
                        onClick={openEditModal}
                        className="px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-white hover:bg-slate-50 text-slate-800 transition-all border border-slate-200 shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#D51659]" />
                        <span>Edit Profile</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate('/chat')}
                        className="px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-white hover:bg-slate-50 text-slate-800 transition-all border border-slate-200 shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#D51659]" />
                        <span>Chat</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Bio Block */}
                <div className="mt-5">
                  <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium">
                    {profileUser.bio || 'Living life one conversation at a time. Looking to make authentic connections.'}
                  </p>
                </div>

                {/* Lifestyle Chips */}
                <div className="flex flex-wrap gap-2.5 mt-6">
                  {detailChips.map((chip, idx) => (
                    <div
                      key={idx}
                      className={`px-3.5 py-2 rounded-2xl ${chip.bg} ${chip.textCol} text-xs font-bold border border-slate-200/80 shadow-xs flex items-center gap-1.5 transition-transform hover:scale-105`}
                    >
                      <span>{chip.icon}</span>
                      <span className="text-slate-400 font-medium text-[11px]">{chip.label}:</span>
                      <span>{chip.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom: Action CTA + Stats Grid */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 mt-8 pt-6 border-t border-slate-100">
                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {viewSelf ? (
                    <>
                      <button
                        onClick={() => navigate('/wallet')}
                        className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#D51659] to-[#EC3F7B] text-white shadow-lg shadow-[#D51659]/30 hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Wallet className="w-4 h-4" />
                        <span>Coins Wallet</span>
                      </button>
                      <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title="Log Out"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          toast.success(`Spark sent to ${profileUser.name}! ✨`);
                        }}
                        className="flex-1 sm:flex-initial px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-[#D51659] to-[#EC3F7B] text-white shadow-lg shadow-[#D51659]/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 fill-current" />
                        <span>Send Spark</span>
                      </button>
                      <button
                        onClick={() => navigate('/chat')}
                        className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <MessageSquare className="w-4 h-4 text-slate-500" />
                        <span>Message</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Metric Badges */}
                <div className="grid grid-cols-4 gap-2 sm:gap-4 p-2 sm:p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                  {stats.map((s, idx) => (
                    <div key={idx} className="text-center px-2 py-1">
                      <div className={`w-7 h-7 mx-auto rounded-lg ${s.bg} flex items-center justify-center mb-1`}>
                        <s.icon className={`w-3.5 h-3.5 bg-gradient-to-r ${s.color} bg-clip-text text-transparent`} />
                      </div>
                      <span className="text-base sm:text-lg font-black text-slate-800 block leading-tight">
                        {s.value}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            PILL TABS NAVIGATION
           ══════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-center sm:justify-start mb-8">
          <div className="inline-flex gap-1.5 p-1.5 rounded-full bg-white/90 backdrop-blur-xl border border-slate-200 shadow-sm max-w-full overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-5 sm:px-7 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'text-white shadow-md shadow-[#D51659]/30'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeProfileTabPill"
                      className="absolute inset-0 bg-gradient-to-r from-[#D51659] via-[#E11D48] to-[#EC3F7B] rounded-full z-0"
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    />
                  )}
                  <tab.icon className="w-4 h-4 relative z-10 shrink-0" />
                  <span className="relative z-10">{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                  {tab.verified && (
                    <BadgeCheck className="w-3.5 h-3.5 relative z-10 text-emerald-300 fill-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            TAB CONTENTS
           ══════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* ── 1. ABOUT TAB ── */}
            {activeTab === 'about' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Left (2 cols): Bio Story & Languages & Personal Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Bio Card */}
                  <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center text-[#D51659]">
                        <BookHeart className="w-4 h-4" />
                      </div>
                      <h3 className="font-black text-xl text-[#2D2D2D]">About Me</h3>
                    </div>
                    <p className="text-base sm:text-lg leading-relaxed text-slate-600 font-medium">
                      {profileUser.bio || 'No bio written yet. Discover more about this profile through chat!'}
                    </p>

                    {/* Languages Spoken */}
                    {profileUser.languages?.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-slate-100">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">
                          Languages Spoken
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {profileUser.languages.map((lang, idx) => (
                            <span
                              key={idx}
                              className="px-4 py-2 rounded-2xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1.5 hover:bg-slate-100 transition-colors"
                            >
                              <Globe className="w-3.5 h-3.5 text-[#D51659]" />
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Interests & Passions */}
                  <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <h3 className="font-black text-xl text-[#2D2D2D]">Passions & Interests</h3>
                      </div>
                      <span className="text-xs font-bold text-slate-400">
                        {profileUser.interests?.length || 0} topics
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {profileUser.interests?.length > 0 ? (
                        profileUser.interests.map((interest, idx) => (
                          <span
                            key={idx}
                            className="px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-slate-50 border border-slate-200 text-slate-700 hover:border-[#D51659]/40 hover:bg-[#D51659]/5 hover:text-[#D51659] transition-all cursor-default shadow-2xs"
                          >
                            #{interest}
                          </span>
                        ))
                      ) : (
                        <p className="text-slate-400 italic text-sm">No interests added yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right (1 col): Professional & Education & Lifestyle Overview */}
                <div className="space-y-6">
                  {/* Career & Education */}
                  <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <h3 className="font-black text-lg text-[#2D2D2D]">Background</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-white text-slate-600 shadow-2xs">
                          <Briefcase className="w-4 h-4 text-[#D51659]" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                            Occupation
                          </span>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">
                            {profileUser.work || 'Not specified'}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-white text-slate-600 shadow-2xs">
                          <GraduationCap className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                            Education
                          </span>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">
                            {profileUser.education || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Safety & Verification Status Box */}
                  <div className="bg-gradient-to-br from-[#D51659]/5 via-purple-500/5 to-transparent rounded-3xl p-6 sm:p-8 border border-[#D51659]/20 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#D51659]/10 flex items-center justify-center text-[#D51659]">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-base text-slate-900">Inakkam Verified</h4>
                        <span className="text-xs text-slate-500 font-medium">Safe & Authenticated</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium mt-2">
                      {isVerified
                        ? 'This user has verified their identity with KYC photo ID authentication.'
                        : 'Verification gives your profile a Verified badge and unlocks host rewards.'}
                    </p>
                    {viewSelf && !isVerified && (
                      <button
                        onClick={() => navigate('/kyc-verification')}
                        className="mt-4 w-full py-2.5 rounded-xl bg-[#D51659] text-white text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer shadow-md shadow-[#D51659]/20"
                      >
                        Get Verified
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── 2. GALLERY TAB ── */}
            {activeTab === 'media' && (
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-black text-2xl text-[#2D2D2D]">Photo Gallery</h3>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                      Visual moments and lifestyle captures
                    </p>
                  </div>
                  {viewSelf && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-[#D51659] text-white shadow-md shadow-[#D51659]/30 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Upload Photo</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {userImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className="aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden shadow-md group relative cursor-pointer border border-slate-100 bg-slate-100"
                    >
                      <img
                        src={img}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                        <span className="text-white text-xs font-black">Photo {idx + 1}</span>
                        <Eye className="w-4 h-4 text-white/80" />
                      </div>
                    </div>
                  ))}

                  {/* Add Photo Slot for Self */}
                  {userImages.length < 9 && viewSelf && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-[4/5] rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-300 hover:border-[#D51659] bg-slate-50 hover:bg-[#D51659]/5 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer text-slate-400 hover:text-[#D51659] group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider">Add Photo</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── 3. PROMPTS TAB ── */}
            {activeTab === 'prompts' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {profileUser.prompts && profileUser.prompts.length > 0 ? (
                  profileUser.prompts.map((prompt, idx) => (
                    <div
                      key={idx}
                      className="bg-white/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-sm border border-white hover:border-[#D51659]/30 hover:shadow-md transition-all relative overflow-hidden group"
                    >
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#D51659] to-[#EC3F7B]" />
                      <div className="flex items-center gap-2 mb-3">
                        <MessageCircle className="w-4 h-4 text-[#D51659]" />
                        <span className="text-xs text-slate-400 font-black uppercase tracking-widest">
                          {prompt.question}
                        </span>
                      </div>
                      <p className="text-lg sm:text-2xl font-serif italic font-bold text-slate-800 leading-relaxed mt-2">
                        "{prompt.answer}"
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="lg:col-span-2 bg-white/90 backdrop-blur-xl p-12 text-center rounded-3xl shadow-sm border border-white">
                    <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h4 className="font-black text-lg text-slate-700">No Custom Prompts Yet</h4>
                    <p className="text-slate-400 text-sm font-medium mt-1">
                      Prompts spark memorable conversations. Add prompts to showcase your personality!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── 4. WALLET TAB ── */}
            {activeTab === 'wallet' && (
              <div className="space-y-6">
                {/* Balance Hero Card */}
                <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden border border-white/10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#D51659]/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-[#EC3F7B]">
                        Inakkam Coins
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">Active Balance</h3>
                      <p className="text-slate-400 text-sm font-medium mt-1">
                        Use coins to unlock direct chats, send sparks, and boost your profile.
                      </p>
                    </div>

                    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/15 shadow-inner">
                      <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
                      <div>
                        <span className="text-3xl sm:text-4xl font-black text-white leading-none block">
                          {authUser?.coins !== undefined ? authUser.coins : 450}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Coins Available
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coin Action Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <button
                    onClick={() => navigate('/wallet')}
                    className="p-6 rounded-3xl bg-gradient-to-br from-[#D51659] to-[#EC3F7B] text-white shadow-lg shadow-[#D51659]/30 hover:scale-[1.02] active:scale-95 transition-all text-left group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-black text-lg">Top Up Coins</h4>
                    <p className="text-xs text-white/80 font-medium mt-1">
                      Choose from flexible coin packages with instant activation.
                    </p>
                  </button>

                  <button
                    onClick={() => navigate('/wallet')}
                    className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-white shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all text-left group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-4 text-amber-600 group-hover:scale-110 transition-transform">
                      <Crown className="w-6 h-6" />
                    </div>
                    <h4 className="font-black text-lg text-slate-800">VIP Membership</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Enjoy unlimited sparks, read receipts, and priority matching.
                    </p>
                  </button>

                  <button
                    onClick={() => navigate('/wallet')}
                    className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-white shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all text-left group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-4 text-purple-600 group-hover:scale-110 transition-transform">
                      <Award className="w-6 h-6" />
                    </div>
                    <h4 className="font-black text-lg text-slate-800">Transaction History</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      View all coin purchases, rewards earned, and withdrawals.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* ── 5. VERIFICATION TAB ── */}
            {activeTab === 'verification' && (
              <div className="space-y-6">
                <VerificationCard status={verificationStatus} />

                {verificationStatus === 'NOT_VERIFIED' && (
                  <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white shadow-sm">
                    <h3 className="font-black text-xl text-[#2D2D2D] mb-4">Why Get Verified?</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { icon: '💬', title: 'Earn Through Chat', desc: 'Get paid for every chat session you participate in.' },
                        { icon: '📩', title: 'Receive Paid Requests', desc: 'Accept paid chat requests from other users.' },
                        { icon: '💰', title: 'Withdraw Earnings', desc: 'Transfer your earnings directly to your bank or UPI.' },
                        { icon: '🛡️', title: 'Verified Badge', desc: 'Display a Verified Customer badge on your profile.' },
                      ].map((b) => (
                        <div key={b.title} className="flex items-start gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <span className="text-2xl">{b.icon}</span>
                          <div>
                            <p className="text-sm font-bold text-[#2D2D2D]">{b.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{b.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => navigate('/kyc-verification')}
                        className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-[#D51659] to-[#b44ddc] text-white font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-[#D51659]/30 flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" /> Become a Verified Host
                      </button>

                      <button
                        onClick={() => { setHostModalTab('inquiry'); setShowHostModal(true); }}
                        className="flex-1 py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" /> Inquire with Staff
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>

      {/* ══════════════════════════════════════════════════════
          EDIT PROFILE MODAL
         ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-[2rem] w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#2D2D2D]">Edit Profile</h2>
                  <p className="text-xs text-slate-400 font-medium">Update your bio and details</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-[#2D2D2D]" />
                </button>
              </div>

              {/* Form Fields */}
              <div className="p-6 space-y-4">
                {[
                  { key: 'name', label: 'Name', type: 'text', placeholder: 'Your name' },
                  { key: 'age', label: 'Age', type: 'number', placeholder: '25' },
                  { key: 'bio', label: 'Bio', type: 'textarea', placeholder: 'Tell people about yourself...' },
                  { key: 'work', label: 'Work', type: 'text', placeholder: 'Your job title or company' },
                  { key: 'education', label: 'Education', type: 'text', placeholder: 'Your school or university' },
                  { key: 'height', label: 'Height', type: 'text', placeholder: "5'9\"" },
                  { key: 'gender', label: 'Gender', type: 'text', placeholder: 'Male, Female, Non-binary...' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-[10px] font-black text-[#2D2D2D]/60 uppercase tracking-widest block mb-1.5 ml-1">
                      {field.label}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={editForm[field.key] || ''}
                        onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 text-sm font-medium text-[#2D2D2D] placeholder-slate-400 focus:border-[#D51659] focus:bg-white focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all resize-none"
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={editForm[field.key] || ''}
                        onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 text-sm font-medium text-[#2D2D2D] placeholder-slate-400 focus:border-[#D51659] focus:bg-white focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all"
                      />
                    )}
                  </div>
                ))}

                {/* Select fields */}
                <div>
                  <label className="text-[10px] font-black text-[#2D2D2D]/60 uppercase tracking-widest block mb-1.5 ml-1">Zodiac</label>
                  <select
                    value={editForm.zodiac || ''}
                    onChange={(e) => setEditForm({ ...editForm, zodiac: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 text-sm font-medium text-[#2D2D2D] focus:border-[#D51659] focus:bg-white focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="">Select zodiac</option>
                    {['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'].map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-[#2D2D2D]/60 uppercase tracking-widest block mb-1.5 ml-1">Exercise</label>
                  <select
                    value={editForm.exercise || ''}
                    onChange={(e) => setEditForm({ ...editForm, exercise: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 text-sm font-medium text-[#2D2D2D] focus:border-[#D51659] focus:bg-white focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="">Select activity level</option>
                    {['Never', 'Sometimes', 'Often', 'Active', 'Very Active', 'Daily'].map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-[#2D2D2D]/60 uppercase tracking-widest block mb-1.5 ml-1">Relationship Goal</label>
                  <input
                    type="text"
                    value={editForm.relationship || ''}
                    onChange={(e) => setEditForm({ ...editForm, relationship: e.target.value })}
                    placeholder="Dating, Friendship, Long-term..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 text-sm font-medium text-[#2D2D2D] placeholder-slate-400 focus:border-[#D51659] focus:bg-white focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-[#2D2D2D]/60 uppercase tracking-widest block mb-1.5 ml-1">Religion</label>
                  <input
                    type="text"
                    value={editForm.religion || ''}
                    onChange={(e) => setEditForm({ ...editForm, religion: e.target.value })}
                    placeholder="Your faith or spiritual belief"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 text-sm font-medium text-[#2D2D2D] placeholder-slate-400 focus:border-[#D51659] focus:bg-white focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-[#2D2D2D]/60 uppercase tracking-widest block mb-1.5 ml-1">Interests (comma separated)</label>
                  <input
                    type="text"
                    value={editForm.interests || ''}
                    onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })}
                    placeholder="Travel, Reading, Music, Fitness..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 text-sm font-medium text-[#2D2D2D] placeholder-slate-400 focus:border-[#D51659] focus:bg-white focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-[#2D2D2D]/60 uppercase tracking-widest block mb-1.5 ml-1">Languages (comma separated)</label>
                  <input
                    type="text"
                    value={editForm.languages || ''}
                    onChange={(e) => setEditForm({ ...editForm, languages: e.target.value })}
                    placeholder="English, Malayalam, Tamil, Hindi..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 text-sm font-medium text-[#2D2D2D] placeholder-slate-400 focus:border-[#D51659] focus:bg-white focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md z-10 px-6 py-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 py-3.5 rounded-xl text-sm font-black text-white cursor-pointer hover:opacity-90 transition-all shadow-lg shadow-[#D51659]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #D51659 0%, #EC3F7B 100%)' }}
                >
                  {saving ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Save Changes</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
          LOGOUT CONFIRMATION MODAL
         ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center mx-auto mb-4 text-rose-600 shadow-sm">
                <LogOut className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-[#2D2D2D]">Log Out of Inakkam?</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                You will need to sign in again to access your active matches, chats, and coin wallet.
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Yes, Log Out</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Host Program Modal */}
      <HostProgramModal
        isOpen={showHostModal}
        onClose={() => setShowHostModal(false)}
        initialTab={hostModalTab}
      />
    </div>
  );
};

export default Profile;
