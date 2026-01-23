import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, IconUser, Package, ChevronRight } from '../components/Icons';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('overview'); // overview, users, orders
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        const fetchAdminData = async () => {
            const token = localStorage.getItem('valencire_token');
            if (!token) {
                navigate('/');
                return;
            }

            try {
                // Fetch stats
                const statsRes = await fetch('http://localhost:3000/api/admin/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const statsData = await statsRes.json();

                if (!statsData.success) {
                    // Not admin, redirect to regular dashboard
                    navigate('/dashboard');
                    return;
                }

                setStats(statsData.stats);

                // Fetch users
                const usersRes = await fetch('http://localhost:3000/api/admin/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const usersData = await usersRes.json();
                if (usersData.success) setUsers(usersData.users);

                // Fetch orders
                const ordersRes = await fetch('http://localhost:3000/api/admin/orders', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const ordersData = await ordersRes.json();
                if (ordersData.success) setOrders(ordersData.orders);

            } catch (err) {
                console.error(err);
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('valencire_token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This will also delete all their orders.')) {
            return;
        }

        const token = localStorage.getItem('valencire_token');
        try {
            const res = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                setUsers(users.filter(u => u.id !== userId));
                alert('User deleted successfully');
            } else {
                alert(data.message || 'Failed to delete user');
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting user');
        }
    };

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Admin Panel...</div>;

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl tracking-[0.2em] font-light">VALENCIRÉ® <span className="text-xs opacity-50 ml-2">ADMIN PANEL</span></h1>
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/')} className="text-xs tracking-widest hover:text-white/80 transition-colors opacity-80 hover:opacity-100">
                            VIEW STORE
                        </button>
                        <button onClick={handleLogout} className="flex items-center gap-2 text-xs hover:text-red-400 transition-colors tracking-widest">
                            <LogOut size={16} /> LOGOUT
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-6 md:p-12">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-gradient-to-br from-purple-500/20 to-transparent border border-purple-500/30 rounded-3xl p-8">
                        <div className="text-5xl font-light mb-2">{stats?.totalUsers || 0}</div>
                        <div className="text-xs text-gray-400 tracking-widest">TOTAL USERS</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/20 to-transparent border border-blue-500/30 rounded-3xl p-8">
                        <div className="text-5xl font-light mb-2">{stats?.totalOrders || 0}</div>
                        <div className="text-xs text-gray-400 tracking-widest">TOTAL ORDERS</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-transparent border border-green-500/30 rounded-3xl p-8">
                        <div className="text-5xl font-light mb-2">₹{stats?.totalRevenue?.toLocaleString() || 0}</div>
                        <div className="text-xs text-gray-400 tracking-widest">TOTAL REVENUE</div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-8 border-b border-white/10 mb-8">
                    {['overview', 'users', 'orders'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveView(tab)}
                            className={`pb-4 text-xs tracking-[0.2em] uppercase transition-colors ${activeView === tab ? 'text-white border-b-2 border-white' : 'text-gray-600 hover:text-gray-400'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* OVERVIEW */}
                {activeView === 'overview' && (
                    <div className="space-y-8">
                        {/* Top Products */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                            <h2 className="text-lg tracking-widest mb-6 border-b border-white/10 pb-4">TOP PRODUCTS</h2>
                            {stats?.topProducts && stats.topProducts.length > 0 ? (
                                <div className="space-y-4">
                                    {stats.topProducts.map((product, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                                            <div>
                                                <div className="font-medium">{product.name}</div>
                                                <div className="text-xs text-gray-500">Sold: {product.count} units</div>
                                            </div>
                                            <div className="text-green-400">₹{product.revenue.toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-8">No product data yet</div>
                            )}
                        </div>

                        {/* Recent Activity */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                                <h3 className="text-sm tracking-widest mb-6 border-b border-white/10 pb-4">RECENT USERS</h3>
                                <div className="space-y-3">
                                    {stats?.recentUsers?.slice(0, 5).map(user => (
                                        <div key={user.id} className="flex justify-between items-center text-sm">
                                            <span>{user.firstName} {user.lastName}</span>
                                            <span className="text-xs text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                                <h3 className="text-sm tracking-widest mb-6 border-b border-white/10 pb-4">RECENT ORDERS</h3>
                                <div className="space-y-3">
                                    {stats?.recentOrders?.slice(0, 5).map(order => (
                                        <div key={order.id} className="flex justify-between items-center text-sm">
                                            <span>#{order.orderNumber}</span>
                                            <span className="text-green-400">₹{order.total.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* USERS */}
                {activeView === 'users' && (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                        <h2 className="text-lg tracking-widest mb-6 border-b border-white/10 pb-4">USER MANAGEMENT</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 text-left">
                                        <th className="pb-4 text-xs tracking-widest text-gray-500">NAME</th>
                                        <th className="pb-4 text-xs tracking-widest text-gray-500">EMAIL</th>
                                        <th className="pb-4 text-xs tracking-widest text-gray-500">JOINED</th>
                                        <th className="pb-4 text-xs tracking-widest text-gray-500">ORDERS</th>
                                        <th className="pb-4 text-xs tracking-widest text-gray-500">ROLE</th>
                                        <th className="pb-4 text-xs tracking-widest text-gray-500">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="py-4">{user.firstName} {user.lastName}</td>
                                            <td className="py-4 text-sm text-gray-400">{user.email}</td>
                                            <td className="py-4 text-sm text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                                            <td className="py-4 text-sm">{user.orderCount}</td>
                                            <td className="py-4">
                                                {user.isAdmin === 1 ? (
                                                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs">ADMIN</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-white/10 text-gray-400 rounded-full text-xs">USER</span>
                                                )}
                                            </td>
                                            <td className="py-4">
                                                {user.isAdmin !== 1 && (
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="text-xs text-red-400 hover:text-red-300 tracking-widest"
                                                    >
                                                        DELETE
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ORDERS */}
                {activeView === 'orders' && (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                        <h2 className="text-lg tracking-widest mb-6 border-b border-white/10 pb-4">ORDER MANAGEMENT</h2>
                        <div className="space-y-4">
                            {orders.map(order => (
                                <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
                                    <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                                        <div>
                                            <h3 className="text-lg tracking-widest mb-1">ORDER #{order.orderNumber}</h3>
                                            <p className="text-xs text-gray-500">{order.customerName} • {order.email}</p>
                                            <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString()}</p>
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <span className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-[10px] tracking-widest uppercase">
                                                {order.status}
                                            </span>
                                            <span className="text-xl font-light">₹{order.total.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-white/5 pt-4 grid gap-3">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <div>
                                                    <p className="tracking-wide">{item.name}</p>
                                                    <p className="text-xs text-gray-500">Size: {item.size} | Qty: {item.quantity}</p>
                                                </div>
                                                <div className="opacity-60">₹{item.price.toLocaleString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
