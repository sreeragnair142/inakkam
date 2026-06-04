/**
 * Normalizes backend user data to the format expected by the frontend UI.
 * Handles field name differences like 'photos' -> 'images' and '_id' -> 'id'.
 */
export const mapUser = (user) => {
    if (!user) return null;

    return {
        ...user,
        id: user._id || user.id,
        // Map backend 'photos' array of objects to frontend 'images' array of strings
        images: user.photos ? user.photos.map(p => typeof p === 'string' ? p : p.url) : (user.images || []),
        // Fallback for match percentage if missing
        matchPercentage: user.matchPercentage || Math.floor(Math.random() * 30) + 70,
        // Fallback for distance
        distance: user.distance || 'Nearby',
    };
};

export const mapUsers = (users) => {
    if (!Array.isArray(users)) return [];
    return users.map(mapUser);
};
