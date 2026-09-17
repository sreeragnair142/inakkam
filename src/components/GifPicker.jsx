import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TENOR_API_KEY = import.meta.env.VITE_TENOR_API_KEY || '';
const TENOR_BASE_URL = 'https://tenor.googleapis.com/v2';

// Built-in reaction GIFs that work instantly without any API key
const CURATED_REACTION_GIFS = [
  { id: 'love_heart', url: 'https://media.giphy.com/media/26BRv0ThflsDTjq4E/giphy.gif', desc: 'Heart Love' },
  { id: 'flying_kiss', url: 'https://media.giphy.com/media/l41lT4n6ylgW2hh04/giphy.gif', desc: 'Kiss Love' },
  { id: 'applause_clap', url: 'https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/giphy.gif', desc: 'Cheers Celebration' },
  { id: 'laugh_cry', url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif', desc: 'Haha Laugh' },
  { id: 'cute_dance', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif', desc: 'Happy Dance' },
  { id: 'party_popper', url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif', desc: 'Party Confetti' },
  { id: 'sparkle_wow', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', desc: 'Wow Shock' },
  { id: 'thumbs_up', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif', desc: 'Thumbs Up Cool' },
  { id: 'cute_hug', url: 'https://media.giphy.com/media/3oEdv4hwWTzBhWvaU0/giphy.gif', desc: 'Warm Hug' },
  { id: 'fire_flame', url: 'https://media.giphy.com/media/nrXif9YExO9EI/giphy.gif', desc: 'Fire Lit' },
  { id: 'hello_wave', url: 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif', desc: 'Hello Wave' },
  { id: 'mind_blown', url: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif', desc: 'Mind Blown' },
];

const GifPicker = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const getFallbackGifs = useCallback((searchTerm = '') => {
    if (!searchTerm) return CURATED_REACTION_GIFS;
    const s = searchTerm.toLowerCase();
    const filtered = CURATED_REACTION_GIFS.filter(g => g.desc.toLowerCase().includes(s));
    return filtered.length > 0 ? filtered : CURATED_REACTION_GIFS;
  }, []);

  const fetchGifs = useCallback(async (searchTerm = '') => {
    if (!TENOR_API_KEY || TENOR_API_KEY === 'YOUR_TENOR_API_KEY_HERE') {
      setGifs(getFallbackGifs(searchTerm));
      return;
    }

    setLoading(true);
    try {
      const endpoint = searchTerm ? 'search' : 'featured';
      const params = new URLSearchParams({
        key: TENOR_API_KEY,
        client_key: 'inakkam_app',
        limit: '20',
        media_filter: 'tinygif,gif',
      });
      if (searchTerm) params.set('q', searchTerm);
      
      const res = await fetch(`${TENOR_BASE_URL}/${endpoint}?${params}`);
      if (!res.ok) throw new Error('API key invalid or blocked');
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setGifs(data.results);
      } else {
        setGifs(getFallbackGifs(searchTerm));
      }
    } catch (err) {
      console.warn('Tenor API fetch error, using built-in reaction GIFs:', err);
      setGifs(getFallbackGifs(searchTerm));
    } finally {
      setLoading(false);
    }
  }, [getFallbackGifs]);

  useEffect(() => {
    if (isOpen) fetchGifs();
  }, [isOpen, fetchGifs]);

  const handleSearch = (text) => {
    setQuery(text);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => fetchGifs(text), 400);
    setDebounceTimer(timer);
  };

  const getGifUrl = (gif) => {
    return gif?.url || gif?.media_formats?.tinygif?.url || gif?.media_formats?.gif?.url || '';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[320px] max-h-[400px] bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="text-xs font-bold text-white uppercase tracking-wider">Send GIF</span>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              type="text"
              placeholder="Search GIFs..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-white/10 text-white text-xs rounded-xl pl-9 pr-3 py-2.5 placeholder:text-white/30 outline-none focus:ring-1 focus:ring-[#D51659]/50 border border-white/5"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-[#D51659] animate-spin" />
            </div>
          ) : gifs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-white/30 text-xs">No GIFs found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => {
                    onSelect(getGifUrl(gif));
                    onClose();
                  }}
                  className="rounded-xl overflow-hidden hover:ring-2 hover:ring-[#D51659] transition-all cursor-pointer group"
                >
                  <img
                    src={getGifUrl(gif)}
                    alt={gif.content_description || gif.desc || 'GIF'}
                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tenor attribution */}
        <div className="px-3 py-2 border-t border-white/5 text-center">
          <span className="text-[9px] text-white/20">Powered by Tenor</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GifPicker;
