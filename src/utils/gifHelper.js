// Reliable evergreen GIF for fallbacks (Heart Love)
export const EVERGREEN_FALLBACK_GIF = 'https://media.giphy.com/media/paXjnIZYvglz2/giphy.gif';

export const resolveGifMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // If broken/deleted GIPHY IDs are referenced, replace with evergreen fallback
  if (trimmed.includes('26BRv0ThflsDTjq4E') || trimmed.includes('l41lT4n6ylgW2hh04')) {
    return EVERGREEN_FALLBACK_GIF;
  }

  // Handle truncated or broken media.giphy URLs
  if (trimmed.startsWith('https://media') && (trimmed.endsWith('giphy') || !trimmed.includes('.com'))) {
    return EVERGREEN_FALLBACK_GIF;
  }

  // Extract ID if user pasted a Giphy webpage link (e.g. https://giphy.com/gifs/slug-abc123XYZ or https://giphy.com/gifs/abc123XYZ)
  const giphyWebMatch = trimmed.match(/giphy\.com\/gifs\/(?:.*-)?([a-zA-Z0-9]+)/i);
  if (giphyWebMatch && giphyWebMatch[1]) {
    return `https://media.giphy.com/media/${giphyWebMatch[1]}/giphy.gif`;
  }

  return trimmed;
};
