import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../services/authApi';
import CyberBackground from '../components/CyberBackground';

// ─── Login Page ───────────────────────────────────────────────────────────────
export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [mode, setMode] = useState('password'); // 'password' | 'otp'
    const [step, setStep] = useState('form'); // 'form' | 'otp'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [devOtp, setDevOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const data = await authApi.loginWithPassword(email, password);
            login(data);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const data = await authApi.sendOtp(email);
            setStep('otp');
            setSuccessMsg('OTP sent!');
            if (data.dev_otp) setDevOtp(data.dev_otp);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpLogin = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const data = await authApi.loginWithOtp(email, otp);
            login(data);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'relative', width: '100vw', height: '100vh',
            background: '#030a06', overflow: 'hidden',
            fontFamily: "'Inter', 'Segoe UI', sans-serif"
        }}>
            <CyberBackground />

            {/* Overlay gradient */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 1,
                background: 'radial-gradient(ellipse at 50% 50%, rgba(0,255,136,0.04) 0%, rgba(3,10,6,0.7) 70%)',
                pointerEvents: 'none'
            }} />

            {/* Login Card */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
            }}>
                <div style={{
                    width: '100%', maxWidth: 440,
                    background: 'rgba(10,18,12,0.85)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0,255,136,0.2)',
                    borderRadius: 16,
                    padding: '40px 36px',
                    boxShadow: '0 0 60px rgba(0,255,136,0.08), 0 24px 64px rgba(0,0,0,0.6)'
                }}>
                    {/* Header */}
                    <div style={{ marginBottom: 32, textAlign: 'center' }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 52, height: 52, borderRadius: 12,
                            background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,170,255,0.1))',
                            border: '1px solid rgba(0,255,136,0.3)', marginBottom: 16
                        }}>
                            <span style={{ fontSize: 24 }}>🔐</span>
                        </div>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.3px' }}>
                            API Security Monitor
                        </h1>
                        <p style={{ margin: '6px 0 0', color: '#4a7a5e', fontSize: 13 }}>
                            Secure access. Real-time threat intelligence.
                        </p>
                    </div>

                    {/* Mode toggle tabs */}
                    <div style={{
                        display: 'flex', background: 'rgba(0,0,0,0.4)',
                        borderRadius: 8, padding: 3, marginBottom: 28,
                        border: '1px solid rgba(0,255,136,0.1)'
                    }}>
                        {['password', 'otp'].map(m => (
                            <button key={m} onClick={() => { setMode(m); setStep('form'); setError(''); setDevOtp(''); }}
                                style={{
                                    flex: 1, padding: '8px 0', border: 'none', borderRadius: 6,
                                    cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
                                    background: mode === m ? 'linear-gradient(135deg, #00ff88, #00cc6a)' : 'transparent',
                                    color: mode === m ? '#0a120c' : '#4a7a5e',
                                }}>
                                {m === 'password' ? '🔑 Password' : '📱 OTP Login'}
                            </button>
                        ))}
                    </div>

                    {/* ── Password Login Form ── */}
                    {mode === 'password' && (
                        <form onSubmit={handlePasswordLogin}>
                            <InputField label="Email" type="email" value={email}
                                onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                            <InputField label="Password" type="password" value={password}
                                onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                            {error && <ErrorMsg msg={error} />}
                            <SubmitButton loading={loading} label="Sign In" />
                        </form>
                    )}

                    {/* ── OTP Login Form ── */}
                    {mode === 'otp' && step === 'form' && (
                        <form onSubmit={handleSendOtp}>
                            <InputField label="Email" type="email" value={email}
                                onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                            {error && <ErrorMsg msg={error} />}
                            <SubmitButton loading={loading} label="Send OTP →" />
                        </form>
                    )}

                    {mode === 'otp' && step === 'otp' && (
                        <form onSubmit={handleOtpLogin}>
                            <p style={{ color: '#00ff88', fontSize: 13, marginBottom: 16 }}>
                                ✅ OTP sent to <strong>{email}</strong>
                            </p>
                            {devOtp && (
                                <div style={{
                                    background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.2)',
                                    borderRadius: 8, padding: '10px 14px', marginBottom: 16
                                }}>
                                    <p style={{ color: '#00ff88', fontSize: 12, margin: 0, fontFamily: 'monospace' }}>
                                        🛠 DEV MODE — Your OTP: <strong style={{ fontSize: 18, letterSpacing: 4 }}>{devOtp}</strong>
                                    </p>
                                </div>
                            )}
                            <InputField label="Enter OTP" type="text" value={otp}
                                onChange={e => setOtp(e.target.value)} placeholder="123456"
                                maxLength={6} style={{ letterSpacing: 8, textAlign: 'center', fontSize: 22 }} />
                            {error && <ErrorMsg msg={error} />}
                            <SubmitButton loading={loading} label="Verify & Sign In" />
                            <button type="button" onClick={() => { setStep('form'); setDevOtp(''); setError(''); }}
                                style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: '#4a7a5e', cursor: 'pointer', fontSize: 13 }}>
                                ← Change email
                            </button>
                        </form>
                    )}

                    {/* Footer */}
                    <p style={{ textAlign: 'center', marginTop: 24, color: '#3a5a46', fontSize: 13 }}>
                        No account?{' '}
                        <Link to="/register" style={{ color: '#00ff88', textDecoration: 'none', fontWeight: 600 }}>
                            Register here
                        </Link>
                    </p>
                </div>
            </div>

            {/* Scanline effect */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.01) 2px, rgba(0,255,136,0.01) 4px)',
            }} />
        </div>
    );
}

// ─── Reusable sub-components ──────────────────────────────────────────────────
function InputField({ label, type, value, onChange, placeholder, maxLength, style: extraStyle }) {
    const [focused, setFocused] = useState(false);
    return (
        <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', color: '#4a7a5e', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                maxLength={maxLength}
                required
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                    width: '100%', padding: '11px 14px', boxSizing: 'border-box',
                    background: 'rgba(0,0,0,0.5)',
                    border: `1px solid ${focused ? 'rgba(0,255,136,0.5)' : 'rgba(0,255,136,0.15)'}`,
                    borderRadius: 8, color: '#e0ffe8', fontSize: 15, outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: focused ? '0 0 0 3px rgba(0,255,136,0.07)' : 'none',
                    fontFamily: 'inherit',
                    ...extraStyle
                }}
            />
        </div>
    );
}

function ErrorMsg({ msg }) {
    return (
        <div style={{
            background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.25)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ff6464', fontSize: 13
        }}>
            ⚠ {msg}
        </div>
    );
}

function SubmitButton({ loading, label }) {
    return (
        <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px 0', marginTop: 4,
            background: loading
                ? 'rgba(0,255,136,0.3)'
                : 'linear-gradient(135deg, #00ff88, #00cc6a)',
            border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
            color: '#0a120c', fontWeight: 700, fontSize: 15, fontFamily: 'inherit',
            transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 4px 20px rgba(0,255,136,0.25)',
            letterSpacing: 0.3
        }}>
            {loading ? '◌ Processing...' : label}
        </button>
    );
}
