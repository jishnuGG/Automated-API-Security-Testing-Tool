import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1/auth';

const api = axios.create({ baseURL: API_BASE });

export const registerUser = async (name, email, password) => {
    const { data } = await api.post('/register', { name, email, password });
    return data; // may include dev_otp in dev mode
};

export const verifyOtp = async (email, otp) => {
    const { data } = await api.post('/verify-otp', { email, otp });
    return data; // Token response
};

export const loginWithPassword = async (email, password) => {
    const { data } = await api.post('/login', { email, password });
    return data; // Token response
};

export const sendOtp = async (email) => {
    const { data } = await api.post('/send-otp', { email });
    return data; // may include dev_otp in dev mode
};

export const loginWithOtp = async (email, otp) => {
    const { data } = await api.post('/login-otp', { email, otp });
    return data; // Token response
};
