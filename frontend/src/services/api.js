import axios from 'axios';

const API_Base = 'http://localhost:8000/api/v1';

// ─── Existing endpoints (updated to work with new backend) ───

export const fetchLogs = async (limit = 500) => {
    try {
        const response = await axios.get(`${API_Base}/logs`, { params: { limit } });
        return response.data;
    } catch (error) {
        console.error("Error fetching logs:", error);
        return [];
    }
};

export const fetchStats = async () => {
    try {
        const response = await axios.get(`${API_Base}/stats`);
        return response.data;
    } catch (error) {
        console.error("Error fetching stats:", error);
        return {};
    }
};

// ─── New website-level endpoints ─────────────────────────────

export const fetchWebsites = async (limit = 100) => {
    try {
        const response = await axios.get(`${API_Base}/websites`, { params: { limit } });
        return response.data;
    } catch (error) {
        console.error("Error fetching websites:", error);
        return [];
    }
};

export const fetchWebsiteDetail = async (domain) => {
    try {
        const response = await axios.get(`${API_Base}/websites/${encodeURIComponent(domain)}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching website detail for ${domain}:`, error);
        return null;
    }
};

export const fetchHighRiskLogs = async (domain, limit = 50) => {
    try {
        const response = await axios.get(
            `${API_Base}/websites/${encodeURIComponent(domain)}/high-risk`,
            { params: { limit } }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching high-risk logs for ${domain}:`, error);
        return [];
    }
};
