import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  CheckCircle2, MapPin, Sparkles, Image as ImageIcon, Heart, Award,
  MessageSquare, HelpCircle, Camera, User, Wallet, Briefcase, GraduationCap,
  Globe, BookHeart, Ruler, Star, Dumbbell, Eye, Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
  const navigate = useNavigate();
  const selectedUserId = useSelector((state) => state.user.selectedUserId);
  const discoveredUsers = useSelector((state) => state.user.discoveredUsers);
  const authUser = useSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState('about');
  const [viewSelf, setViewSelf] = useState(false);

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
  const heroImg = profileUser.images?.[0] || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&q=80&w=600';

  const tabs = [
    { id: 'about', label: 'About', icon: User },
    { id: 'media', label: 'Gallery', icon: ImageIcon },
    { id: 'prompts', label: 'Prompts', icon: MessageSquare },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
  ];

  const stats = [
    { icon: Heart, value: profileUser.popularityScore || '92%', label: 'Popularity', color: 'text-rose-400' },
    { icon: Award, value: profileUser.matchesCount || 8, label: 'Matches', color: 'text-amber-400' },
    { icon: Eye, value: profileUser.profileViews || 124, label: 'Views', color: 'text-cyan-400' },
    { icon: Sparkles, value: profileUser.likesCount || 37, label: 'Likes', color: 'text-purple-400' },
  ];

  const detailChips = [
    { icon: '📏', text: profileUser.height || '5\'9"', bg: 'bg-white/10', border: 'border-white/10', text2: 'text-white' },
    { icon: '✨', text: profileUser.zodiac || 'Leo', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text2: 'text-blue-400' },
    { icon: '🏃', text: profileUser.exercise || 'Active', bg: 'bg-green-500/10', border: 'border-green-500/20', text2: 'text-green-400' },
    { icon: '❤️', text: profileUser.relationship || 'Dating', bg: 'bg-[#D51659]/10', border: 'border-[#D51659]/20', text2: 'text-[#D51659]' },
    { icon: '🙏', text: profileUser.religion || 'Spiritual', bg: 'bg-orange-500/10', border: 'border-orange-500/20', text2: 'text-orange-400' },
  ];

  return (
    <div className="w-full min-h-screen text-left pb-28 lg:pb-12 font-sans overflow-x-hidden">

      {/* BANNER */}
      <div className="relative w-full h-[22vh] lg:h-[32vh] min-h-[160px] lg:min-h-[280px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${heroImg}')`, filter: 'blur(40px) brightness(0.3) saturate(1.4)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0A0A0A]" />
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
        <div className="hidden lg:flex bg-black/50 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden mb-8">
          {/* Large Photo */}
          <div className="w-[320px] shrink-0 relative group">
            <img src={heroImg} alt={profileUser.name} className="w-full h-full object-cover min-h-[380px]" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30" />
            {profileUser.verified && (
              <div className="absolute top-5 left-5 flex items-center gap-1.5 text-[10px] font-black bg-white/15 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-white/10 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D51659]" /> Verified
              </div>
            )}
            {viewSelf && (
              <button className="absolute bottom-5 right-5 w-11 h-11 bg-[#D51659] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer shadow-[#D51659]/40">
                <Camera className="w-5 h-5 text-white" />
              </button>
            )}
          </div>

          {/* Info Section */}
          <div className="flex-1 p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-black tracking-tight text-white">
                  {profileUser.name}, {profileUser.age}
                </h1>
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm font-semibold mb-6">
                <MapPin className="w-4 h-4" /> {displayLocation}
                {profileUser.gender && <><span className="mx-1 text-white/20">•</span><span>{profileUser.gender}</span></>}
              </div>
              <p className="text-white/70 text-base leading-relaxed max-w-xl font-medium">
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
            <div className="flex items-end justify-between mt-8 pt-6 border-t border-white/5">
              <div className="flex gap-3">
                {viewSelf ? (
                  <button className="px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/10">
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button className="px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-[#D51659] text-white hover:bg-[#b44ddc] transition-all cursor-pointer shadow-[0_2px_12px_rgba(213,22,89,0.4)] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 fill-current" /> Send Spark
                    </button>
                    <button className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/10 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Message
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-6">
                {stats.map((s, i) => (
                  <div key={i} className="text-center">
                    <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
                    <span className="text-xl font-black text-white block">{s.value}</span>
                    <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ MOBILE HERO CARD ═══ */}
        <div className="lg:hidden space-y-4 mb-6">
          <div className="bg-black/40 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl border border-white/10">
            <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-xl mb-4 mx-auto">
              <img src={heroImg} alt={profileUser.name} className="w-full h-full object-cover" />
              {profileUser.verified && (
                <div className="absolute top-1 left-1 flex items-center gap-1 text-[8px] font-black bg-white/10 backdrop-blur-md text-white px-2 py-1 rounded-full border border-white/10 uppercase">
                  <CheckCircle2 className="w-2.5 h-2.5 text-[#D51659]" /> Verified
                </div>
              )}
            </div>
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl font-black text-white">{profileUser.name}, {profileUser.age}</h1>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-green-500/50" />
              </div>
              <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-white/50">
                <MapPin className="w-4 h-4" /> {displayLocation}
              </div>
            </div>
            <div className="mt-5">
              {viewSelf ? (
                <button className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white cursor-pointer border border-white/10">Edit Profile Info</button>
              ) : (
                <button className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#D51659] text-white hover:bg-[#b44ddc] cursor-pointer shadow-[0_2px_12px_rgba(213,22,89,0.4)] flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 fill-current" /> Send Spark
                </button>
              )}
            </div>
          </div>
          {/* Mobile Stats */}
          <div className="bg-black/40 backdrop-blur-2xl rounded-2xl p-4 shadow-xl border border-white/10">
            <div className="grid grid-cols-4 gap-3">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
                  <span className="text-lg font-black text-white block">{s.value}</span>
                  <span className="text-[8px] text-white/40 font-bold uppercase tracking-wider">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ TABS ═══ */}
        <div className="flex gap-1.5 p-1.5 rounded-full bg-black/40 backdrop-blur-xl shadow-md border border-white/10 w-fit max-w-full overflow-x-auto no-scrollbar mb-8">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 lg:px-8 py-3 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap
                ${activeTab === tab.id ? 'bg-[#D51659] text-white shadow-[0_2px_8px_rgba(213,22,89,0.3)]' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
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
                <div className="lg:col-span-2 bg-black/40 backdrop-blur-2xl rounded-[2rem] p-6 lg:p-8 shadow-xl border border-white/10">
                  <h3 className="font-serif italic font-semibold text-2xl text-white mb-4">About me</h3>
                  <p className="text-base lg:text-lg leading-relaxed text-white/80 font-medium">{profileUser.bio}</p>
                  {/* Languages */}
                  {profileUser.languages?.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Languages</h4>
                      <div className="flex flex-wrap gap-2">
                        {profileUser.languages.map((lang, i) => (
                          <span key={i} className="px-4 py-2 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-white/80">
                            <Globe className="w-3 h-3 inline mr-1.5 -mt-0.5" />{lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Work & Education */}
                <div className="bg-black/40 backdrop-blur-2xl rounded-[2rem] p-6 lg:p-8 shadow-xl border border-white/10 space-y-5">
                  <h3 className="font-serif italic font-semibold text-xl text-white border-b border-white/10 pb-4">Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <Briefcase className="w-4 h-4 text-white/40 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Work</span>
                        <span className="text-sm font-bold text-white/90">{profileUser.work || 'Not specified'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <GraduationCap className="w-4 h-4 text-white/40 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Education</span>
                        <span className="text-sm font-bold text-white/90">{profileUser.education || 'Not specified'}</span>
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
                <div className="lg:col-span-3 bg-black/40 backdrop-blur-2xl rounded-[2rem] p-6 lg:p-8 shadow-xl border border-white/10">
                  <h3 className="font-serif italic font-semibold text-2xl text-white mb-6">Interests</h3>
                  <div className="flex flex-wrap gap-3">
                    {profileUser.interests?.length > 0 ? (
                      profileUser.interests.map((interest, idx) => (
                        <span key={idx} className="px-5 py-3 rounded-2xl font-bold text-sm bg-white/5 border border-white/10 text-white/90 hover:border-[#D51659] hover:bg-[#D51659]/20 hover:text-white transition-all cursor-default">
                          {interest}
                        </span>
                      ))
                    ) : (
                      <span className="text-white/40 italic text-sm">No interests listed yet.</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="bg-black/40 backdrop-blur-2xl rounded-[2rem] p-5 lg:p-8 shadow-xl border border-white/10">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                  {profileUser.images?.map((img, idx) => (
                    <div key={idx} className="aspect-[4/5] rounded-2xl lg:rounded-3xl overflow-hidden shadow-md group relative">
                      <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <span className="text-white text-xs font-bold">Photo {idx + 1}</span>
                      </div>
                    </div>
                  ))}
                  {(profileUser.images?.length || 0) < 9 && (
                    <div className="aspect-[4/5] rounded-2xl lg:rounded-3xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 hover:border-[#D51659] hover:bg-[#D51659]/10 transition-colors cursor-pointer text-white/40 hover:text-white">
                      <Camera className="w-8 h-8" />
                      <span className="text-xs font-bold uppercase tracking-wider">Add Photo</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'prompts' && (
              <div className="grid lg:grid-cols-2 gap-6">
                {profileUser.prompts && profileUser.prompts.length > 0 ? (
                  profileUser.prompts.map((prompt, idx) => (
                    <div key={idx} className="bg-black/40 backdrop-blur-2xl p-6 lg:p-8 rounded-[2rem] shadow-xl border border-white/10 relative overflow-hidden group hover:border-[#D51659]/50 transition-colors">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D51659]" />
                      <span className="text-xs text-white/50 font-bold uppercase tracking-widest block mb-4">{prompt.question}</span>
                      <p className="text-lg lg:text-2xl font-serif italic font-semibold text-white leading-relaxed">"{prompt.answer}"</p>
                    </div>
                  ))
                ) : (
                  <div className="lg:col-span-2 bg-black/40 backdrop-blur-2xl p-12 text-center rounded-[2rem] shadow-xl border border-white/10">
                    <HelpCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/50 font-medium">No custom prompts answered yet. Spark a conversation by adding some!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="space-y-6">
                <div className="bg-black/40 backdrop-blur-2xl rounded-[2rem] p-6 lg:p-8 shadow-xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif italic font-semibold text-2xl text-white mb-2">My Balance</h3>
                    <p className="text-sm text-white/50 font-medium">Use coins to supercharge your matches.</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 px-6 py-4 rounded-2xl border border-white/5">
                    <Sparkles className="w-8 h-8 text-[#D51659]" />
                    <span className="text-3xl font-black text-white">450</span>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <button onClick={() => navigate('/wallet')} className="bg-[#D51659] text-white p-6 rounded-[2rem] shadow-[0_2px_12px_rgba(213,22,89,0.4)] hover:bg-[#b44ddc] transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer group">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Wallet className="w-6 h-6" /></div>
                    <span className="font-bold">Buy More Coins</span>
                  </button>
                  <button className="bg-white/10 border border-white/10 text-white p-6 rounded-[2rem] shadow-xl hover:bg-white/20 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer group backdrop-blur-md">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Award className="w-6 h-6 text-white" /></div>
                    <span className="font-bold">Transaction History</span>
                  </button>
                  <button className="bg-white/10 border border-white/10 text-white p-6 rounded-[2rem] shadow-xl hover:bg-white/20 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer group backdrop-blur-md">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Crown className="w-6 h-6 text-amber-400" /></div>
                    <span className="font-bold">Go Premium</span>
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Profile;
