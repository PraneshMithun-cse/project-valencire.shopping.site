import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconUser, IconMail, IconLock, Eye, EyeOff } from './Icons';

// Helper for Input Field
const InputField = ({ type, placeholder, value, onChange, icon: Icon, onKeyDown }) => (
    <div className="relative group">
        <Icon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-white" size={20} />
        <input
            itemProp={type === "email" ? "email" : undefined}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-4 text-xs font-medium tracking-widest text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all hover:bg-white/10"
        />
    </div>
);

const ValencireAuthSystem = () => {
    const API_BASE = 'http://localhost:3000/api';
    const navigate = useNavigate();
    const location = useLocation();

    // Check for query params to set initial view
    const searchParams = new URLSearchParams(location.search);
    const initialAction = searchParams.get('action');

    const [view, setView] = useState(initialAction === 'signin' ? 'signin' : 'landing');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Check session on mount
    useEffect(() => {
        const token = localStorage.getItem('valencire_token');
        if (token && view === 'landing') {
            navigate('/dashboard');
        }
    }, [navigate, view]);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);

    // Forgot/Reset Password Stages
    const [resetPassword, setResetPassword] = useState('');
    const [resetConfirmPassword, setResetConfirmPassword] = useState('');

    // Auth Logic
    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('valencire_token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Check if user is admin
                const redirectPath = data.user.isAdmin === 1 ? '/admin' : '/dashboard';

                // Check post-login action
                const postAction = localStorage.getItem('post_login_action');
                if (postAction === 'checkout') {
                    localStorage.removeItem('post_login_action');
                    navigate(redirectPath);
                } else {
                    navigate(redirectPath);
                }
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Connection failed");
        }
    };

    const handleSignin = async (e) => {
        e?.preventDefault();
        setError('');

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, password: formData.password })
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('valencire_token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Check if user is admin
                const redirectPath = data.user.isAdmin === 1 ? '/admin' : '/dashboard';

                const postAction = localStorage.getItem('post_login_action');
                if (postAction === 'checkout') {
                    localStorage.removeItem('post_login_action');
                    // Go back to cart (which is separate HTML file for now, but we can link to it)
                    window.location.href = './pages/cart.html';
                } else {
                    navigate(redirectPath);
                }

            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Connection failed");
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        try {
            const res = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email })
            });
            const data = await res.json();
            if (data.success) {
                setSuccessMsg(data.message);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Request failed");
        }
    };

    // Render Views
    if (view === 'landing') {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center fade-in">
                    <div className="mb-16">
                        <h1 className="text-4xl font-light tracking-[0.3em] mb-4">VALENCIRÉ®</h1>
                        <p className="text-[10px] tracking-[0.4em] text-gray-400 uppercase">Crafted for the Extraordinary</p>
                    </div>

                    <div className="space-y-4">
                        <button onClick={() => setView('signin')} className="w-full py-4 bg-white text-black font-medium tracking-widest text-xs rounded-full hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                            SIGN IN
                        </button>
                        <button onClick={() => setView('signup')} className="w-full py-4 bg-transparent border border-white/20 text-white font-medium tracking-widest text-xs rounded-full hover:bg-white hover:text-black transition-all">
                            BECOME A MEMBER
                        </button>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5">
                        <a href="./pages/product.html" className="text-[10px] tracking-widest text-gray-500 hover:text-white transition-colors">
                            ENTER AS GUEST
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'signin' || view === 'signup') {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl relative fade-in shadow-2xl">
                    <button onClick={() => setView('landing')} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">✕</button>

                    <div className="text-center mb-10">
                        <h2 className="text-xl font-light tracking-widest mb-2">{view === 'signin' ? 'WELCOME BACK' : 'CREATE ACCOUNT'}</h2>
                        <p className="text-xs text-gray-500 tracking-wider">{view === 'signin' ? 'Sign in to access your dashboard' : 'Join the exclusive community'}</p>
                    </div>

                    <form onSubmit={view === 'signin' ? handleSignin : handleSignup} className="space-y-5">
                        {view === 'signup' && (
                            <div className="grid grid-cols-2 gap-4">
                                <InputField
                                    type="text" placeholder="First Name" value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    icon={IconUser}
                                />
                                <InputField
                                    type="text" placeholder="Last Name" value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    icon={IconUser}
                                />
                            </div>
                        )}

                        <InputField
                            type="email" placeholder="Email Address" value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            icon={IconMail}
                        />

                        <div className="relative">
                            <InputField
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                icon={IconLock}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                {showPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>

                        {view === 'signup' && (
                            <InputField
                                type="password" placeholder="Confirm Password" value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                icon={IconLock}
                            />
                        )}

                        {view === 'signin' && (
                            <div className="flex justify-end">
                                <button type="button" onClick={() => setView('forgot-password')} className="text-xs text-gray-400 hover:text-white transition-colors">
                                    Forgot Password?
                                </button>
                            </div>
                        )}

                        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

                        <button type="submit" className="w-full py-4 bg-white text-black font-medium tracking-widest text-xs rounded-full hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                            {view === 'signin' ? 'ENTER' : 'JOIN VALENCIRÉ®'}
                        </button>

                        <div className="pt-6 text-center border-t border-white/10">
                            <p className="text-xs text-gray-500 mb-2">
                                {view === 'signin' ? "Don't have an account?" : "Already a member?"}
                            </p>
                            <button type="button" onClick={() => setView(view === 'signin' ? 'signup' : 'signin')} className="text-xs text-white tracking-widest hover:opacity-80 transition-opacity">
                                {view === 'signin' ? 'CREATE ACCOUNT' : 'SIGN IN'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (view === 'forgot-password') {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl relative">
                    <button onClick={() => setView('signin')} className="absolute top-6 right-6 text-gray-500 hover:text-white">✕</button>

                    <h2 className="text-xl font-light tracking-widest mb-2 text-center">RECOVER ACCOUNT</h2>
                    <p className="text-xs text-gray-500 text-center mb-8">Enter your email to receive a reset link</p>

                    {successMsg ? (
                        <div className="text-center">
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm mb-6">
                                {successMsg}
                            </div>
                            <button onClick={() => setView('signin')} className="text-xs text-gray-400 hover:text-white underline">Back to Sign In</button>
                        </div>
                    ) : (
                        <form onSubmit={handleForgotPassword} className="space-y-6">
                            <InputField
                                type="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                icon={IconMail}
                            />
                            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                            <button type="submit" className="w-full py-4 bg-white text-black font-medium tracking-widest text-xs rounded-full hover:bg-gray-200 transition-all">
                                SEND RESET LINK
                            </button>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return null;
};

export default ValencireAuthSystem;
