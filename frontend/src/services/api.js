import axios from 'axios';

const API_Base = 'http://localhost:8000/api/v1';

export const fetchLogs = async (limit = 100) => {
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

