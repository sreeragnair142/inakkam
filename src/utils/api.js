import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Proxy handles the rest
    withCredentials: true, // Send cookies if any
    headers: {
        'Content-Type': 'application/json',
    },
});

// Inject Authorization header if token exists
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

// Unified error response handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized globally
        if (error.response?.status === 401) {
            localStorage.removeItem('inakkam_token');
            // Optional: window.location.href = '/login';
        }

        // Format error message for backend responses
        const message = error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject(message);
    }
);

export default api;
