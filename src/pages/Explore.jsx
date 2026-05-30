import React, { useState } from 'react';
import { Heart, MapPin, X, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

const exploreCategories = ['New Match', 'Like Me', 'Favourite', 'Passed'];

const dummyProfiles = [
  {
    id: 1,
    name: "Manuela Chuthela",
    age: 31,
    distance: "0.02 KM Away",
    match: "27% Match",
    bio: "FREE SPIRIT SEEKING A KINDRED...",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: 2,
    name: "Ethan",
    age: 32,
    distance: "0.02 KM Away",
    match: "40% Match",
    bio: "PASSIONATE ABOUT FITNESS...",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: 3,
    name: "Sophie Johnson",
    age: 33,
    distance: "21.65 KM Away",
    match: "27% Match",
    bio: "MOVIE BUFF LOOKING FOR A POP...",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: 4,
    name: "Oliver Smith",
    age: 35,
    distance: "30.12 KM Away",
    match: "55% Match",
    bio: "NATURE LOVER LONGING FOR A CO...",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: 5,
    name: "Sophia Taylor",
    age: 33,
    distance: "32.96 KM Away",
    match: "16% Match",
    bio: "PARTY ANIMAL LOOKING FOR A DAN...",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: 6,
    name: "Svetlana Ivanova",
    age: 35,
    distance: "44.26 KM Away",
    match: "27% Match",
    bio: "THRILL-SEEKER SEARCHING FOR AN...",
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=600",
  }
];

const Explore = () => {
  const [activeCategory, setActiveCategory] = useState('New Match');

  return (
    <div className="w-full min-h-screen bg-bumble-yellow flex flex-col relative pt-16 md:pt-24 pb-24">
      <div className="max-w-7xl mx-auto w-full px-4 flex flex-col flex-grow">
        {/* Category Horizontal Scroll */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar mb-6 pb-1 px-2">
        {exploreCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-black transition-all duration-300 flex items-center gap-1.5 border-2 
              ${
                activeCategory === cat
                  ? 'bg-bumble-charcoal text-white border-bumble-charcoal shadow-xl shadow-black/20 scale-105'
                  : 'bg-white/40 text-bumble-charcoal border-white/60 hover:bg-white/80 backdrop-blur-sm'
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
        {dummyProfiles.map((profile, idx) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden border-[3px] border-white/30 shadow-xl group"
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
