import axios from 'axios';

const API_Base = 'http://localhost:8000/api/v1';

// ─── Axios instance with auth interceptor ────────────────────
const api = axios.create({ baseURL: API_Base });

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: handle 401 (expired/invalid token)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear auth state and redirect to login
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ─── API endpoints ───────────────────────────────────────────

export const fetchLogs = async (limit = 500) => {
    try {
        const response = await api.get('/logs', { params: { limit } });
        return response.data;
    } catch (error) {
        console.error("Error fetching logs:", error);
        return [];
    }
};

export const fetchStats = async () => {
    try {
        const response = await api.get('/stats');
        return response.data;
    } catch (error) {
        console.error("Error fetching stats:", error);
        return {};
    }
};

// ─── Website-level endpoints ─────────────────────────────────

export const fetchWebsites = async (limit = 100) => {
    try {
        const response = await api.get('/websites', { params: { limit } });
        return response.data;
    } catch (error) {
        console.error("Error fetching websites:", error);
        return [];
    }
};

export const fetchWebsiteDetail = async (domain) => {
    try {
        const response = await api.get(`/websites/${encodeURIComponent(domain)}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching website detail for ${domain}:`, error);
        return null;
    }
};

export const fetchHighRiskLogs = async (domain, limit = 50) => {
    try {
        const response = await api.get(
            `/websites/${encodeURIComponent(domain)}/high-risk`,
            { params: { limit } }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching high-risk logs for ${domain}:`, error);
        return [];
    }
};
