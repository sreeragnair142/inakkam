import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  CheckCircle2, MapPin, Sparkles, Image as ImageIcon, Heart, Award,
  MessageSquare, HelpCircle, Camera, User, Wallet, Briefcase, GraduationCap,
  Globe, BookHeart, Ruler, Star, Dumbbell, Eye, Crown, ShieldCheck, X,
  LogOut, Settings as SettingsIcon, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VerificationCard } from '../components/VerificationStatus';
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
      <div className="p-8 text-center text-slate-400 min-h-screen">
        No profile selected. Go to dashboard to select a profile.
      </div>
    );
  }

  const displayLocation = typeof profileUser.location === 'string' ? profileUser.location : 'Nearby';

  // Fallback to extract photos if the images array isn't mapped properly yet in Redux
  const userImages = profileUser.images?.length
    ? profileUser.images
    : (profileUser.photos?.map(p => typeof p === 'string' ? p : p.url) || []);

  const heroImg = userImages[0] || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600';

  const isVerified = viewSelf
    ? (verificationStatus === 'VERIFIED')
    : (profileUser?.verificationStatus === 'VERIFIED' || profileUser?.verified === true);

  const tabs = [
    { id: 'about', label: 'About', icon: User },
    { id: 'media', label: 'Gallery', icon: ImageIcon },
    { id: 'prompts', label: 'Prompts', icon: MessageSquare },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'verification', label: 'Verified', icon: ShieldCheck },
  ];

  const stats = [
    { icon: Heart, value: profileUser.popularityScore || '92%', label: 'Popularity', color: 'text-rose-400' },
    { icon: Award, value: profileUser.matchesCount || 8, label: 'Matches', color: 'text-amber-400' },
    { icon: Eye, value: profileUser.profileViews || 124, label: 'Views', color: 'text-cyan-400' },
    { icon: Sparkles, value: profileUser.likesCount || 37, label: 'Likes', color: 'text-purple-400' },
  ];

  const detailChips = [
    { icon: '📏', text: profileUser.height || '5\'9"', bg: 'bg-white', border: 'border-slate-200', text2: 'text-[#2D2D2D]' },
    { icon: '✨', text: profileUser.zodiac || 'Leo', bg: 'bg-blue-550/10', border: 'border-blue-500/20', text2: 'text-blue-700' },
    { icon: '🏃', text: profileUser.exercise || 'Active', bg: 'bg-green-500/10', border: 'border-green-500/20', text2: 'text-green-700' },
    { icon: '❤️', text: profileUser.relationship || 'Dating', bg: 'bg-[#D51659]/10', border: 'border-[#D51659]/20', text2: 'text-[#D51659]' },
    { icon: '🙏', text: profileUser.religion || 'Spiritual', bg: 'bg-orange-500/10', border: 'border-orange-500/20', text2: 'text-orange-700' },
  ];

  return (
    <div className="w-full min-h-screen text-left pb-28 lg:pb-12 font-sans overflow-x-hidden">
      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handlePhotoUpload} />

      {/* BANNER */}
      <div className="relative w-full h-[22vh] lg:h-[32vh] min-h-[160px] lg:min-h-[280px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${heroImg}')`, filter: 'blur(40px) brightness(0.6) saturate(1.4)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FFF5F6]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#D51659]/10 via-transparent to-purple-900/10" />
        {/* View toggle */}
        <div className="absolute top-4 right-4 lg:top-8 lg:right-12 z-20 flex gap-2">
          <button onClick={() => setViewSelf(false)}
            className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer shadow-lg backdrop-blur-md transition-all ${!viewSelf ? 'bg-[#D51659] text-white shadow-[#D51659]/40' : 'bg-black/30 border border-white/20 text-white hover:bg-black/50'}`}>
            Connection
          </button>
          <button onClick={() => setViewSelf(true)}
            className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer shadow-lg backdrop-blur-md transition-all ${viewSelf ? 'bg-[#D51659] text-white shadow-[#D51659]/40' : 'bg-black/30 border border-white/20 text-white hover:bg-black/50'}`}>
            My Dashboard
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 relative -mt-16 lg:-mt-28 z-10">

        {/* ═══ DESKTOP HERO CARD ═══ */}
        <div className="hidden lg:flex bg-[#FCFAF2] rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden mb-8">
          {/* Large Photo */}
          <div className="w-[320px] shrink-0 relative group">
            <img src={heroImg} alt={profileUser.name} className="w-full h-full object-cover min-h-[380px]" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/15" />
            {isVerified && (
              <div className="absolute top-5 left-5 flex items-center gap-1.5 text-[10px] font-black bg-white/80 backdrop-blur-md text-[#2D2D2D] px-3 py-1.5 rounded-full border border-slate-200 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D51659]" /> Verified
              </div>
            )}
            {viewSelf && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-5 right-5 w-11 h-11 bg-[#D51659] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer shadow-[#D51659]/40"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            )}
          </div>

          {/* Info Section */}
          <div className="flex-1 p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-black tracking-tight text-[#2D2D2D]">
                  {profileUser.name}, {profileUser.age}
                </h1>
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/30" />
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold mb-6">
                <MapPin className="w-4 h-4" /> {displayLocation}
                {profileUser.gender && <><span className="mx-1 text-slate-300">•</span><span>{profileUser.gender}</span></>}
              </div>
              <p className="text-slate-650 text-base leading-relaxed max-w-xl font-medium">
                {profileUser.bio || 'No bio yet.'}
              </p>
              {/* Detail Chips */}
              <div className="flex flex-wrap gap-2.5 mt-6">
                {detailChips.map((c, i) => (
                  <div key={i} className={`px-4 py-2 rounded-full ${c.bg} ${c.text2} text-xs font-bold border ${c.border}`}>
                    {c.icon} {c.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom: Action + Stats */}
            <div className="flex items-end justify-between mt-8 pt-6 border-t border-slate-200">
              <div className="flex gap-3">
                {viewSelf ? (
                  <>
                    <button
                      onClick={openEditModal}
                      className="px-7 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-white hover:bg-slate-50 text-[#2D2D2D] transition-colors cursor-pointer border border-slate-200 shadow-sm flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-slate-500" /> Edit Profile
                    </button>
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer border border-rose-200 shadow-sm flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <button className="px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-[#D51659] text-white hover:bg-[#b44ddc] transition-all cursor-pointer shadow-[0_2px_12px_rgba(213,22,89,0.4)] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 fill-current" /> Send Spark
                    </button>
                    <button className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-white hover:bg-slate-50 text-[#2D2D2D] transition-colors cursor-pointer border border-slate-200 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Message
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-6">
                {stats.map((s, i) => (
                  <div key={i} className="text-center">
                    <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
                    <span className="text-xl font-black text-[#2D2D2D] block">{s.value}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ MOBILE HERO CARD ═══ */}
        <div className="lg:hidden space-y-4 mb-6 text-[#2D2D2D]">
          <div className="bg-[#FCFAF2] rounded-2xl p-4 shadow-2xl border border-slate-200">
            <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-xl mb-4 mx-auto border border-slate-200">
              <img src={heroImg} alt={profileUser.name} className="w-full h-full object-cover" />
              {isVerified && (
                <div className="absolute top-1 left-1 flex items-center gap-1 text-[8px] font-black bg-white/80 backdrop-blur-md text-[#2D2D2D] px-2 py-1 rounded-full border border-slate-200 uppercase">
                  <CheckCircle2 className="w-2.5 h-2.5 text-[#D51659]" /> Verified
                </div>
              )}
            </div>
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl font-black text-[#2D2D2D]">{profileUser.name}, {profileUser.age}</h1>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-green-500/30" />
              </div>
              <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500">
                <MapPin className="w-4 h-4" /> {displayLocation}
              </div>
            </div>
            <div className="mt-5">
              {viewSelf ? (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={openEditModal}
                    className="py-3 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider bg-white hover:bg-slate-50 text-[#2D2D2D] cursor-pointer border border-slate-200 shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="py-3 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer border border-rose-200 shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                    <span>Log Out</span>
                  </button>
                </div>
              ) : (
                <button className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#D51659] text-white hover:bg-[#b44ddc] cursor-pointer shadow-[0_2px_12px_rgba(213,22,89,0.4)] flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 fill-current" /> Send Spark
                </button>
              )}
            </div>
          </div>
          {/* Mobile Stats */}
          <div className="bg-[#FCFAF2] rounded-2xl p-4 shadow-xl border border-slate-200">
            <div className="grid grid-cols-4 gap-3">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
                  <span className="text-lg font-black text-[#2D2D2D] block">{s.value}</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ TABS ═══ */}
        <div className="flex gap-1.5 p-1.5 rounded-full bg-[#FCFAF2] shadow-md border border-slate-200 w-fit max-w-full overflow-x-auto no-scrollbar mb-8">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 lg:px-8 py-3 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap
                ${activeTab === tab.id ? 'bg-[#D51659] text-white shadow-[0_2px_8px_rgba(213,22,89,0.3)]' : 'text-slate-500 hover:bg-slate-100 hover:text-[#2D2D2D]'}`}>
              <tab.icon className="w-4 h-4 shrink-0" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ TAB CONTENT ═══ */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

            {activeTab === 'about' && (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Bio - full width on desktop */}
                <div className="lg:col-span-2 bg-[#FCFAF2] rounded-[2rem] p-6 lg:p-8 shadow-xl border border-slate-200">
                  <h3 className="font-black text-2xl text-[#2D2D2D] mb-4">About me</h3>
                  <p className="text-base lg:text-lg leading-relaxed text-[#2D2D2D]/85 font-medium">{profileUser.bio}</p>
                  {/* Languages */}
                  {profileUser.languages?.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Languages</h4>
                      <div className="flex flex-wrap gap-2">
                        {profileUser.languages.map((lang, i) => (
                          <span key={i} className="px-4 py-2 rounded-full text-xs font-bold bg-white border border-slate-200 text-[#2D2D2D]/80">
                            <Globe className="w-3 h-3 inline mr-1.5 -mt-0.5" />{lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Work & Education */}
                <div className="bg-[#FCFAF2] rounded-[2rem] p-6 lg:p-8 shadow-xl border border-slate-200 space-y-5">
                  <h3 className="font-black text-xl text-[#2D2D2D] border-b border-slate-200 pb-4">Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                      <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Work</span>
                        <span className="text-sm font-bold text-[#2D2D2D]">{profileUser.work || 'Not specified'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                      <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Education</span>
                        <span className="text-sm font-bold text-[#2D2D2D]">{profileUser.education || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                  {/* Detail Chips (mobile only, desktop shows in hero) */}
                  <div className="lg:hidden flex flex-wrap gap-2.5 pt-3">
                    {detailChips.map((c, i) => (
                      <div key={i} className={`px-3 py-2 rounded-full ${c.bg} ${c.text2} text-xs font-bold border ${c.border}`}>{c.icon} {c.text}</div>
                    ))}
                  </div>
                </div>

                {/* Interests - full width */}
                <div className="lg:col-span-3 bg-[#FCFAF2] rounded-[2rem] p-6 lg:p-8 shadow-xl border border-slate-200">
                  <h3 className="font-black text-2xl text-[#2D2D2D] mb-6">Interests</h3>
                  <div className="flex flex-wrap gap-3">
                    {profileUser.interests?.length > 0 ? (
                      profileUser.interests.map((interest, idx) => (
                        <span key={idx} className="px-5 py-3 rounded-2xl font-bold text-sm bg-white border border-slate-200 text-[#2D2D2D]/90 hover:border-[#D51659] hover:bg-[#D51659]/10 transition-all cursor-default">
                          {interest}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic text-sm">No interests listed yet.</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="bg-[#FCFAF2] rounded-[2rem] p-5 lg:p-8 shadow-xl border border-slate-200">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                  {userImages.map((img, idx) => (
                    <div key={idx} className="aspect-[4/5] rounded-2xl lg:rounded-3xl overflow-hidden shadow-md group relative">
                      <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#2D2D2D]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <span className="text-white text-xs font-bold">Photo {idx + 1}</span>
                      </div>
                    </div>
                  ))}
                  {userImages.length < 9 && viewSelf && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-[4/5] rounded-2xl lg:rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-3 hover:border-[#D51659] hover:bg-[#D51659]/5 transition-colors cursor-pointer text-slate-400 hover:text-[#2D2D2D]">
                      <Camera className="w-8 h-8" />
                      <span className="text-xs font-bold uppercase tracking-wider">Add Photo</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'prompts' && (
              <div className="grid lg:grid-cols-2 gap-6 text-[#2D2D2D]">
                {profileUser.prompts && profileUser.prompts.length > 0 ? (
                  profileUser.prompts.map((prompt, idx) => (
                    <div key={idx} className="bg-[#FCFAF2] p-6 lg:p-8 rounded-[2rem] shadow-xl border border-slate-200 relative overflow-hidden group hover:border-[#D51659]/50 transition-colors">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D51659]" />
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-4">{prompt.question}</span>
                      <p className="text-lg lg:text-2xl font-serif italic font-semibold text-[#2D2D2D] leading-relaxed">"{prompt.answer}"</p>
                    </div>
                  ))
                ) : (
                  <div className="lg:col-span-2 bg-[#FCFAF2] p-12 text-center rounded-[2rem] shadow-xl border border-slate-200">
                    <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No custom prompts answered yet. Spark a conversation by adding some!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="space-y-6 text-[#2D2D2D]">
                <div className="bg-[#FCFAF2] rounded-[2rem] p-6 lg:p-8 shadow-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-black text-2xl text-[#2D2D2D] mb-2">My Balance</h3>
                    <p className="text-sm text-slate-500 font-medium">Use coins to supercharge your matches.</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-slate-200">
                    <Sparkles className="w-8 h-8 text-[#D51659]" />
                    <span className="text-3xl font-black text-[#2D2D2D]">450</span>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <button onClick={() => navigate('/wallet')} className="bg-[#D51659] text-white p-6 rounded-[2rem] shadow-[0_2px_12px_rgba(213,22,89,0.4)] hover:bg-[#b44ddc] transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer group">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Wallet className="w-6 h-6" /></div>
                    <span className="font-bold">Buy More Coins</span>
                  </button>
                  <button className="bg-white border border-slate-200 text-[#2D2D2D] p-6 rounded-[2rem] shadow-xl hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer group">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Award className="w-6 h-6 text-[#2D2D2D]" /></div>
                    <span className="font-bold">Transaction History</span>
                  </button>
                  <button className="bg-white border border-slate-200 text-[#2D2D2D] p-6 rounded-[2rem] shadow-xl hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer group">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Crown className="w-6 h-6 text-amber-500" /></div>
                    <span className="font-bold">Go Premium</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'verification' && (
              <div className="space-y-6 text-[#2D2D2D]">
                <VerificationCard status={verificationStatus} />

                {verificationStatus === 'NOT_VERIFIED' && (
                  <div className="bg-gradient-to-br from-[#D51659]/5 to-[#b44ddc]/5 border border-purple-200 rounded-[2rem] p-6 lg:p-8">
                    <h3 className="font-black text-xl text-[#2D2D2D] mb-4">Why Get Verified?</h3>
                    <div className="space-y-3">
                      {[
                        { icon: '💬', title: 'Earn Through Chat', desc: 'Get paid for every chat session you participate in.' },
                        { icon: '📩', title: 'Receive Paid Requests', desc: 'Accept paid chat requests from other users.' },
                        { icon: '💰', title: 'Withdraw Earnings', desc: 'Transfer your earnings directly to your bank or UPI.' },
                        { icon: '🛡️', title: 'Verified Badge', desc: 'Display a Verified Customer badge on your profile.' },
                      ].map((b) => (
                        <div key={b.title} className="flex items-start gap-4 bg-white p-4 rounded-2xl border border-slate-200">
                          <span className="text-2xl">{b.icon}</span>
                          <div>
                            <p className="text-sm font-bold text-[#2D2D2D]">{b.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{b.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => navigate('/kyc-verification')}
                      className="mt-6 w-full py-4 rounded-2xl bg-gradient-to-r from-[#D51659] to-[#b44ddc] text-white font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer shadow-[0_4px_20px_rgba(213,22,89,0.3)] flex items-center justify-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Become a Verified Customer
                    </button>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══ EDIT PROFILE MODAL ═══ */}
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
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#FCFAF2] rounded-[2rem] w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-[#FCFAF2] z-10 px-6 pt-6 pb-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl font-black text-[#2D2D2D]">Edit Profile</h2>
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
                        className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-200 text-sm font-medium text-[#2D2D2D] placeholder-slate-400 focus:border-[#D51659] focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all resize-none"
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={editForm[field.key] || ''}
                        onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-200 text-sm font-medium text-[#2D2D2D] placeholder-slate-400 focus:border-[#D51659] focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all"
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
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-200 text-sm font-medium text-[#2D2D2D] focus:border-[#D51659] focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all cursor-pointer"
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
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-200 text-sm font-medium text-[#2D2D2D] focus:border-[#D51659] focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all cursor-pointer"
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
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-200 text-sm font-medium text-[#2D2D2D] placeholder-slate-400 focus:border-[#D51659] focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-[#2D2D2D]/60 uppercase tracking-widest block mb-1.5 ml-1">Religion</label>
                  <input
                    type="text"
                    value={editForm.religion || ''}
                    onChange={(e) => setEditForm({ ...editForm, religion: e.target.value })}
                    placeholder="Your faith or spiritual belief"
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-200 text-sm font-medium text-[#2D2D2D] placeholder-slate-400 focus:border-[#D51659] focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-[#2D2D2D]/60 uppercase tracking-widest block mb-1.5 ml-1">Interests (comma separated)</label>
                  <input
                    type="text"
                    value={editForm.interests || ''}
                    onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })}
                    placeholder="Travel, Reading, Music, Fitness..."
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-200 text-sm font-medium text-[#2D2D2D] placeholder-slate-400 focus:border-[#D51659] focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-[#2D2D2D]/60 uppercase tracking-widest block mb-1.5 ml-1">Languages (comma separated)</label>
                  <input
                    type="text"
                    value={editForm.languages || ''}
                    onChange={(e) => setEditForm({ ...editForm, languages: e.target.value })}
                    placeholder="English, Tamil, Hindi..."
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-200 text-sm font-medium text-[#2D2D2D] placeholder-slate-400 focus:border-[#D51659] focus:ring-4 focus:ring-[#D51659]/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-[#FCFAF2] z-10 px-6 py-4 border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold text-[#2D2D2D] bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 py-3.5 rounded-xl text-sm font-black text-white cursor-pointer hover:opacity-90 transition-all shadow-lg shadow-[#D51659]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #D51659 0%, #b44ddc 100%)' }}
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

      {/* ═══ LOGOUT CONFIRMATION MODAL ═══ */}
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
              className="bg-[#FCFAF2] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 p-6 text-center"
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
                  className="flex-1 py-3 rounded-xl text-xs font-bold text-[#2D2D2D] bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
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
    </div>
  );
};

export default Profile;
