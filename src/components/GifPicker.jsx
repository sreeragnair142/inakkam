import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// GIPHY verified public key for instant live searching across millions of GIFs
const GIPHY_API_KEY = 'sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh';
const GIPHY_BASE_URL = 'https://api.giphy.com/v1/gifs';

// Quick reaction categories for 1-click discovery
const CATEGORIES = [
  { label: '🔥 Hot', q: '' },
  { label: '❤️ Love', q: 'love romance' },
  { label: '😂 Funny', q: 'funny lol' },
  { label: '😘 Kiss', q: 'kiss romantic' },
  { label: '💃 Dance', q: 'dance party' },
  { label: '🎉 Party', q: 'celebrate cheer' },
  { label: '🥺 Cute', q: 'cute puppy' },
  { label: '🔥 Lit', q: 'fire hype' },
  { label: '👋 Hi', q: 'hello wave' },
];

// Curated fallback reaction GIFs (offline/failover safe)
const FALLBACK_GIFS = [
  { id: 'fb_1', url: 'https://media.giphy.com/media/26BRv0ThflsDTjq4E/giphy.gif', desc: 'Heart Love' },
  { id: 'fb_2', url: 'https://media.giphy.com/media/l41lT4n6ylgW2hh04/giphy.gif', desc: 'Kiss Love' },
  { id: 'fb_3', url: 'https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/giphy.gif', desc: 'Cheers' },
  { id: 'fb_4', url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif', desc: 'Haha Laugh' },
  { id: 'fb_5', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif', desc: 'Happy Dance' },
  { id: 'fb_6', url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif', desc: 'Party Confetti' },
  { id: 'fb_7', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', desc: 'Wow' },
  { id: 'fb_8', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif', desc: 'Thumbs Up' },
  { id: 'fb_9', url: 'https://media.giphy.com/media/3oEdv4hwWTzBhWvaU0/giphy.gif', desc: 'Warm Hug' },
  { id: 'fb_10', url: 'https://media.giphy.com/media/nrXif9YExO9EI/giphy.gif', desc: 'Fire' },
];

const GifPicker = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('🔥 Hot');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const fetchGifs = useCallback(async (searchTerm = '') => {
    setLoading(true);
    try {
      const isSearch = Boolean(searchTerm && searchTerm.trim());
      const endpoint = isSearch ? `${GIPHY_BASE_URL}/search` : `${GIPHY_BASE_URL}/trending`;
      const params = new URLSearchParams({
        api_key: GIPHY_API_KEY,
        limit: '30',
        rating: 'pg-13',
      });
      if (isSearch) params.set('q', searchTerm.trim());

      const res = await fetch(`${endpoint}?${params}`);
      if (!res.ok) throw new Error('Failed to fetch from GIPHY');
      const data = await res.json();

      if (data.data && data.data.length > 0) {
        setGifs(data.data);
      } else {
        setGifs(FALLBACK_GIFS);
      }
    } catch (err) {
      console.warn('GIF search error, using fallback GIFs:', err);
      setGifs(FALLBACK_GIFS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchGifs(query);
    }
  }, [isOpen, fetchGifs]);

  const handleSearchChange = (text) => {
    setQuery(text);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      fetchGifs(text);
    }, 350);
    setDebounceTimer(timer);
  };

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat.label);
    setQuery(cat.q);
    fetchGifs(cat.q);
  };

  const getGifUrl = (gif) => {
    return (
      gif?.images?.fixed_height?.url ||
      gif?.images?.fixed_height_small?.url ||
      gif?.images?.original?.url ||
      gif?.url ||
      ''
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 w-[340px] sm:w-[380px] h-[450px] bg-[#0E0E14]/95 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-[0_20px_70px_rgba(0,0,0,0.8)] z-[100001] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-black text-white uppercase tracking-wider">Send In-Call GIF</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3.5 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search millions of GIFs (e.g. love, dance, cat)..."
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-white/10 text-white text-xs rounded-2xl pl-10 pr-3 py-2.5 placeholder:text-white/30 outline-none focus:ring-1 focus:ring-[#D51659] border border-white/5 transition-all"
              autoFocus
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  fetchGifs('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="px-3.5 pb-2.5 flex gap-1.5 overflow-x-auto scrollbar-none py-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              type="button"
              onClick={() => handleCategoryClick(cat)}
              className={`text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                activeCategory === cat.label
                  ? 'bg-gradient-to-r from-[#D51659] to-[#EC3F7B] text-white border-transparent shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* GIF Grid */}
        <div className="flex-1 overflow-y-auto px-3.5 pb-3.5 scrollbar-thin">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <Loader2 className="w-7 h-7 text-[#D51659] animate-spin" />
              <span className="text-[11px] text-white/40 font-medium">Finding the best GIFs...</span>
            </div>
          ) : gifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <p className="text-white/40 text-xs">No GIFs found for "{query}"</p>
              <button
                onClick={() => {
                  setQuery('');
                  fetchGifs('');
                }}
                className="mt-2 text-[11px] text-[#D51659] hover:underline font-bold"
              >
                Show Trending GIFs
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {gifs.map((gif) => {
                const gifUrl = getGifUrl(gif);
                const title = gif?.title || gif?.desc || 'GIF';
                return (
                  <button
                    key={gif.id || gifUrl}
                    type="button"
                    onClick={() => {
                      onSelect(gifUrl);
                      onClose();
                    }}
                    className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-[#D51659] hover:scale-[1.02] transition-all cursor-pointer group h-28"
                  >
                    <img
                      src={gifUrl}
                      alt={title}
                      className="w-full h-full object-cover group-hover:brightness-110 transition-all"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="text-[10px] text-white font-medium truncate drop-shadow-md">
                        Tap to send
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/5 text-center bg-black/40 flex items-center justify-between">
          <span className="text-[10px] text-white/30">Tap any GIF to show in call</span>
          <span className="text-[10px] font-bold text-white/40 tracking-wider">GIPHY</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GifPicker;
