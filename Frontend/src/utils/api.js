import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

// Attach token to every request
API.interceptors.request.use((config) => {
    // Check admin key first if on admin page, then fall back to customer key
    const isAdminPage = window.location.pathname.startsWith('/admin');
    const stored = localStorage.getItem(isAdminPage ? 'buyzera_admin' : 'buyzera_customer')
        || localStorage.getItem('buyzera_admin')
        || localStorage.getItem('buyzera_customer');
    if (stored) {
        const { token } = JSON.parse(stored);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default API;
