// Helper to extract GIPHY ID from any GIPHY URL format
export const extractGiphyId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const s = url.trim();

  // Pattern 1: https://i.giphy.com/{id}.gif or https://i.giphy.com/{id}
  const iMatch = s.match(/i\.giphy\.com\/(?:media\/)?([a-zA-Z0-9_-]+?)(?:\.gif|\/|$|\?)/i);
  if (iMatch && iMatch[1] && iMatch[1] !== 'media') return iMatch[1];

  // Pattern 2: media*.giphy.com/media/v1.[^/]+/{id}/... (modern GIPHY API v1 format)
  const mediaV1Match = s.match(/media[0-9]?\.giphy\.com\/media\/v1\.[^/]+\/([a-zA-Z0-9_-]+)\//i);
  if (mediaV1Match && mediaV1Match[1]) return mediaV1Match[1];

  // Pattern 3: media*.giphy.com/media/{id}/... (direct format, ensure it is not 'v1.')
  const mediaDirectMatch = s.match(/media[0-9]?\.giphy\.com\/media\/([a-zA-Z0-9_-]+)\//i);
  if (mediaDirectMatch && mediaDirectMatch[1] && !mediaDirectMatch[1].startsWith('v1.')) return mediaDirectMatch[1];

  // Pattern 4: giphy.com/gifs/{slug}-{id} or giphy.com/gifs/{id} or giphy.com/embed/{id}
  const webMatch = s.match(/giphy\.com\/(?:gifs|embed)\/(?:.*-)?([a-zA-Z0-9_-]+)(?:\/|$|\?)/i);
  if (webMatch && webMatch[1]) return webMatch[1];

  return null;
};

// Validates whether a string is a GIF or media link
export const isMediaGifStr = (str) => {
  if (!str || typeof str !== 'string') return false;
  const s = str.trim().toLowerCase();
  return (
    s.includes('giphy') ||
    s.includes('tenor') ||
    s.includes('.gif') ||
    s.includes('.webp') ||
    ((s.startsWith('http://') || s.startsWith('https://')) && (s.includes('/media') || s.includes('image')))
  );
};

// Alternative mirror URLs for the EXACT SAME GIF ID to retry on error without altering the user's GIF
export const getAlternativeGiphyUrls = (url) => {
  const id = extractGiphyId(url);
  if (!id) return [];
  return [
    `https://i.giphy.com/${id}.gif`,
    `https://media.giphy.com/media/${id}/giphy.gif`,
    `https://media0.giphy.com/media/${id}/200.gif`,
    `https://media1.giphy.com/media/${id}/200.gif`,
    `https://media2.giphy.com/media/${id}/200.gif`,
  ];
};

// Resolves and cleans any GIF URL into a reliable direct image link
export const resolveGifMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // If user passed a GIPHY link (web, api, or direct), convert to direct i.giphy.com CDN URL
  const giphyId = extractGiphyId(trimmed);
  if (giphyId) {
    return `https://i.giphy.com/${giphyId}.gif`;
  }

  return trimmed;
};
