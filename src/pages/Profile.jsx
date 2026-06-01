import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { mockUsers, mockCurrentUser } from '../data/mockData';
import { 
  CheckCircle2, 
  MapPin, 
  Sparkles, 
  Image as ImageIcon, 
  Heart, 
  Award, 
  MessageSquare,
  HelpCircle,
  ShieldAlert,
  Camera,
  User,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
  const navigate = useNavigate();
  const themeMode = useSelector((state) => state.theme.mode);
  
  // Selected Profile state from Redux
  const selectedUserId = useSelector((state) => state.user.selectedUserId);
  const discoveredUsers = useSelector((state) => state.user.discoveredUsers);
  const authUser = useSelector((state) => state.auth.user);

  const [activeTab, setActiveTab] = useState('about'); // 'about' | 'media' | 'prompts'
  const [viewSelf, setViewSelf] = useState(false);

  // Determine which user profile to render
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

  return (
    <div className="w-full min-h-screen bg-[#f5f5f3] text-left pb-24 font-sans">
      
      {/* 1) FULL WIDTH EDGE-TO-EDGE BANNER */}
      <div className="relative w-full h-[30vh] sm:h-[40vh] lg:h-[45vh] min-h-[220px] sm:min-h-[280px] lg:min-h-[350px] bg-slate-900 overflow-hidden">
        {/* Background Image Blurred */}
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: `url('${profileUser.images[0]}')`, filter: 'blur(30px) brightness(0.4)' }} 
        />
        {/* Soft Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#f5f5f3] via-transparent to-transparent" />
        
        {/* View Toggle positioned absolutely over the banner */}
        <div className="absolute top-6 right-6 lg:right-12 z-20 flex gap-2">
          <button
            onClick={() => setViewSelf(false)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer shadow-lg backdrop-blur-md
              ${!viewSelf 
                ? 'bg-bumble-yellow text-bumble-charcoal border border-bumble-yellow'
                : 'bg-black/30 border border-white/20 text-white hover:bg-black/50'
              }`}
          >
            Connection View
          </button>
          <button
            onClick={() => setViewSelf(true)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer shadow-lg backdrop-blur-md
              ${viewSelf 
                ? 'bg-bumble-yellow text-bumble-charcoal border border-bumble-yellow'
                : 'bg-black/30 border border-white/20 text-white hover:bg-black/50'
              }`}
          >
            My Dashboard
          </button>
        </div>
      </div>

      {/* 2) MAIN WIDE CONTENT CONTAINER (Overlapping the banner) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative -mt-16 sm:-mt-24 lg:-mt-32 z-10 grid lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* LEFT COLUMN: Profile Identity Card & Stats (Spans 4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Main Identity Card */}
          <div className="bg-white rounded-[2rem] p-6 shadow-2xl border border-slate-100 relative">
            
            {/* Avatar Image */}
            <div className="relative w-32 h-32 md:w-full md:h-auto md:aspect-[4/5] rounded-full md:rounded-[1.5rem] overflow-hidden shadow-xl mb-6 mx-auto md:mx-0 bg-slate-200 shrink-0">
              <img
                src={profileUser.images[0]}
                alt={profileUser.name}
                className="w-full h-full object-cover"
              />
              {/* Verified Badge Absolute */}
              {profileUser.verified && (
                <div className="absolute top-2 left-2 md:top-4 md:left-4 flex items-center gap-1 text-[8px] md:text-[10px] font-black bg-white/90 backdrop-blur-md text-bumble-charcoal px-2 py-1 md:px-3 md:py-1.5 rounded-full shadow-lg border border-black/5 uppercase tracking-wider">
                  <CheckCircle2 className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-blue-500 fill-current" />
                  Verified
                </div>
              )}
              {/* Edit button if self */}
              {viewSelf && (
                <button className="absolute bottom-1 right-1 md:bottom-4 md:right-4 w-8 h-8 md:w-10 md:h-10 bg-bumble-yellow rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer border-none">
                  <Camera className="w-4 h-4 md:w-5 md:h-5 text-bumble-charcoal" />
                </button>
              )}
            </div>

            {/* Name & Basic Info */}
            <div className="space-y-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-bumble-charcoal">
                  {profileUser.name}, {profileUser.age}
                </h1>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50 mx-auto md:mx-0" />
              </div>
              <div className="flex items-center justify-center md:justify-start gap-1.5 text-sm font-semibold text-slate-500">
                <MapPin className="w-4 h-4" />
                <span>{profileUser.location || 'San Francisco, CA'}</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="mt-6 md:mt-8">
              {viewSelf ? (
                <button className="w-full py-3.5 md:py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-slate-100 hover:bg-slate-200 text-bumble-charcoal transition-colors cursor-pointer border border-slate-200 shadow-sm">
                  Edit Profile Info
                </button>
              ) : (
                <button className="w-full py-3.5 md:py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-bumble-yellow text-bumble-charcoal hover:bg-black hover:text-white transition-all cursor-pointer shadow-lg shadow-bumble-yellow/20 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 fill-current" />
                  Send Spark
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats Widget */}
          <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100">
            <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-4">Profile Analytics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-bumble-light-gray rounded-2xl text-center border border-slate-100">
                <Heart className="w-5 h-5 mx-auto text-bumble-red mb-2 animate-pulse" />
                <span className="text-2xl font-black text-bumble-charcoal">{profileUser.popularityScore || '92%'}</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mt-1">Popularity</span>
              </div>
              <div className="p-4 bg-bumble-light-gray rounded-2xl text-center border border-slate-100">
                <Award className="w-5 h-5 mx-auto text-bumble-yellow mb-2" />
                <span className="text-2xl font-black text-bumble-charcoal">{profileUser.matchesCount || 8}</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mt-1">Connections</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Bio, Details, Galleries (Spans 8 columns) */}
        <div className="lg:col-span-8 space-y-8 mt-16 lg:mt-0 pt-4">
          
          {/* Custom Tabs */}
          <div className="flex gap-2 p-1.5 rounded-full bg-white shadow-md border border-slate-100 w-fit max-w-full overflow-x-auto no-scrollbar">
            {[
              { id: 'about', label: 'About Me', icon: User },
              { id: 'media', label: 'Photo Gallery', icon: ImageIcon },
              { id: 'prompts', label: 'Prompts', icon: MessageSquare },
              { id: 'wallet', label: 'Wallet', icon: Wallet }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 sm:px-8 py-3.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'bg-bumble-charcoal text-white shadow-md' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-bumble-charcoal'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'about' && (
                <div className="space-y-8">
                  {/* Bio Card */}
                  <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
                    <h3 className="font-serif italic font-semibold text-2xl text-bumble-charcoal mb-4">The basics</h3>
                    <p className="text-lg leading-relaxed text-slate-600 font-medium max-w-2xl">
                      {profileUser.bio}
                    </p>
                  </div>

                  {/* Badges / Meta Grid */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 space-y-6">
                      <h3 className="font-serif italic font-semibold text-xl text-bumble-charcoal border-b border-slate-100 pb-4">Work & Education</h3>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Occupation</span>
                          <span className="text-sm font-black text-bumble-charcoal text-right">{profileUser.work}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Education</span>
                          <span className="text-sm font-black text-bumble-charcoal text-right">{profileUser.education}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 space-y-6">
                      <h3 className="font-serif italic font-semibold text-xl text-bumble-charcoal border-b border-slate-100 pb-4">More about me</h3>
                      
                      <div className="flex flex-wrap gap-3">
                        <div className="px-4 py-2.5 rounded-full bg-bumble-yellow/15 text-bumble-charcoal text-xs font-bold border border-bumble-yellow/20">
                          📏 {profileUser.height || '5\'9"'}
                        </div>
                        <div className="px-4 py-2.5 rounded-full bg-blue-500/10 text-blue-700 text-xs font-bold border border-blue-500/20">
                          ✨ {profileUser.zodiac || 'Leo'}
                        </div>
                        <div className="px-4 py-2.5 rounded-full bg-green-500/10 text-green-700 text-xs font-bold border border-green-500/20">
                          🏃 {profileUser.exercise || 'Active'}
                        </div>
                        <div className="px-4 py-2.5 rounded-full bg-bumble-red/10 text-bumble-red text-xs font-bold border border-bumble-red/20">
                          ❤️ {profileUser.relationship || 'Dating'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interests */}
                  <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
                    <h3 className="font-serif italic font-semibold text-2xl text-bumble-charcoal mb-6">My Interests</h3>
                    <div className="flex flex-wrap gap-3">
                      {profileUser.interests.map((interest, idx) => (
                        <span
                          key={idx}
                          className="px-5 py-3 rounded-2xl font-bold text-sm bg-slate-50 border border-slate-200 text-bumble-charcoal hover:border-bumble-charcoal hover:bg-bumble-charcoal hover:text-white transition-all cursor-default"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {profileUser.images.map((img, idx) => (
                      <div key={idx} className="aspect-[4/5] rounded-3xl overflow-hidden shadow-md group relative">
                        <img
                          src={img}
                          alt={`Gallery ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                          <span className="text-white text-xs font-bold">Photo {idx + 1}</span>
                        </div>
                      </div>
                    ))}
                    {profileUser.images.length < 6 && (
                      <div className="aspect-[4/5] rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-3 hover:border-bumble-yellow hover:bg-bumble-yellow/5 transition-colors cursor-pointer text-slate-400 hover:text-bumble-charcoal">
                        <Camera className="w-8 h-8" />
                        <span className="text-xs font-bold uppercase tracking-wider">Add Photo</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'prompts' && (
                <div className="space-y-6">
                  {profileUser.prompts && profileUser.prompts.length > 0 ? (
                    profileUser.prompts.map((prompt, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden group hover:border-bumble-yellow transition-colors"
                      >
                        <div className="absolute top-0 left-0 w-2 h-full bg-bumble-yellow transition-transform group-hover:scale-y-110" />
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-4">
                          {prompt.question}
                        </span>
                        <p className="text-2xl font-serif italic font-semibold text-bumble-charcoal leading-relaxed">
                          "{prompt.answer}"
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white p-12 text-center rounded-[2rem] shadow-xl border border-slate-100">
                      <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 font-medium">No custom prompts answered yet. Spark a conversation by adding some!</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'wallet' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-serif italic font-semibold text-2xl text-bumble-charcoal mb-2">My Balance</h3>
                      <p className="text-slate-500 font-medium">Use coins to supercharge your matches.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                      <Sparkles className="w-8 h-8 text-bumble-yellow" />
                      <span className="text-3xl font-black text-bumble-charcoal">450</span>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <button onClick={() => navigate('/wallet')} className="bg-bumble-charcoal text-white p-6 rounded-[2rem] shadow-xl hover:bg-black transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer group">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <span className="font-bold">Buy More Coins</span>
                    </button>
                    <button className="bg-white border border-slate-200 text-bumble-charcoal p-6 rounded-[2rem] shadow-xl hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer group">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Award className="w-6 h-6 text-slate-400" />
                      </div>
                      <span className="font-bold">View Transaction History</span>
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Profile;
