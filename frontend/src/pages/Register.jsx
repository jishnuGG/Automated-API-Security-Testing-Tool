import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../services/authApi';

export default function Register() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState('form'); // 'form' | 'otp'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [devOtp, setDevOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
        setLoading(true);
        try {
            const data = await authApi.registerUser(name, email, password);
            setStep('otp');
            if (data.dev_otp) setDevOtp(data.dev_otp);
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const data = await authApi.verifyOtp(email, otp);
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
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #030a06 0%, #050d09 50%, #030a06 100%)',
            fontFamily: "'Inter', 'Segoe UI', sans-serif", padding: 20
        }}>
            {/* Animated gradient orbs */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none'
            }}>
                <div style={{
                    position: 'absolute', width: 500, height: 500, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)',
                    top: -100, left: -100, animation: 'orbFloat1 12s ease-in-out infinite'
                }} />
                <div style={{
                    position: 'absolute', width: 400, height: 400, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0,170,255,0.05) 0%, transparent 70%)',
                    bottom: -80, right: -80, animation: 'orbFloat2 15s ease-in-out infinite'
                }} />
            </div>

            <style>{`
                @keyframes orbFloat1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(60px,40px)} }
                @keyframes orbFloat2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-50px,-30px)} }
            `}</style>

            <div style={{
                position: 'relative', zIndex: 1,
                width: '100%', maxWidth: 460,
                background: 'rgba(10,18,12,0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,255,136,0.2)',
                borderRadius: 16, padding: '40px 36px',
                boxShadow: '0 0 60px rgba(0,255,136,0.07), 0 24px 60px rgba(0,0,0,0.7)'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 52, height: 52, borderRadius: 12, marginBottom: 14,
                        background: 'linear-gradient(135deg, rgba(0,255,136,0.12), rgba(0,170,255,0.08))',
                        border: '1px solid rgba(0,255,136,0.25)'
                    }}>
                        <span style={{ fontSize: 24 }}>🛡️</span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>Create Account</h1>
                    <p style={{ margin: '6px 0 0', color: '#4a7a5e', fontSize: 13 }}>
                        {step === 'form' ? 'Fill in your details to get started' : 'Check your email for the OTP'}
                    </p>
                </div>

                {/* Progress indicator */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
                    {['Account Info', 'Verify Email'].map((s, i) => (
                        <div key={i} style={{ flex: 1 }}>
                            <div style={{
                                height: 3, borderRadius: 2,
                                background: i === 0 || step === 'otp'
                                    ? 'linear-gradient(90deg, #00ff88, #00cc6a)'
                                    : 'rgba(0,255,136,0.15)',
                                transition: 'background 0.4s'
                            }} />
                            <p style={{ margin: '5px 0 0', fontSize: 11, color: i === 0 || step === 'otp' ? '#00ff88' : '#3a5a46' }}>
                                {s}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── Step 1: Registration Form ── */}
                {step === 'form' && (
                    <form onSubmit={handleRegister}>
                        <RField label="Full Name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
                        <RField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                        <RField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" />
                        <RField label="Confirm Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" />

                        {/* Password strength indicator */}
                        {password.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                                    <div style={{
                                        height: '100%', borderRadius: 2, transition: 'width 0.3s, background 0.3s',
                                        width: `${Math.min(password.length / 12 * 100, 100)}%`,
                                        background: password.length < 8 ? '#ff4444' : password.length < 12 ? '#ffaa00' : '#00ff88'
                                    }} />
                                </div>
                                <p style={{ fontSize: 11, margin: '4px 0 0', color: password.length < 8 ? '#ff6464' : password.length < 12 ? '#ffaa44' : '#00ff88' }}>
                                    {password.length < 8 ? 'Too short' : password.length < 12 ? 'Good' : 'Strong ✓'}
                                </p>
                            </div>
                        )}

                        {error && <RErrorMsg msg={error} />}
                        <RSubmitBtn loading={loading} label="Continue →" />
                    </form>
                )}

                {/* ── Step 2: OTP Verification ── */}
                {step === 'otp' && (
                    <form onSubmit={handleVerifyOtp}>
                        <p style={{ color: '#00ff88', fontSize: 13, marginBottom: 16 }}>
                            ✅ Verification code sent to <strong>{email}</strong>
                        </p>
                        {devOtp && (
                            <div style={{
                                background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.2)',
                                borderRadius: 8, padding: '10px 14px', marginBottom: 16
                            }}>
                                <p style={{ color: '#00ff88', fontSize: 12, margin: 0, fontFamily: 'monospace' }}>
                                    🛠 DEV MODE — OTP: <strong style={{ fontSize: 20, letterSpacing: 4 }}>{devOtp}</strong>
                                </p>
                            </div>
                        )}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', color: '#4a7a5e', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                Enter 6-digit OTP
                            </label>
                            <input
                                type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000" maxLength={6} required
                                style={{
                                    width: '100%', padding: '14px', boxSizing: 'border-box',
                                    background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,136,0.3)',
                                    borderRadius: 8, color: '#e0ffe8', fontSize: 28, letterSpacing: 12,
                                    textAlign: 'center', outline: 'none', fontFamily: 'monospace'
                                }}
                            />
                        </div>
                        {error && <RErrorMsg msg={error} />}
                        <RSubmitBtn loading={loading} label="Verify & Create Account" />
                        <button type="button" onClick={() => { setStep('form'); setError(''); setDevOtp(''); }}
                            style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: '#4a7a5e', cursor: 'pointer', fontSize: 13 }}>
                            ← Back
                        </button>
                    </form>
                )}

                <p style={{ textAlign: 'center', marginTop: 24, color: '#3a5a46', fontSize: 13 }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#00ff88', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}

function RField({ label, type, value, onChange, placeholder }) {
    const [focused, setFocused] = useState(false);
    return (
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#4a7a5e', fontSize: 12, fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</label>
            <input type={type} value={value} onChange={onChange} placeholder={placeholder} required
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                style={{
                    width: '100%', padding: '11px 14px', boxSizing: 'border-box',
                    background: 'rgba(0,0,0,0.5)',
                    border: `1px solid ${focused ? 'rgba(0,255,136,0.5)' : 'rgba(0,255,136,0.15)'}`,
                    borderRadius: 8, color: '#e0ffe8', fontSize: 14, outline: 'none',
                    transition: 'border-color 0.2s', fontFamily: 'inherit',
                    boxShadow: focused ? '0 0 0 3px rgba(0,255,136,0.06)' : 'none'
                }} />
        </div>
    );
}

function RErrorMsg({ msg }) {
    return (
        <div style={{
            background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.25)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#ff6464', fontSize: 13
        }}>⚠ {msg}</div>
    );
}

function RSubmitBtn({ loading, label }) {
    return (
        <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px 0',
            background: loading ? 'rgba(0,255,136,0.3)' : 'linear-gradient(135deg, #00ff88, #00cc6a)',
            border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
            color: '#0a120c', fontWeight: 700, fontSize: 15, fontFamily: 'inherit',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(0,255,136,0.25)'
        }}>
            {loading ? '◌ Processing...' : label}
        </button>
    );
}
