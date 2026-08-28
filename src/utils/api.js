import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // Send httpOnly cookies (refresh token)
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Request: inject access token ────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('inakkam_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response: auto-refresh token on 401 ─────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retried & not the refresh endpoint itself
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/refresh')
        ) {
            if (isRefreshing) {
                // Queue requests while token is refreshing
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Try to get a new access token using the httpOnly refresh cookie
                const { data } = await axios.post(
                    `${BASE_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );
                const newToken = data.token;
                localStorage.setItem('inakkam_token', newToken);
                api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                processQueue(null, newToken);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem('inakkam_token');
                // Only redirect to login if not already there
                if (!window.location.pathname.includes('/auth')) {
                    window.location.href = '/auth';
                }
                return Promise.reject('Session expired. Please log in again.');
            } finally {
                isRefreshing = false;
            }
        }

        // Format error message for backend responses
        const message = error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject(message);
    }
);

export default api;
