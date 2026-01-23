import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Package, MapPin, IconUser, IconLock, ChevronRight } from '../components/Icons';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('home'); // 'home', 'orders', 'settings'

    // Change Password State
    const [pwdData, setPwdData] = useState({ currentPassword: '', newPassword: '' });
    const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem('valencire_token');
            if (!token) {
                navigate('/');
                return;
            }

            try {
                // Fetch User
                const userRes = await fetch('http://localhost:3000/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const userData = await userRes.json();

                if (!userData.success) {
                    localStorage.removeItem('valencire_token');
                    navigate('/');
                    return;
                }
                setUser(userData.user);

                // Fetch Orders
                const orderRes = await fetch('http://localhost:3000/api/orders', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const orderData = await orderRes.json();
                if (orderData.success) {
                    setOrders(orderData.orders);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('valencire_token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPwdMsg({ type: '', text: '' });
        const token = localStorage.getItem('valencire_token');

        try {
            const res = await fetch('http://localhost:3000/api/users/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(pwdData)
            });
            const data = await res.json();
            setPwdMsg({ type: data.success ? 'success' : 'error', text: data.message });
            if (data.success) {
                setPwdData({ currentPassword: '', newPassword: '' });
            }
        } catch (err) {
            setPwdMsg({ type: 'error', text: 'Failed to update password' });
        }
    };

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-black text-white font-sans p-4 md:p-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto flex justify-between items-center mb-16">
                <h1 className="text-2xl font-light tracking-[0.2em] uppercase">MY ACCOUNT</h1>
                <button onClick={handleLogout} className="text-xs tracking-widest opacity-50 hover:opacity-100 transition-opacity">
                    SIGN OUT
                </button>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">

                {/* LEFT SIDEBAR */}
                <div className="md:col-span-4 space-y-8">
                    {/* Profile Card */}
                    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                        <div className="relative z-10 text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-black rounded-full mx-auto mb-6 flex items-center justify-center border border-white/10 shadow-2xl">
                                <span className="text-2xl font-light text-white uppercase">
                                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                                </span>
                            </div>
                            <h2 className="text-lg font-medium tracking-wide mb-1 capitalize">{user?.firstName} {user?.lastName}</h2>
                            <p className="text-xs text-gray-500 tracking-widest mb-6">{user?.email}</p>
                            <div className="inline-block px-4 py-1.5 bg-white/10 rounded-full border border-white/5">
                                <span className="text-[10px] tracking-[0.2em] font-medium text-gray-300">MEMBER</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8">
                        <h3 className="text-xs font-bold tracking-widest text-gray-500 mb-6">QUICK ACTIONS</h3>
                        <div className="space-y-4">
                            <button
                                onClick={() => setActiveView('home')}
                                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${activeView === 'home' ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'}`}
                            >
                                <span className="text-sm font-light">Dashboard</span>
                                <ChevronRight size={16} className="text-gray-500 group-hover:text-white transition-colors" />
                            </button>
                            <button
                                onClick={() => setActiveView('orders')}
                                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${activeView === 'orders' ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'}`}
                            >
                                <span className="text-sm font-light">Order History</span>
                                <ChevronRight size={16} className="text-gray-500 group-hover:text-white transition-colors" />
                            </button>
                            <button
                                onClick={() => setActiveView('settings')}
                                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${activeView === 'settings' ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'}`}
                            >
                                <span className="text-sm font-light">Account Settings</span>
                                <ChevronRight size={16} className="text-gray-500 group-hover:text-white transition-colors" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT CONTENT AREA */}
                <div className="md:col-span-8 space-y-8">

                    {/* HOME VIEW */}
                    {activeView === 'home' && (
                        <>
                            {/* Welcome Banner */}
                            <div className="bg-gradient-to-r from-white/10 to-transparent border border-white/10 rounded-3xl p-10 relative overflow-hidden">
                                <h2 className="text-3xl font-light tracking-wide mb-4 capitalize">Hello, {user?.firstName}</h2>
                                <p className="text-gray-400 font-light max-w-lg leading-relaxed text-sm">
                                    Welcome to your personal dashboard. Track your orders, manage your preferences, and access exclusive member benefits here.
                                </p>
                                <div className="mt-8 flex gap-4">
                                    <button onClick={() => navigate('/')} className="px-8 py-3 bg-white text-black text-xs font-bold tracking-widest rounded-full hover:bg-gray-200 transition-colors">
                                        BROWSE COLLECTION
                                    </button>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setActiveView('orders')}>
                                    <div className="text-4xl font-light mb-2">{orders.length}</div>
                                    <div className="text-xs text-gray-500 tracking-widest">ACTIVE ORDERS</div>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 opacity-50">
                                    <div className="text-4xl font-light mb-2">0</div>
                                    <div className="text-xs text-gray-500 tracking-widest">SAVED ITEMS</div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ORDERS VIEW */}
                    {activeView === 'orders' && (
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 min-h-[500px]">
                            <h2 className="text-xl font-light tracking-widest mb-8 border-b border-white/10 pb-4">ORDER HISTORY</h2>

                            {orders.length === 0 ? (
                                <div className="text-center py-20">
                                    <Package size={48} className="mx-auto mb-4 opacity-30" />
                                    <p className="tracking-widest text-sm opacity-50 mb-6">NO ORDERS YET</p>
                                    <button onClick={() => navigate('/')} className="px-6 py-2 border border-white/20 rounded-full text-xs tracking-widest hover:bg-white hover:text-black transition-all">
                                        START SHOPPING
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map(order => (
                                        <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group">
                                            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                                                <div>
                                                    <h3 className="text-lg tracking-widest mb-1">ORDER #{order.orderNumber}</h3>
                                                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString()}</p>
                                                </div>
                                                <div className="flex gap-4 items-center">
                                                    <span className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-[10px] tracking-widest uppercase">
                                                        {order.status}
                                                    </span>
                                                    <span className="text-xl font-light">₹{order.total.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div className="border-t border-white/5 pt-6 grid gap-4">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-16 bg-white/10 rounded overflow-hidden">
                                                                <img src={item.image || 'https://via.placeholder.com/50'} alt={item.name} className="w-full h-full object-cover opacity-80" />
                                                            </div>
                                                            <div>
                                                                <p className="tracking-wide">{item.name}</p>
                                                                <p className="text-xs text-gray-500">Size: {item.size} | Qty: {item.quantity}</p>
                                                            </div>
                                                        </div>
                                                        <div className="opacity-60">₹{item.price.toLocaleString()}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SETTINGS VIEW */}
                    {activeView === 'settings' && (
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 min-h-[500px]">
                            <h2 className="text-xl font-light tracking-widest mb-8 border-b border-white/10 pb-4">ACCOUNT SETTINGS</h2>

                            <div className="max-w-md">
                                <h3 className="text-sm tracking-widest mb-6 opacity-70">CHANGE PASSWORD</h3>
                                <form onSubmit={handleChangePassword} className="space-y-6">
                                    <div>
                                        <label className="text-xs tracking-widest text-gray-500 mb-2 block">CURRENT PASSWORD</label>
                                        <input
                                            type="password"
                                            className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white focus:border-white focus:bg-white/10 outline-none transition-all"
                                            value={pwdData.currentPassword}
                                            onChange={(e) => setPwdData({ ...pwdData, currentPassword: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs tracking-widest text-gray-500 mb-2 block">NEW PASSWORD</label>
                                        <input
                                            type="password"
                                            className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white focus:border-white focus:bg-white/10 outline-none transition-all"
                                            value={pwdData.newPassword}
                                            onChange={(e) => setPwdData({ ...pwdData, newPassword: e.target.value })}
                                        />
                                    </div>

                                    {pwdMsg.text && (
                                        <p className={`text-xs ${pwdMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                            {pwdMsg.text}
                                        </p>
                                    )}

                                    <button type="submit" className="px-8 py-3 bg-white text-black rounded-full text-xs tracking-widest font-bold hover:bg-gray-200 transition-colors">
                                        UPDATE PASSWORD
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
