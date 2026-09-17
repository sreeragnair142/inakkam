// Helper to extract GIPHY ID from any GIPHY URL format
export const extractGiphyId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const s = url.trim();

  // Pattern 1: https://i.giphy.com/{id}.gif or https://i.giphy.com/media/{id}/...
  const iMatch = s.match(/i\.giphy\.com\/(?:media\/)?([a-zA-Z0-9]+)(?:\.gif|\/|$)/i);
  if (iMatch && iMatch[1]) return iMatch[1];

  // Pattern 2: media*.giphy.com/.../{id}/(200|giphy|...)\.gif
  const mediaMatch = s.match(/media[0-9]?\.giphy\.com\/(?:media\/|.+?\/)?([a-zA-Z0-9]{8,35})\/(?:200|giphy|original|[0-9]+w)\.gif/i);
  if (mediaMatch && mediaMatch[1]) return mediaMatch[1];

  // Pattern 3: media*.giphy.com/media/{id}/...
  const simpleMediaMatch = s.match(/media[0-9]?\.giphy\.com\/media\/([a-zA-Z0-9]+)/i);
  if (simpleMediaMatch && simpleMediaMatch[1]) return simpleMediaMatch[1];

  // Pattern 4: giphy.com/gifs/{slug}-{id} or giphy.com/gifs/{id}
  const webMatch = s.match(/giphy\.com\/gifs\/(?:.*-)?([a-zA-Z0-9]+)/i);
  if (webMatch && webMatch[1]) return webMatch[1];

  return null;
};

// Alternative mirror URLs for the EXACT SAME GIF ID to retry on error without altering the user's GIF
export const getAlternativeGiphyUrls = (url) => {
  const id = extractGiphyId(url);
  if (!id) return [];
  return [
    `https://i.giphy.com/${id}.gif`,
    `https://media0.giphy.com/media/${id}/200.gif`,
    `https://media1.giphy.com/media/${id}/200.gif`,
    `https://media.giphy.com/media/${id}/giphy.gif`,
  ];
};

// Resolves and cleans any GIF URL while preserving the REAL intended GIF
export const resolveGifMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // If user pasted a GIPHY web link, extract its ID and return direct image link
  const giphyId = extractGiphyId(trimmed);
  if (giphyId) {
    // If it's already a full direct media URL (e.g. from Giphy API), keep it directly
    if (trimmed.includes('/200.gif') || trimmed.includes('/giphy.gif') || trimmed.includes('i.giphy.com')) {
      return trimmed;
    }
    return `https://i.giphy.com/${giphyId}.gif`;
  }

  return trimmed;
};
