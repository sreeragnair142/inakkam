import React, { useState, useEffect } from 'react';
import { Heart, MapPin, X, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDiscoverUsers, fetchReceivedLikes } from '../redux/slices/userSlice';

import api from '../utils/api';

const exploreCategories = ['New Match', 'Like Me', 'Favourite', 'Passed'];

// Verified Host/Agent profiles fallback (Customers only ever see Hosts/Agents)
const dummyProfiles = [
  {
    id: 'agent_anjali_01',
    name: "Anjali",
    age: 23,
    distance: "Online Now",
    match: "98% Match",
    bio: "Verified Host • Live for 1-on-1 video calls, lively talks & good vibes! 🌸",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600",
    isHost: true,
    verified: true,
  },
  {
    id: 'agent_gauri_02',
    name: "Gauri",
    age: 24,
    distance: "Active Host",
    match: "95% Match",
    bio: "Elite Host • Passionate about cinema, late night chats & audio calls. ✨",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600",
    isHost: true,
    verified: true,
  },
  {
    id: 'agent_rhea_03',
    name: "Rhea",
    age: 22,
    distance: "Online Now",
    match: "92% Match",
    bio: "Host Partner • Let's connect over video call! Always positive and cheerful. 💫",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600",
    isHost: true,
    verified: true,
  },
  {
    id: 'agent_kavya_04',
    name: "Kavya",
    age: 25,
    distance: "Available",
    match: "96% Match",
    bio: "Verified Host • Loves music, thoughtful conversations and fun stories. 🎵",
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=600",
    isHost: true,
    verified: true,
  },
  {
    id: 'agent_meera_05',
    name: "Meera",
    age: 24,
    distance: "Online Now",
    match: "94% Match",
    bio: "Elite Host • Ready for instant video calls and deep engaging chats. 🌟",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600",
    isHost: true,
    verified: true,
  },
  {
    id: 'agent_divya_06',
    name: "Divya",
    age: 23,
    distance: "Active Host",
    match: "91% Match",
    bio: "Host Partner • Love travel, good music and meeting warm souls! 🌺",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600",
    isHost: true,
    verified: true,
  }
];

const Explore = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('New Match');
  const [fallbackAgents, setFallbackAgents] = useState([]);
  const likedProfiles = useSelector((state) => state.user.likedProfiles || []);
  const discoveredUsers = useSelector((state) => state.user.discoveredUsers || []);
  const receivedLikes = useSelector((state) => state.user.receivedLikes || []);
  const currentUser = useSelector((state) => state.auth.user);

  const isStaffUser = currentUser?.isStaff || currentUser?.isEliteAgent || currentUser?.role === 'staff' || currentUser?.role === 'admin';
  const isCustomer = !isStaffUser;

  useEffect(() => {
    if (activeCategory === 'New Match') {
      dispatch(fetchDiscoverUsers(1));
      // Also fetch live agents to ensure customer only ever sees real hosts
      api.get('/users/agents').then(res => {
        if (res.data?.agents?.length > 0) {
          setFallbackAgents(res.data.agents);
        }
      }).catch(() => {});
    } else if (activeCategory === 'Like Me') {
      dispatch(fetchReceivedLikes());
    }
  }, [activeCategory, dispatch]);

  let rawList = dummyProfiles;

  if (activeCategory === 'Favourite' && likedProfiles.length > 0) {
    rawList = likedProfiles;
  } else if (activeCategory === 'New Match') {
    if (discoveredUsers && discoveredUsers.length > 0) {
      rawList = discoveredUsers;
    } else if (fallbackAgents && fallbackAgents.length > 0) {
      rawList = fallbackAgents;
    }
  } else if (activeCategory === 'Like Me' && receivedLikes.length > 0) {
    rawList = receivedLikes.map(item => item.user || item).filter(Boolean);
  }

  // Strict role filtering: Customers ONLY see verified agents/staff/hosts
  let sourceList = rawList;
  if (isCustomer) {
    sourceList = rawList.filter(u => Boolean(u.isEliteAgent || u.isStaff || u.role === 'staff' || u.isHost));
    if (sourceList.length === 0) {
      sourceList = fallbackAgents.length > 0 ? fallbackAgents : dummyProfiles;
    }
  } else {
    // Agents only see regular customers
    sourceList = rawList.filter(u => !u.isEliteAgent && !u.isStaff && u.role !== 'staff' && u.role !== 'admin');
  }

  const displayProfiles = sourceList.map((p, i) => ({
    id: p.id || p._id || i,
    name: p.name || p.firstName || "Unknown",
    age: p.age || 25,
    distance: p.distance || "Nearby",
    match: (p.matchPercentage || Math.floor(Math.random() * 50) + 50) + "% Match",
    bio: p.bio || "Looking for a connection...",
    image: p.images?.[0] || p.photos?.[0]?.url || p.photos?.[0] || p.image || "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80",
  }));

  return (
    <div className="w-full min-h-screen bg-premium-dark-gradient flex flex-col relative pt-16 md:pt-24 pb-24">
      <div className="max-w-7xl mx-auto w-full px-4 flex flex-col flex-grow">
        {/* Category Horizontal Scroll */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar mb-6 pb-1 px-2">
          {exploreCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-black transition-all duration-300 flex items-center gap-1.5 border-2 
              ${activeCategory === cat
                  ? 'bg-[#F5F1FD] text-[#2D2D2D] border-[#C4B5E3] shadow-md scale-105'
                  : 'bg-white text-slate-600 border-[#D8CCF0] hover:bg-[#EDE7F9] hover:border-[#C4B5E3]'
                }`}
            >
              {cat === 'New Match' && <Heart className="w-3.5 h-3.5 fill-current" />}
              {cat === 'Like Me' && <Heart className="w-3.5 h-3.5" />}
              {cat === 'Favourite' && <Heart className="w-3.5 h-3.5" />}
              {cat === 'Passed' && <X className="w-3.5 h-3.5" />}
              <span>{cat}</span>
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 px-1">
          {displayProfiles.map((profile, idx) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden border-[3px] border-[#D8CCF0] shadow-xl group bg-[#FCFAF2] hover:border-[#C4B5E3] transition-colors duration-300"
            >
              <img
                src={profile.image}
                alt={profile.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              {/* Match Badge */}
              <div className="absolute top-0 right-0 bg-bumble-charcoal text-bumble-yellow text-[9px] font-bold px-3 py-1.5 rounded-bl-xl z-10 shadow-lg">
                {profile.match}
              </div>

              {/* Profile Info */}
              <div className="absolute bottom-0 left-0 right-0 p-3.5 text-white z-10 flex flex-col justify-end">
                <div className="flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3 text-bumble-yellow" />
                  <span className="text-[9px] font-bold text-white/90">{profile.distance}</span>
                </div>
                <h3 className="font-bold text-[13px] leading-tight mb-1">{profile.name},{profile.age}</h3>
                <p className="text-[8px] text-white/80 leading-relaxed font-medium uppercase tracking-wider line-clamp-2">
                  {profile.bio}
                </p>
              </div>

              {/* Action Buttons (Hover) */}
              <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <button className="w-10 h-10 rounded-full bg-slate-700/80 backdrop-blur-md flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer border border-white/10 shadow-xl">
                  <X className="w-4 h-4 text-white" />
                </button>
                <button className="w-10 h-10 rounded-full bg-bumble-yellow flex items-center justify-center hover:bg-yellow-400 transition-colors cursor-pointer border border-yellow-300 shadow-xl shadow-yellow-500/30">
                  <Heart className="w-4 h-4 text-bumble-charcoal fill-bumble-charcoal" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Explore;
